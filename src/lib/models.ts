import type { Model } from '../types'

export const MODELS: Model[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Most capable OpenAI model, multimodal',
    context_window: 128000,
    supports_vision: true,
    supports_streaming: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and affordable OpenAI model',
    context_window: 128000,
    supports_vision: true,
    supports_streaming: true,
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Most intelligent Claude model',
    context_window: 200000,
    supports_vision: true,
    supports_streaming: true,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Google\'s advanced multimodal model',
    context_window: 1048576,
    supports_vision: true,
    supports_streaming: true,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'Fast and versatile Google model',
    context_window: 1048576,
    supports_vision: true,
    supports_streaming: true,
  },
  {
    id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    name: 'LLaMA 3.1 70B',
    description: 'Fast open model',
    context_window: 131072,
    supports_vision: false,
    supports_streaming: true,
  },
]

export function getModelById(id: string): Model | undefined {
  return MODELS.find((m) => m.id === id)
}
