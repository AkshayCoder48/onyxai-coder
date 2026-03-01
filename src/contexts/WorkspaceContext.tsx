import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Workspace } from '../types'
import { useTurso } from './TursoContext'

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

const mapWorkspaceRow = (row: Record<string, unknown>): Workspace => ({
  id: String(row.id),
  user_id: String(row.user_id),
  name: String(row.name),
  description: row.description === null || row.description === undefined ? null : String(row.description),
  model_id: String(row.model_id),
  system_prompt: row.system_prompt === null || row.system_prompt === undefined ? null : String(row.system_prompt),
  temperature: Number(row.temperature),
  max_tokens: Number(row.max_tokens),
  created_at: String(row.created_at),
  updated_at: String(row.updated_at),
})

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { turso, userId } = useTurso()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchWorkspaces = useCallback(async () => {
    if (!turso || !userId) {
      setWorkspaces([])
      setActiveWorkspace(null)
      return
    }
    setLoading(true)
    try {
      const result = await turso.execute({
        sql: 'select * from workspaces where user_id = ? order by created_at asc',
        args: [userId],
      })
      const list = (result.rows as Array<Record<string, unknown>>).map(mapWorkspaceRow)
      setWorkspaces(list)
      if (list.length > 0 && !activeWorkspace) {
        setActiveWorkspace(list[0])
      }
    } finally {
      setLoading(false)
    }
  }, [turso, userId, activeWorkspace])

  useEffect(() => {
    fetchWorkspaces()
  }, [turso, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const createWorkspace = useCallback(async (
    data: Omit<Workspace, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  ): Promise<Workspace> => {
    if (!turso || !userId) throw new Error('Not authenticated')
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    const workspace: Workspace = {
      id,
      user_id: userId,
      name: data.name,
      description: data.description ?? null,
      model_id: data.model_id,
      system_prompt: data.system_prompt ?? null,
      temperature: data.temperature,
      max_tokens: data.max_tokens,
      created_at: now,
      updated_at: now,
    }

    await turso.execute({
      sql: `insert into workspaces
        (id, user_id, name, description, model_id, system_prompt, temperature, max_tokens, created_at, updated_at)
        values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        workspace.id,
        workspace.user_id,
        workspace.name,
        workspace.description,
        workspace.model_id,
        workspace.system_prompt,
        workspace.temperature,
        workspace.max_tokens,
        workspace.created_at,
        workspace.updated_at,
      ],
    })

    setWorkspaces((prev) => [...prev, workspace])
    return workspace
  }, [turso, userId])

  const updateWorkspace = useCallback(async (id: string, data: Partial<Workspace>) => {
    if (!turso) throw new Error('Not authenticated')
    const now = new Date().toISOString()
    const current = workspaces.find((workspace) => workspace.id === id)
    const updated = {
      name: data.name ?? current?.name ?? '',
      description: data.description ?? current?.description ?? null,
      model_id: data.model_id ?? current?.model_id ?? 'gpt-4o-mini',
      system_prompt: data.system_prompt ?? current?.system_prompt ?? null,
      temperature: data.temperature ?? current?.temperature ?? 0.7,
      max_tokens: data.max_tokens ?? current?.max_tokens ?? 2048,
    }

    await turso.execute({
      sql: `update workspaces
        set name = ?, description = ?, model_id = ?, system_prompt = ?, temperature = ?, max_tokens = ?, updated_at = ?
        where id = ?`,
      args: [
        updated.name,
        updated.description,
        updated.model_id,
        updated.system_prompt,
        updated.temperature,
        updated.max_tokens,
        now,
        id,
      ],
    })

    setWorkspaces((prev) =>
      prev.map((workspace) => (workspace.id === id ? { ...workspace, ...data, updated_at: now } : workspace)),
    )
    if (activeWorkspace?.id === id) {
      setActiveWorkspace((prev) => (prev ? { ...prev, ...data, updated_at: now } : prev))
    }
  }, [turso, activeWorkspace, workspaces])

  const deleteWorkspace = useCallback(async (id: string) => {
    if (!turso) throw new Error('Not authenticated')
    await turso.execute({
      sql: 'delete from workspaces where id = ?',
      args: [id],
    })
    setWorkspaces((prev) => {
      const filtered = prev.filter((workspace) => workspace.id !== id)
      if (activeWorkspace?.id === id) {
        setActiveWorkspace(filtered[0] ?? null)
      }
      return filtered
    })
  }, [turso, activeWorkspace])

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
