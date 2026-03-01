import React, { createContext, useContext, useMemo } from 'react'
import type { Client } from '@libsql/client/web'
import { getTursoClient, getTursoConfig } from '../lib/turso'
import { usePuterAuth } from './PuterAuthContext'

interface TursoContextValue {
  turso: Client | null
  userId: string | null
  configured: boolean
}

const TursoContext = createContext<TursoContextValue | null>(null)

export function TursoProvider({ children }: { children: React.ReactNode }) {
  const { user } = usePuterAuth()
  const turso = useMemo(() => getTursoClient(), [])
  const configured = Boolean(getTursoConfig())
  const userId = user?.uuid ?? null

  return (
    <TursoContext.Provider
      value={{
        turso,
        userId,
        configured,
      }}
    >
      {children}
    </TursoContext.Provider>
  )
}

export function useTurso(): TursoContextValue {
  const ctx = useContext(TursoContext)
  if (!ctx) throw new Error('useTurso must be used within TursoProvider')
  return ctx
}
