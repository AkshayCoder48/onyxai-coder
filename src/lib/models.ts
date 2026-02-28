import type { Model } from '../types'
import { isPuterAvailable } from './puter'

export const MODELS: Model[] = [
  // OpenAI
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Most capable OpenAI model, multimodal',
    context_window: 128000,
    supports_vision: true,
    supports_streaming: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Fast and affordable OpenAI model',
    context_window: 128000,
    supports_vision: true,
    supports_streaming: true,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'Powerful model with 128k context',
    context_window: 128000,
    supports_vision: true,
    supports_streaming: true,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    description: 'Fast, cost-effective model',
    context_window: 16385,
    supports_vision: false,
    supports_streaming: true,
  },
  // Anthropic
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Most intelligent Claude model',
    context_window: 200000,
    supports_vision: true,
    supports_streaming: true,
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    description: 'Fast and compact Claude model',
    context_window: 200000,
    supports_vision: true,
    supports_streaming: true,
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    description: 'Powerful model for complex tasks',
    context_window: 200000,
    supports_vision: true,
    supports_streaming: true,
  },
  // Google
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    description: 'Google\'s advanced multimodal model',
    context_window: 1048576,
    supports_vision: true,
    supports_streaming: true,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'google',
    description: 'Fast and versatile Google model',
    context_window: 1048576,
    supports_vision: true,
    supports_streaming: true,
  },
  // Mistral
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large',
    provider: 'mistral',
    description: 'Most capable Mistral model',
    context_window: 128000,
    supports_vision: false,
    supports_streaming: true,
  },
  // Groq
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    provider: 'groq',
    description: 'Ultra-fast inference via Groq',
    context_window: 32768,
    supports_vision: false,
    supports_streaming: true,
  },
  {
    id: 'llama-3.1-70b-versatile',
    name: 'LLaMA 3.1 70B',
    provider: 'groq',
    description: 'Fast open model via Groq',
    context_window: 131072,
    supports_vision: false,
    supports_streaming: true,
  },
]

export const PUTER_MODELS: Model[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o (Puter)',
    provider: 'custom',
    description: 'GPT-4o via Puter AI',
    context_window: 128000,
    supports_vision: true,
    supports_streaming: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini (Puter)',
    provider: 'custom',
    description: 'GPT-4o Mini via Puter AI',
    context_window: 128000,
    supports_vision: true,
    supports_streaming: true,
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet (Puter)',
    provider: 'custom',
    description: 'Claude 3.5 Sonnet via Puter AI',
    context_window: 200000,
    supports_vision: true,
    supports_streaming: true,
  },
]

export const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  mistral: 'Mistral',
  groq: 'Groq',
  cohere: 'Cohere',
  custom: 'Custom',
  puter: 'Puter AI',
}

export function getModelById(id: string): Model | undefined {
  // Check if Puter is available and return Puter models if needed
  const allModels = isPuterAvailable() ? [...MODELS, ...PUTER_MODELS] : MODELS
  return allModels.find((m) => m.id === id)
}

export function getModelsByProvider(provider: string): Model[] {
  const allModels = isPuterAvailable() ? [...MODELS, ...PUTER_MODELS] : MODELS
  return allModels.filter((m) => m.provider === provider)
}

export function getAllAvailableModels(): Model[] {
  return isPuterAvailable() ? [...MODELS, ...PUTER_MODELS] : MODELS
}
