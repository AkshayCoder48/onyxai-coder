import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import type { Message } from '../../types'
import { Sparkles } from 'lucide-react'

interface ChatAreaProps {
  messages: Message[]
  loading: boolean
  streaming: boolean
  error: string | null
}

export function ChatArea({ messages, loading, streaming, error }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-onyx-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-onyx-900/50 border border-onyx-800 flex items-center justify-center">
          <Sparkles size={28} className="text-onyx-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-200 mb-2">How can I help you today?</h2>
          <p className="text-sm text-gray-500 max-w-md">
            Start a conversation. Ask questions, get code help, brainstorm ideas, or anything else.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-md w-full">
          {SUGGESTIONS.map((s) => (
            <div
              key={s}
              className="border border-gray-800 rounded-xl p-3 text-left hover:border-onyx-700 hover:bg-onyx-900/20 transition-all cursor-default"
            >
              <p className="text-xs text-gray-400">{s}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto pb-4">
        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            streaming={streaming && i === messages.length - 1 && msg.role === 'assistant'}
          />
        ))}
        {error && (
          <div className="mx-4 my-2 p-3 bg-red-900/20 border border-red-800 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

const SUGGESTIONS = [
  'Explain a complex concept simply',
  'Write and review code',
  'Brainstorm ideas for a project',
  'Summarize a document',
]
