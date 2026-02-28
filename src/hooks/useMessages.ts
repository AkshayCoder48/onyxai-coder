import { useState, useCallback } from 'react'
import type { Message, SendMessageOptions } from '../types'
import { useSupabase } from '../contexts/SupabaseContext'
import { streamChat } from '../lib/openai'

const DEMO_MESSAGES_KEY = 'demo_messages'

const getDemoMessages = (): Message[] => {
  try {
    const stored = localStorage.getItem(DEMO_MESSAGES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveDemoMessages = (messages: Message[]) => {
  localStorage.setItem(DEMO_MESSAGES_KEY, JSON.stringify(messages))
}

export function useMessages(conversationId: string | undefined) {
  const { supabase, demoMode } = useSupabase()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    if (demoMode) {
      const demoMsgs = getDemoMessages().filter(m => m.conversation_id === conversationId)
      setMessages(demoMsgs)
      return
    }
    if (!supabase || !conversationId) {
      setMessages([])
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
      if (error) throw error
      setMessages(data as Message[])
    } finally {
      setLoading(false)
    }
  }, [supabase, conversationId, demoMode])

  const sendMessage = useCallback(async (
    options: Omit<SendMessageOptions, 'history' | 'apiKey'>,
    onChunk?: (chunk: string) => void,
  ): Promise<string> => {
    if (!conversationId) throw new Error('No conversation')
    setError(null)

    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      role: 'user',
      content: options.content,
      model_id: options.model.id,
      tokens_used: null,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])

    if (!demoMode && supabase) {
      await supabase.from('messages').insert({
        id: userMsg.id,
        conversation_id: conversationId,
        role: 'user',
        content: options.content,
        model_id: options.model.id,
      })
    } else if (demoMode) {
      const updated = [...getDemoMessages(), userMsg]
      saveDemoMessages(updated)
    }

    const assistantId = crypto.randomUUID()
    const assistantMsg: Message = {
      id: assistantId,
      conversation_id: conversationId,
      role: 'assistant',
      content: '',
      model_id: options.model.id,
      tokens_used: null,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, assistantMsg])
    setStreaming(true)

    let fullContent = ''

    try {
      const currentMessages = [...messages, userMsg]
      const streamOptions: SendMessageOptions = {
        ...options,
        conversationId,
        history: currentMessages,
        apiKey: '',
      }

      for await (const chunk of streamChat(streamOptions)) {
        fullContent += chunk
        onChunk?.(chunk)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: fullContent } : m,
          ),
        )
      }

      const finalAssistantMsg: Message = {
        ...assistantMsg,
        content: fullContent,
      }

      if (!demoMode && supabase) {
        await supabase.from('messages').insert({
          id: assistantId,
          conversation_id: conversationId,
          role: 'assistant',
          content: fullContent,
          model_id: options.model.id,
        })
      } else if (demoMode) {
        const updated = [...getDemoMessages(), finalAssistantMsg]
        saveDemoMessages(updated)
      }

      return fullContent
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMsg)
      setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      throw err
    } finally {
      setStreaming(false)
    }
  }, [supabase, conversationId, messages, demoMode])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    loading,
    streaming,
    error,
    setMessages,
    fetchMessages,
    sendMessage,
    clearMessages,
  }
}
