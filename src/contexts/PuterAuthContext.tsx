import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface PuterUser {
  username: string
  email?: string
  uuid: string
  is_temp?: boolean
}

interface PuterAuthContextValue {
  user: PuterUser | null
  loading: boolean
  isSignedIn: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const PuterAuthContext = createContext<PuterAuthContextValue | null>(null)

declare global {
  interface Window {
    puter?: {
      auth?: {
        signIn: () => Promise<PuterUser>
        signOut: () => Promise<void>
        getUser: () => Promise<PuterUser | null>
        isSignedIn: () => Promise<boolean>
      }
    }
  }
}

export function PuterAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PuterUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const puter = window.puter
        if (puter?.auth) {
          const isSignedIn = await puter.auth.isSignedIn()
          if (isSignedIn) {
            const userData = await puter.auth.getUser()
            setUser(userData)
          }
        }
      } catch (error) {
        console.error('Failed to check Puter auth status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const signIn = useCallback(async () => {
    const puter = window.puter
    if (!puter?.auth) {
      throw new Error('Puter is not available. Please ensure you are running in a Puter environment.')
    }

    setLoading(true)
    try {
      const userData = await puter.auth.signIn()
      setUser(userData)
    } catch (error) {
      console.error('Puter sign in failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    const puter = window.puter
    if (!puter?.auth) return

    try {
      await puter.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Puter sign out failed:', error)
      throw error
    }
  }, [])

  return (
    <PuterAuthContext.Provider
      value={{
        user,
        loading,
        isSignedIn: user !== null,
        signIn,
        signOut,
      }}
    >
      {children}
    </PuterAuthContext.Provider>
  )
}

export function usePuterAuth(): PuterAuthContextValue {
  const ctx = useContext(PuterAuthContext)
  if (!ctx) throw new Error('usePuterAuth must be used within PuterAuthProvider')
  return ctx
}
