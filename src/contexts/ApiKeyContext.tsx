import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ApiKey } from '../types'
import { useSupabase } from './SupabaseContext'

interface StoredApiKey extends ApiKey {
  plain_key?: string
}

interface ApiKeyContextValue {
  apiKeys: StoredApiKey[]
  loading: boolean
  addApiKey: (provider: ApiKey['provider'], label: string, key: string) => Promise<void>
  removeApiKey: (id: string) => Promise<void>
  getKeyForProvider: (provider: string) => string | null
  refetch: () => Promise<void>
}

const ApiKeyContext = createContext<ApiKeyContextValue | null>(null)

const LOCAL_KEYS_STORAGE = 'onyxgpt_api_keys'

function loadLocalKeys(): StoredApiKey[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEYS_STORAGE)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalKeys(keys: StoredApiKey[]): void {
  localStorage.setItem(LOCAL_KEYS_STORAGE, JSON.stringify(keys))
}

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const { supabase, user } = useSupabase()
  const [apiKeys, setApiKeys] = useState<StoredApiKey[]>(loadLocalKeys)
  const [loading, setLoading] = useState(false)

  const fetchKeys = useCallback(async () => {
    if (!supabase || !user) {
      setApiKeys(loadLocalKeys())
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      const localKeys = loadLocalKeys()
      const merged = [...(data as StoredApiKey[])].map((k) => {
        const local = localKeys.find((l) => l.id === k.id)
        return local ? { ...k, plain_key: local.plain_key } : k
      })
      setApiKeys(merged)
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  useEffect(() => {
    fetchKeys()
  }, [supabase, user]) // eslint-disable-line react-hooks/exhaustive-deps

  const addApiKey = useCallback(async (
    provider: ApiKey['provider'],
    label: string,
    key: string,
  ) => {
    const preview = key.slice(0, 4) + '••••' + key.slice(-4)
    const keyHash = btoa(key).slice(0, 32)

    if (!supabase || !user) {
      const newKey: StoredApiKey = {
        id: crypto.randomUUID(),
        user_id: 'local',
        provider,
        label,
        key_hash: keyHash,
        key_preview: preview,
        plain_key: key,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const updated = [...apiKeys.filter((k) => k.provider !== provider), newKey]
      setApiKeys(updated)
      saveLocalKeys(updated)
      return
    }

    const { data, error } = await supabase
      .from('api_keys')
      .upsert(
        {
          user_id: user.id,
          provider,
          label,
          key_hash: keyHash,
          key_preview: preview,
        },
        { onConflict: 'user_id,provider' },
      )
      .select()
      .single()
    if (error) throw error

    const newKey: StoredApiKey = { ...(data as ApiKey), plain_key: key }
    const updated = [...apiKeys.filter((k) => k.provider !== provider), newKey]
    setApiKeys(updated)
    saveLocalKeys(updated)
  }, [supabase, user, apiKeys])

  const removeApiKey = useCallback(async (id: string) => {
    if (supabase && user) {
      const { error } = await supabase.from('api_keys').delete().eq('id', id)
      if (error) throw error
    }
    const updated = apiKeys.filter((k) => k.id !== id)
    setApiKeys(updated)
    saveLocalKeys(updated)
  }, [supabase, user, apiKeys])

  const getKeyForProvider = useCallback((provider: string): string | null => {
    const key = apiKeys.find((k) => k.provider === provider)
    return key?.plain_key ?? null
  }, [apiKeys])

  return (
    <ApiKeyContext.Provider
      value={{
        apiKeys,
        loading,
        addApiKey,
        removeApiKey,
        getKeyForProvider,
        refetch: fetchKeys,
      }}
    >
      {children}
    </ApiKeyContext.Provider>
  )
}

export function useApiKeys(): ApiKeyContextValue {
  const ctx = useContext(ApiKeyContext)
  if (!ctx) throw new Error('useApiKeys must be used within ApiKeyProvider')
  return ctx
}
