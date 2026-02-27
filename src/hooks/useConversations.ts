import { useState, useEffect, useCallback } from 'react'
import type { Conversation } from '../types'
import { useSupabase } from '../contexts/SupabaseContext'

export function useConversations(workspaceId: string | undefined) {
  const { supabase, user } = useSupabase()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)

  const fetchConversations = useCallback(async () => {
    if (!supabase || !user || !workspaceId) {
      setConversations([])
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('updated_at', { ascending: false })
      if (error) throw error
      setConversations(data as Conversation[])
    } finally {
      setLoading(false)
    }
  }, [supabase, user, workspaceId])

  useEffect(() => {
    fetchConversations()
  }, [workspaceId, supabase, user]) // eslint-disable-line react-hooks/exhaustive-deps

  const createConversation = useCallback(async (title: string): Promise<Conversation> => {
    if (!supabase || !user || !workspaceId) throw new Error('Not ready')
    const { data, error } = await supabase
      .from('conversations')
      .insert({ workspace_id: workspaceId, user_id: user.id, title })
      .select()
      .single()
    if (error) throw error
    const conv = data as Conversation
    setConversations((prev) => [conv, ...prev])
    return conv
  }, [supabase, user, workspaceId])

  const updateConversationTitle = useCallback(async (id: string, title: string) => {
    if (!supabase) return
    await supabase
      .from('conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', id)
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c)),
    )
  }, [supabase])

  const deleteConversation = useCallback(async (id: string) => {
    if (!supabase) return
    await supabase.from('conversations').delete().eq('id', id)
    setConversations((prev) => prev.filter((c) => c.id !== id))
  }, [supabase])

  const touchConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const conv = prev.find((c) => c.id === id)
      if (!conv) return prev
      const rest = prev.filter((c) => c.id !== id)
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
