import React, { useRef, useEffect, useState } from 'react'
import { Send, Square } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Model } from '../../types'
import { getAllAvailableModels, PROVIDER_LABELS } from '../../lib/models'

interface ChatInputProps {
  onSend: (content: string) => void
  onStop?: () => void
  disabled?: boolean
  streaming?: boolean
  selectedModel: Model
  onSelectModel: (model: Model) => void
  placeholder?: string
}

export function ChatInput({
  onSend,
  onStop,
  disabled,
  streaming,
  selectedModel,
  onSelectModel,
  placeholder = 'Message OnyxGPT...',
}: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }, [value])

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled || streaming) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const allModels = getAllAvailableModels()
  const grouped = allModels.reduce<Record<string, Model[]>>((acc, m) => {
    const p = m.provider
    if (!acc[p]) acc[p] = []
    acc[p].push(m)
    return acc
  }, {})

  return (
    <div className="border-t border-gray-800 bg-gray-950 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative bg-gray-900 border border-gray-700 rounded-xl focus-within:border-onyx-500 focus-within:ring-1 focus-within:ring-onyx-500 transition-all">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled && !streaming}
            rows={1}
            className="w-full bg-transparent px-4 pt-3 pb-12 text-sm text-gray-100 placeholder:text-gray-500 resize-none focus:outline-none max-h-52 leading-relaxed"
          />

          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <select
                value={selectedModel.id}
                onChange={(e) => {
                  const model = allModels.find((m) => m.id === e.target.value)
                  if (model) onSelectModel(model)
                }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-onyx-500 cursor-pointer"
              >
                {Object.entries(grouped).map(([provider, models]) => (
                  <optgroup key={provider} label={PROVIDER_LABELS[provider] ?? provider}>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <span className="text-xs text-gray-600">
                {selectedModel.context_window.toLocaleString()} ctx
              </span>
            </div>

            <div className="flex items-center gap-2">
              {streaming ? (
                <button
                  onClick={onStop}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-900 rounded-lg text-xs font-medium transition-colors"
                >
                  <Square size={12} fill="currentColor" />
                  Stop
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!value.trim() || disabled}
                  className={cn(
                    'w-8 h-8 flex items-center justify-center rounded-lg transition-all',
                    value.trim() && !disabled
                      ? 'bg-onyx-600 hover:bg-onyx-500 text-white'
                      : 'bg-gray-800 text-gray-600 cursor-not-allowed',
                  )}
                >
                  <Send size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
