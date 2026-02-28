import { useState, useEffect, useCallback } from 'react'
import type { Conversation } from '../types'
import { useSupabase } from '../contexts/SupabaseContext'

const DEMO_CONVERSATIONS_KEY = 'demo_conversations'

const getDemoConversations = (): Conversation[] => {
  try {
    const stored = localStorage.getItem(DEMO_CONVERSATIONS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveDemoConversations = (conversations: Conversation[]) => {
  localStorage.setItem(DEMO_CONVERSATIONS_KEY, JSON.stringify(conversations))
}

export function useConversations(workspaceId: string | undefined) {
  const { supabase, user, demoMode } = useSupabase()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)

  const fetchConversations = useCallback(async () => {
    if (demoMode) {
      const demoConvs = getDemoConversations().filter(c => c.workspace_id === workspaceId)
      setConversations(demoConvs)
      return
    }
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
  }, [supabase, user, workspaceId, demoMode])

  useEffect(() => {
    fetchConversations()
  }, [workspaceId, supabase, user, demoMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const createConversation = useCallback(async (title: string): Promise<Conversation> => {
    if (demoMode) {
      if (!workspaceId) throw new Error('No workspace')
      const newConv: Conversation = {
        id: `demo-conv-${Date.now()}`,
        workspace_id: workspaceId,
        user_id: 'demo-user',
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const updated = [newConv, ...getDemoConversations()]
      saveDemoConversations(updated)
      setConversations((prev) => [newConv, ...prev])
      return newConv
    }
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
  }, [supabase, user, workspaceId, demoMode])

  const updateConversationTitle = useCallback(async (id: string, title: string) => {
    if (demoMode) {
      const updated = getDemoConversations().map(c =>
        c.id === id ? { ...c, title, updated_at: new Date().toISOString() } : c
      )
      saveDemoConversations(updated)
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c)),
      )
      return
    }
    if (!supabase) return
    await supabase
      .from('conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', id)
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c)),
    )
  }, [supabase, demoMode])

  const deleteConversation = useCallback(async (id: string) => {
    if (demoMode) {
      const updated = getDemoConversations().filter(c => c.id !== id)
      saveDemoConversations(updated)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      return
    }
    if (!supabase) return
    await supabase.from('conversations').delete().eq('id', id)
    setConversations((prev) => prev.filter((c) => c.id !== id))
  }, [supabase, demoMode])

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
