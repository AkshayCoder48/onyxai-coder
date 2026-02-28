import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { MindstoreItem, MindstoreCategory } from '../types'
import { useSupabase } from './SupabaseContext'

interface MindstoreContextValue {
  items: MindstoreItem[]
  categories: MindstoreCategory[]
  loading: boolean
  createItem: (data: Omit<MindstoreItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<MindstoreItem>
  updateItem: (id: string, data: Partial<MindstoreItem>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  getItemsByCategory: (category: string | null) => MindstoreItem[]
  getFavoriteItems: () => MindstoreItem[]
  getPrompts: () => MindstoreItem[]
  searchItems: (query: string) => MindstoreItem[]
  refetch: () => Promise<void>
}

const MindstoreContext = createContext<MindstoreContextValue | null>(null)

const DEFAULT_CATEGORIES: MindstoreCategory[] = [
  { id: 'general', name: 'General', color: '#6b7280' },
  { id: 'code', name: 'Code Snippets', color: '#3b82f6' },
  { id: 'prompts', name: 'Prompts', color: '#8b5cf6' },
  { id: 'ideas', name: 'Ideas', color: '#f59e0b' },
  { id: 'notes', name: 'Notes', color: '#10b981' },
]

const LOCAL_ITEMS_KEY = 'onyxgpt_mindstore_items'

function loadLocalItems(): MindstoreItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_ITEMS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalItems(items: MindstoreItem[]): void {
  localStorage.setItem(LOCAL_ITEMS_KEY, JSON.stringify(items))
}

export function MindstoreProvider({ children }: { children: React.ReactNode }) {
  const { supabase, user } = useSupabase()
  const [items, setItems] = useState<MindstoreItem[]>([])
  const [categories] = useState<MindstoreCategory[]>(DEFAULT_CATEGORIES)
  const [loading, setLoading] = useState(false)

  const fetchItems = useCallback(async () => {
    if (!supabase || !user) {
      setItems(loadLocalItems())
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('mindstore_items')
        .select('*')
        .order('updated_at', { ascending: false })
      if (error) throw error
      setItems(data as MindstoreItem[])
      // Sync to local for offline access
      saveLocalItems(data as MindstoreItem[])
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  useEffect(() => {
    fetchItems()
  }, [supabase, user]) // eslint-disable-line react-hooks/exhaustive-deps

  const createItem = useCallback(async (
    data: Omit<MindstoreItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  ): Promise<MindstoreItem> => {
    const now = new Date().toISOString()
    const newItem: MindstoreItem = {
      ...data,
      id: crypto.randomUUID(),
      user_id: user?.id ?? 'local',
      created_at: now,
      updated_at: now,
    }

    if (!supabase || !user) {
      const updated = [newItem, ...items]
      setItems(updated)
      saveLocalItems(updated)
      return newItem
    }

    const { data: saved, error } = await supabase
      .from('mindstore_items')
      .insert(newItem)
      .select()
      .single()
    if (error) throw error
    const item = saved as MindstoreItem
    setItems((prev) => [item, ...prev])
    return item
  }, [supabase, user, items])

  const updateItem = useCallback(async (id: string, data: Partial<MindstoreItem>) => {
    const updates = { ...data, updated_at: new Date().toISOString() }

    if (!supabase || !user) {
      const updated = items.map((i) => (i.id === id ? { ...i, ...updates } : i))
      setItems(updated)
      saveLocalItems(updated)
      return
    }

    const { error } = await supabase
      .from('mindstore_items')
      .update(updates)
      .eq('id', id)
    if (error) throw error
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    )
  }, [supabase, user, items])

  const deleteItem = useCallback(async (id: string) => {
    if (supabase && user) {
      const { error } = await supabase.from('mindstore_items').delete().eq('id', id)
      if (error) throw error
    }
    const updated = items.filter((i) => i.id !== id)
    setItems(updated)
    saveLocalItems(updated)
  }, [supabase, user, items])

  const toggleFavorite = useCallback(async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return
    await updateItem(id, { is_favorite: !item.is_favorite })
  }, [items, updateItem])

  const getItemsByCategory = useCallback((category: string | null) => {
    if (!category) return items
    return items.filter((i) => i.category === category)
  }, [items])

  const getFavoriteItems = useCallback(() => {
    return items.filter((i) => i.is_favorite)
  }, [items])

  const getPrompts = useCallback(() => {
    return items.filter((i) => i.is_prompt)
  }, [items])

  const searchItems = useCallback((query: string) => {
    const q = query.toLowerCase()
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.content.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q)),
    )
  }, [items])

  return (
    <MindstoreContext.Provider
      value={{
        items,
        categories,
        loading,
        createItem,
        updateItem,
        deleteItem,
        toggleFavorite,
        getItemsByCategory,
        getFavoriteItems,
        getPrompts,
        searchItems,
        refetch: fetchItems,
      }}
    >
      {children}
    </MindstoreContext.Provider>
  )
}

export function useMindstore(): MindstoreContextValue {
  const ctx = useContext(MindstoreContext)
  if (!ctx) throw new Error('useMindstore must be used within MindstoreProvider')
  return ctx
}
