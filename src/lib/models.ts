import type { Model } from '../types'

export const MODELS: Model[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'puter',
    description: 'Most capable OpenAI model via Puter AI, multimodal',
    context_window: 128000,
    supports_vision: true,
    supports_streaming: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'puter',
    description: 'Fast and affordable OpenAI model via Puter AI',
    context_window: 128000,
    supports_vision: true,
    supports_streaming: true,
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'puter',
    description: 'Most intelligent Claude model via Puter AI',
    context_window: 200000,
    supports_vision: true,
    supports_streaming: true,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'puter',
    description: 'Google\'s advanced multimodal model via Puter AI',
    context_window: 1048576,
    supports_vision: true,
    supports_streaming: true,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'puter',
    description: 'Fast and versatile Google model via Puter AI',
    context_window: 1048576,
    supports_vision: true,
    supports_streaming: true,
  },
  {
    id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    name: 'LLaMA 3.1 70B',
    provider: 'puter',
    description: 'Fast open model via Puter AI',
    context_window: 131072,
    supports_vision: false,
    supports_streaming: true,
  },
]

export const PROVIDER_LABELS: Record<string, string> = {
  puter: 'Puter AI',
}

export function getModelById(id: string): Model | undefined {
  return MODELS.find((m) => m.id === id)
}

export function getModelsByProvider(provider: string): Model[] {
  return MODELS.filter((m) => m.provider === provider)
}
