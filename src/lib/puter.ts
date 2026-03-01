import type { Message, SendMessageOptions } from '../types'

export interface PuterAIResponse {
  text?: string
  content?: Array<{ text?: string }>
}

function buildMessages(
  history: Message[],
  systemPrompt?: string,
): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
  const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = []
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  for (const msg of history) {
    messages.push({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    })
  }
  return messages
}

export async function* streamPuterChat(
  options: SendMessageOptions,
): AsyncGenerator<string> {
  const { model, systemPrompt, temperature, maxTokens, history, content } = options

  const messages = buildMessages(history, systemPrompt)
  messages.push({ role: 'user', content })

  const puter = (window as unknown as { puter?: {
    ai?: {
      chat: (message: string | unknown, options?: unknown) => Promise<AsyncIterable<PuterAIResponse>>
    }
  } }).puter

  if (!puter?.ai?.chat) {
    throw new Error('Puter AI is not available. Please ensure you are running in a Puter environment.')
  }

  const chatOptions: {
    model: string
    stream: boolean
    temperature?: number
    max_tokens?: number
    tools?: Array<{ type: string }>
  } = {
    model: model.id,
    stream: true,
    temperature: temperature ?? 0.7,
    max_tokens: maxTokens ?? 2048,
    tools: [{ type: 'web_search' }],
  }

  const response = await puter.ai.chat(content, chatOptions)

  for await (const part of response) {
    const text = part?.text ?? part?.content?.[0]?.text
    if (text) {
      yield text
    }
  }
}

export async function* streamChat(
  options: SendMessageOptions,
): AsyncGenerator<string> {
  yield* streamPuterChat(options)
}
