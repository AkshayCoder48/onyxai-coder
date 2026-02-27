import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import type { User, Session } from '@supabase/supabase-js'
import { getSupabase, saveSupabaseConfig, clearSupabaseConfig } from '../lib/supabase'

interface SupabaseContextValue {
  supabase: SupabaseClient | null
  user: User | null
  session: Session | null
  loading: boolean
  configured: boolean
  configure: (url: string, anonKey: string) => Promise<void>
  disconnect: () => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName?: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextValue | null>(null)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(getSupabase)
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const configured = supabase !== null

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const configure = useCallback(async (url: string, anonKey: string) => {
    saveSupabaseConfig(url, anonKey)
    const client = getSupabase()
    setSupabase(client)
    setLoading(true)
    if (client) {
      const { data } = await client.auth.getSession()
      setSession(data.session)
      setUser(data.session?.user ?? null)
    }
    setLoading(false)
  }, [])

  const disconnect = useCallback(() => {
    clearSupabaseConfig()
    setSupabase(null)
    setUser(null)
    setSession(null)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [supabase])

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
  }, [supabase])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [supabase])

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
  }, [supabase])

  return (
    <SupabaseContext.Provider
      value={{
        supabase,
        user,
        session,
        loading,
        configured,
        configure,
        disconnect,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
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
