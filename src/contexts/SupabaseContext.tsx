import React, { createContext, useContext, useState, useCallback } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import { getSupabase, saveSupabaseConfig, clearSupabaseConfig } from '../lib/supabase'
import { usePuterAuth } from './PuterAuthContext'

interface SupabaseContextValue {
  supabase: SupabaseClient | null
  userId: string | null
  loading: boolean
  configured: boolean
  configure: (url: string, anonKey: string) => Promise<void>
  disconnect: () => void
}

const SupabaseContext = createContext<SupabaseContextValue | null>(null)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { user } = usePuterAuth()
  const [supabase, setSupabase] = useState<SupabaseClient | null>(getSupabase)

  const configured = supabase !== null
  const userId = user?.uuid ?? null

  const configure = useCallback(async (url: string, anonKey: string) => {
    saveSupabaseConfig(url, anonKey)
    const client = getSupabase()
    setSupabase(client)
  }, [])

  const disconnect = useCallback(() => {
    clearSupabaseConfig()
    setSupabase(null)
  }, [])

  return (
    <SupabaseContext.Provider
      value={{
        supabase,
        userId,
        loading: false,
        configured,
        configure,
        disconnect,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase(): SupabaseContextValue {
  const ctx = useContext(SupabaseContext)
  if (!ctx) throw new Error('useSupabase must be used within SupabaseProvider')
  return ctx
}
