import { useState, useCallback } from 'react'
import type { Message, SendMessageOptions } from '../types'
import { useSupabase } from '../contexts/SupabaseContext'
import { streamChat } from '../lib/openai'

export function useMessages(conversationId: string | undefined) {
  const { supabase } = useSupabase()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
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
  }, [supabase, conversationId])

  const sendMessage = useCallback(async (
    options: Omit<SendMessageOptions, 'history' | 'apiKey'>,
    onChunk?: (chunk: string) => void,
  ): Promise<string> => {
    if (!supabase || !conversationId) throw new Error('Not ready')
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

    await supabase.from('messages').insert({
      id: userMsg.id,
      conversation_id: conversationId,
      role: 'user',
      content: options.content,
      model_id: options.model.id,
    })

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

      await supabase.from('messages').insert({
        id: assistantId,
        conversation_id: conversationId,
        role: 'assistant',
        content: fullContent,
        model_id: options.model.id,
      })

      return fullContent
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMsg)
      setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      throw err
    } finally {
      setStreaming(false)
    }
  }, [supabase, conversationId, messages])

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
