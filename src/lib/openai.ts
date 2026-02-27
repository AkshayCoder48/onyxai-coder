import OpenAI from 'openai'
import type { Message, Model, SendMessageOptions } from '../types'

function getOpenAIClient(apiKey: string, baseURL?: string): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL,
    dangerouslyAllowBrowser: true,
  })
}

function buildMessages(
  history: Message[],
  systemPrompt?: string,
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  for (const msg of history) {
    if (msg.role === 'system') continue
    messages.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })
  }
  return messages
}

export async function* streamOpenAIChat(
  options: SendMessageOptions,
): AsyncGenerator<string> {
  const { model, apiKey, systemPrompt, temperature, maxTokens, history, content } = options

  const client = getOpenAIClient(apiKey)
  const messages = buildMessages(history, systemPrompt)
  messages.push({ role: 'user', content })

  const stream = await client.chat.completions.create({
    model: model.id,
    messages,
    stream: true,
    temperature: temperature ?? 0.7,
    max_tokens: maxTokens ?? 2048,
  })

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content
    if (delta) yield delta
  }
}

export async function* streamAnthropicChat(
  options: SendMessageOptions,
): AsyncGenerator<string> {
  const { model, apiKey, systemPrompt, temperature, maxTokens, history, content } = options

  const messages = buildMessages(history, systemPrompt)
  messages.push({ role: 'user', content })

  const anthropicMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content as string }))

  const sysPrompt = messages.find((m) => m.role === 'system')?.content as string | undefined

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: model.id,
      messages: anthropicMessages,
      system: sysPrompt,
      stream: true,
      max_tokens: maxTokens ?? 2048,
      temperature: temperature ?? 0.7,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }))
    throw new Error(err.error?.message || `Anthropic API error: ${response.status}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') return
      try {
        const parsed = JSON.parse(data)
        if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
          yield parsed.delta.text
        }
      } catch {
        // ignore parse errors
      }
    }
  }
}

export async function* streamGoogleChat(
  options: SendMessageOptions,
): AsyncGenerator<string> {
  const { model, apiKey, systemPrompt, temperature, maxTokens, history, content } = options

  const contents = []
  for (const msg of history) {
    if (msg.role === 'system') continue
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })
  }
  contents.push({ role: 'user', parts: [{ text: content }] })

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
        generationConfig: {
          temperature: temperature ?? 0.7,
          maxOutputTokens: maxTokens ?? 2048,
        },
      }),
    },
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }))
    throw new Error(err.error?.message || `Google API error: ${response.status}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      try {
        const parsed = JSON.parse(data)
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) yield text
      } catch {
        // ignore
      }
    }
  }
}

export async function* streamMistralChat(
  options: SendMessageOptions,
): AsyncGenerator<string> {
  const { model, apiKey, systemPrompt, temperature, maxTokens, history, content } = options

  const messages = buildMessages(history, systemPrompt)
  messages.push({ role: 'user', content })

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model.id,
      messages,
      stream: true,
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens ?? 2048,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }))
    throw new Error(err.error?.message || `Mistral API error: ${response.status}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') return
      try {
        const parsed = JSON.parse(data)
        const delta = parsed.choices?.[0]?.delta?.content
        if (delta) yield delta
      } catch {
        // ignore
      }
    }
  }
}

export async function* streamGroqChat(
  options: SendMessageOptions,
): AsyncGenerator<string> {
  const client = getOpenAIClient(options.apiKey, 'https://api.groq.com/openai/v1')
  const { model, systemPrompt, temperature, maxTokens, history, content } = options

  const messages = buildMessages(history, systemPrompt)
  messages.push({ role: 'user', content })

  const stream = await client.chat.completions.create({
    model: model.id,
    messages,
    stream: true,
    temperature: temperature ?? 0.7,
    max_tokens: maxTokens ?? 2048,
  })

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content
    if (delta) yield delta
  }
}

export async function* streamChat(
  options: SendMessageOptions,
): AsyncGenerator<string> {
  const { provider } = options.model
  switch (provider) {
    case 'openai':
      yield* streamOpenAIChat(options)
      break
    case 'anthropic':
      yield* streamAnthropicChat(options)
      break
    case 'google':
      yield* streamGoogleChat(options)
      break
    case 'mistral':
      yield* streamMistralChat(options)
      break
    case 'groq':
      yield* streamGroqChat(options)
      break
    default:
      yield* streamOpenAIChat(options)
  }
}

export function resolveModelProvider(model: Model): string {
  return model.provider
}
