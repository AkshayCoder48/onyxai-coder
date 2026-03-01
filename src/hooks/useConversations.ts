import { useState, useEffect, useCallback } from 'react'
import type { Conversation } from '../types'
import { useTurso } from '../contexts/TursoContext'

const mapConversationRow = (row: Record<string, unknown>): Conversation => ({
  id: String(row.id),
  workspace_id: String(row.workspace_id),
  user_id: String(row.user_id),
  title: String(row.title),
  created_at: String(row.created_at),
  updated_at: String(row.updated_at),
  message_count: row.message_count === null || row.message_count === undefined ? undefined : Number(row.message_count),
})

export function useConversations(workspaceId: string | undefined) {
  const { turso, userId } = useTurso()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)

  const fetchConversations = useCallback(async () => {
    if (!turso || !userId || !workspaceId) {
      setConversations([])
      return
    }
    setLoading(true)
    try {
      const result = await turso.execute({
        sql: 'select * from conversations where workspace_id = ? and user_id = ? order by updated_at desc',
        args: [workspaceId, userId],
      })
      const list = (result.rows as Array<Record<string, unknown>>).map(mapConversationRow)
      setConversations(list)
    } finally {
      setLoading(false)
    }
  }, [turso, userId, workspaceId])

  useEffect(() => {
    fetchConversations()
  }, [workspaceId, turso, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const createConversation = useCallback(async (title: string): Promise<Conversation> => {
    if (!turso || !userId || !workspaceId) throw new Error('Not ready')
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    const conversation: Conversation = {
      id,
      workspace_id: workspaceId,
      user_id: userId,
      title,
      created_at: now,
      updated_at: now,
    }

    await turso.execute({
      sql: 'insert into conversations (id, workspace_id, user_id, title, created_at, updated_at) values (?, ?, ?, ?, ?, ?)',
      args: [conversation.id, conversation.workspace_id, conversation.user_id, conversation.title, conversation.created_at, conversation.updated_at],
    })

    setConversations((prev) => [conversation, ...prev])
    return conversation
  }, [turso, userId, workspaceId])

  const updateConversationTitle = useCallback(async (id: string, title: string) => {
    if (!turso) return
    const now = new Date().toISOString()
    await turso.execute({
      sql: 'update conversations set title = ?, updated_at = ? where id = ?',
      args: [title, now, id],
    })
    setConversations((prev) =>
      prev.map((conversation) => (conversation.id === id ? { ...conversation, title, updated_at: now } : conversation)),
    )
  }, [turso])

  const deleteConversation = useCallback(async (id: string) => {
    if (!turso) return
    await turso.execute({
      sql: 'delete from conversations where id = ?',
      args: [id],
    })
    setConversations((prev) => prev.filter((conversation) => conversation.id !== id))
  }, [turso])

  const touchConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const conv = prev.find((conversation) => conversation.id === id)
      if (!conv) return prev
      const rest = prev.filter((conversation) => conversation.id !== id)
      return [{ ...conv, updated_at: new Date().toISOString() }, ...rest]
    })
  }, [])

  return {
    conversations,
    loading,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    touchConversation,
    refetch: fetchConversations,
  }
}
