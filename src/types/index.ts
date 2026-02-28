export interface SupabaseConfig {
  url: string
  anonKey: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface ApiKey {
  id: string
  user_id: string
  provider: 'openai' | 'anthropic' | 'google' | 'mistral' | 'cohere' | 'groq' | 'custom'
  label: string
  key_hash: string
  key_preview: string
  created_at: string
  updated_at: string
}

export interface Model {
  id: string
  name: string
  provider: ApiKey['provider'] | 'custom'
  description: string
  context_window: number
  supports_vision: boolean
  supports_streaming: boolean
}

export interface Workspace {
  id: string
  user_id: string
  name: string
  description: string | null
  model_id: string
  system_prompt: string | null
  temperature: number
  max_tokens: number
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  workspace_id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  message_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  model_id: string | null
  tokens_used: number | null
  created_at: string
}

export interface SharedConversation {
  id: string
  conversation_id: string
  user_id: string
  share_token: string
  is_public: boolean
  created_at: string
}

export type ChatStatus = 'idle' | 'loading' | 'streaming' | 'error'

export interface SendMessageOptions {
  conversationId: string
  content: string
  model: Model
  apiKey: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  history: Message[]
}

// Mindstore types
export interface MindstoreItem {
  id: string
  user_id: string
  title: string
  content: string
  category: string | null
  tags: string[]
  is_prompt: boolean
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface MindstoreCategory {
  id: string
  name: string
  color: string
}

// Image Gallery types
export interface GalleryImage {
  id: string
  user_id: string
  filename: string
  url: string
  thumbnail_url: string | null
  size: number
  mime_type: string
  width: number | null
  height: number | null
  prompt: string | null
  model: string | null
  tags: string[]
  created_at: string
}

// Theme types
export type ThemeMode = 'dark' | 'light' | 'system'
export type AccentColor = 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'cyan'

export interface ThemeSettings {
  mode: ThemeMode
  accentColor: AccentColor
}

// Puter AI types
export interface PuterAIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface PuterAIStreamOptions {
  model: string
  messages: PuterAIMessage[]
  temperature?: number
  max_tokens?: number
}
