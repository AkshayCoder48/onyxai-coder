import { useState, useCallback } from 'react'
import type { Message, SendMessageOptions } from '../types'
import { useTurso } from '../contexts/TursoContext'
import { streamChat } from '../lib/puter'

const mapMessageRow = (row: Record<string, unknown>): Message => ({
  id: String(row.id),
  conversation_id: String(row.conversation_id),
  role: row.role as Message['role'],
  content: String(row.content),
  model_id: row.model_id === null || row.model_id === undefined ? null : String(row.model_id),
  tokens_used: row.tokens_used === null || row.tokens_used === undefined ? null : Number(row.tokens_used),
  created_at: String(row.created_at),
})

export function useMessages(conversationId: string | undefined) {
  const { turso } = useTurso()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    if (!turso || !conversationId) {
      setMessages([])
      return
    }
    setLoading(true)
    try {
      const result = await turso.execute({
        sql: 'select * from messages where conversation_id = ? order by created_at asc',
        args: [conversationId],
      })
      const list = (result.rows as Array<Record<string, unknown>>).map(mapMessageRow)
      setMessages(list)
    } finally {
      setLoading(false)
    }
  }, [turso, conversationId])

  const sendMessage = useCallback(async (
    options: Omit<SendMessageOptions, 'history' | 'apiKey'>,
    onChunk?: (chunk: string) => void,
  ): Promise<string> => {
    if (!turso || !conversationId) throw new Error('Not ready')
    setError(null)

    const now = new Date().toISOString()

    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      role: 'user',
      content: options.content,
      model_id: options.model.id,
      tokens_used: null,
      created_at: now,
    }

    setMessages((prev) => [...prev, userMsg])

    await turso.execute({
      sql: 'insert into messages (id, conversation_id, role, content, model_id, tokens_used, created_at) values (?, ?, ?, ?, ?, ?, ?)',
      args: [
        userMsg.id,
        userMsg.conversation_id,
        userMsg.role,
        userMsg.content,
        userMsg.model_id,
        userMsg.tokens_used,
        userMsg.created_at,
      ],
    })

    const assistantId = crypto.randomUUID()
    const assistantMsg: Message = {
      id: assistantId,
      conversation_id: conversationId,
      role: 'assistant',
      content: '',
      model_id: options.model.id,
      tokens_used: null,
      created_at: now,
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
          prev.map((message) =>
            message.id === assistantId ? { ...message, content: fullContent } : message,
          ),
        )
      }

      await turso.execute({
        sql: 'insert into messages (id, conversation_id, role, content, model_id, tokens_used, created_at) values (?, ?, ?, ?, ?, ?, ?)',
        args: [
          assistantId,
          conversationId,
          'assistant',
          fullContent,
          options.model.id,
          null,
          new Date().toISOString(),
        ],
      })

      return fullContent
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMsg)
      setMessages((prev) => prev.filter((message) => message.id !== assistantId))
      throw err
    } finally {
      setStreaming(false)
    }
  }, [turso, conversationId, messages])

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
