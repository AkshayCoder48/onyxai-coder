import { createClient, type Client } from '@libsql/client/web'

let clientInstance: Client | null = null

export function getTursoConfig(): { url: string; authToken: string } | null {
  const url = import.meta.env.TURSO_DATABASE_URL
  const authToken = import.meta.env.TURSO_AUTH_TOKEN

  if (!url || !authToken) return null
  return { url, authToken }
}

export function getTursoClient(): Client | null {
  if (clientInstance) return clientInstance
  const config = getTursoConfig()
  if (!config) return null
  clientInstance = createClient(config)
  return clientInstance
}

export function requireTurso(): Client {
  const client = getTursoClient()
  if (!client) throw new Error('Turso is not configured')
  return client
}
