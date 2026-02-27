import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = localStorage.getItem('supabase_url')
  const anonKey = localStorage.getItem('supabase_anon_key')
  if (!url || !anonKey) return null
  return { url, anonKey }
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem('supabase_url', url)
  localStorage.setItem('supabase_anon_key', anonKey)
  supabaseInstance = null
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem('supabase_url')
  localStorage.removeItem('supabase_anon_key')
  supabaseInstance = null
}

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance
  const config = getSupabaseConfig()
  if (!config) return null
  supabaseInstance = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
  return supabaseInstance
}

export function requireSupabase(): SupabaseClient {
  const client = getSupabase()
  if (!client) throw new Error('Supabase not configured')
  return client
}
