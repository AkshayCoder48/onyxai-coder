import type { PuterAIMessage, PuterAIStreamOptions } from '../types'

// Puter AI integration
// Puter.js provides a global puter object when running in Puter environment

declare global {
  interface Window {
    puter?: {
      ai?: {
        chat: (messages: PuterAIMessage[], options?: { model?: string; stream?: boolean }) => Promise<{
          message?: { content: string }
          [Symbol.asyncIterator]?: () => AsyncIterator<{ text?: string; content?: string }>
        }>
      }
    }
  }
}

export function isPuterAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.puter?.ai
}

export async function* streamPuterAI(
  options: PuterAIStreamOptions,
): AsyncGenerator<string> {
  if (!isPuterAvailable()) {
    throw new Error('Puter AI is not available. Make sure you are running in Puter environment.')
  }

  const { model, messages } = options

  const response = await window.puter!.ai!.chat(messages, {
    model,
    stream: true,
  })

  // Handle streaming response
  if (response && typeof response[Symbol.asyncIterator] === 'function') {
    for await (const chunk of response as AsyncIterable<{ text?: string; content?: string }>) {
      const text = chunk.text ?? chunk.content ?? ''
      if (text) yield text
    }
  } else {
    // Non-streaming fallback
    const text = response?.message?.content ?? ''
    if (text) yield text
  }
}

export async function chatPuterAI(
  options: PuterAIStreamOptions,
): Promise<string> {
  if (!isPuterAvailable()) {
    throw new Error('Puter AI is not available. Make sure you are running in Puter environment.')
  }

  const { model, messages } = options

  const response = await window.puter!.ai!.chat(messages, {
    model,
    stream: false,
  })

  return response?.message?.content ?? ''
}

export const PUTER_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'puter' as const },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'puter' as const },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'puter' as const },
  { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', provider: 'puter' as const },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'puter' as const },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'puter' as const },
  { id: 'mistral-large', name: 'Mistral Large', provider: 'puter' as const },
]

// Extend the models list to include Puter models when available
export function getAvailableModels() {
  if (isPuterAvailable()) {
    return PUTER_MODELS
  }
  return []
}
