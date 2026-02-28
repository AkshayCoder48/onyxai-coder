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

const DEMO_WORKSPACE: Workspace = {
  id: 'demo-workspace',
  user_id: 'demo-user',
  name: 'General',
  description: 'Default workspace',
  model_id: 'gpt-4o-mini',
  system_prompt: 'You are a helpful AI assistant.',
  temperature: 0.7,
  max_tokens: 2048,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { supabase, user, demoMode } = useSupabase()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchWorkspaces = useCallback(async () => {
    if (demoMode) {
      setWorkspaces([DEMO_WORKSPACE])
      if (!activeWorkspace) {
        setActiveWorkspace(DEMO_WORKSPACE)
      }
      return
    }
    if (!supabase || !user) {
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
  }, [supabase, user, activeWorkspace, demoMode])

  useEffect(() => {
    fetchWorkspaces()
  }, [supabase, user, demoMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const createWorkspace = useCallback(async (
    data: Omit<Workspace, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  ): Promise<Workspace> => {
    if (demoMode) {
      const newWorkspace: Workspace = {
        ...data,
        id: `demo-ws-${Date.now()}`,
        user_id: 'demo-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setWorkspaces((prev) => [...prev, newWorkspace])
      return newWorkspace
    }
    if (!supabase || !user) throw new Error('Not authenticated')
    const { data: ws, error } = await supabase
      .from('workspaces')
      .insert({ ...data, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    const workspace = ws as Workspace
    setWorkspaces((prev) => [...prev, workspace])
    return workspace
  }, [supabase, user, demoMode])

  const updateWorkspace = useCallback(async (id: string, data: Partial<Workspace>) => {
    if (demoMode) {
      setWorkspaces((prev) =>
        prev.map((w) => (w.id === id ? { ...w, ...data, updated_at: new Date().toISOString() } : w)),
      )
      if (activeWorkspace?.id === id) {
        setActiveWorkspace((prev) => (prev ? { ...prev, ...data, updated_at: new Date().toISOString() } : prev))
      }
      return
    }
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
  }, [supabase, activeWorkspace, demoMode])

  const deleteWorkspace = useCallback(async (id: string) => {
    if (demoMode) {
      setWorkspaces((prev) => {
        const filtered = prev.filter((w) => w.id !== id)
        if (activeWorkspace?.id === id) {
          setActiveWorkspace(filtered[0] ?? null)
        }
        return filtered
      })
      return
    }
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
  }, [supabase, activeWorkspace, demoMode])

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
