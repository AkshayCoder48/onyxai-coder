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

export interface Model {
  id: string
  name: string
  provider: 'puter'
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
