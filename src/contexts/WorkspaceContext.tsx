import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Workspace } from '../types'
import { useSupabase } from './SupabaseContext'

interface WorkspaceContextValue {
  workspaces: Workspace[]
  activeWorkspace: Workspace | null
  loading: boolean
  setActiveWorkspace: (workspace: Workspace) => void
  createWorkspace: (data: Omit<Workspace, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Workspace>
  updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<void>
  deleteWorkspace: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

const DEFAULT_WORKSPACE_TEMPLATE = {
  name: 'General',
  description: 'Default workspace',
  model_id: 'gpt-4o-mini',
  system_prompt: 'You are a helpful AI assistant.',
  temperature: 0.7,
  max_tokens: 2048,
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { supabase, userId } = useSupabase()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchWorkspaces = useCallback(async () => {
    if (!supabase || !userId) {
      setWorkspaces([])
      setActiveWorkspace(null)
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      const list = data as Workspace[]
      setWorkspaces(list)
      if (list.length > 0 && !activeWorkspace) {
        setActiveWorkspace(list[0])
      }
    } finally {
      setLoading(false)
    }
  }, [supabase, userId, activeWorkspace])

  useEffect(() => {
    fetchWorkspaces()
  }, [supabase, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const createWorkspace = useCallback(async (
    data: Omit<Workspace, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  ): Promise<Workspace> => {
    if (!supabase || !userId) throw new Error('Not authenticated')
    const { data: ws, error } = await supabase
      .from('workspaces')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) throw error
    const workspace = ws as Workspace
    setWorkspaces((prev) => [...prev, workspace])
    return workspace
  }, [supabase, userId])

  const updateWorkspace = useCallback(async (id: string, data: Partial<Workspace>) => {
    if (!supabase) throw new Error('Not authenticated')
    const { error } = await supabase
      .from('workspaces')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...data } : w)),
    )
    if (activeWorkspace?.id === id) {
      setActiveWorkspace((prev) => (prev ? { ...prev, ...data } : prev))
    }
  }, [supabase, activeWorkspace])

  const deleteWorkspace = useCallback(async (id: string) => {
    if (!supabase) throw new Error('Not authenticated')
    const { error } = await supabase.from('workspaces').delete().eq('id', id)
    if (error) throw error
    setWorkspaces((prev) => {
      const filtered = prev.filter((w) => w.id !== id)
      if (activeWorkspace?.id === id) {
        setActiveWorkspace(filtered[0] ?? null)
      }
      return filtered
    })
  }, [supabase, activeWorkspace])

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        loading,
        setActiveWorkspace,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        refetch: fetchWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}

export { DEFAULT_WORKSPACE_TEMPLATE }
