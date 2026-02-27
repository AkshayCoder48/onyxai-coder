import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check, User, Cpu } from 'lucide-react'
import type { Message } from '../../types'
import { cn } from '../../lib/utils'

interface MessageBubbleProps {
  message: Message
  streaming?: boolean
}

function CodeBlock({ children, className }: { children?: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false)
  const code = String(children).replace(/\n$/, '')
  const language = className?.replace('language-', '') ?? ''

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group/code my-3 rounded-lg overflow-hidden border border-gray-800">
      {language && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800/80 border-b border-gray-800">
          <span className="text-xs text-gray-400 font-mono">{language}</span>
          <button
            onClick={handleCopy}
            className="text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1 text-xs"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
      {!language && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity text-gray-500 hover:text-gray-300 bg-gray-800 rounded p-1"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      )}
      <pre className="bg-gray-900 p-4 overflow-x-auto text-sm">
        <code className="text-gray-200 font-mono text-xs leading-relaxed">{code}</code>
      </pre>
    </div>
  )
}

export function MessageBubble({ message, streaming }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('group flex gap-3 px-4 py-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
        isUser ? 'bg-onyx-700' : 'bg-gray-800',
      )}>
        {isUser ? (
          <User size={13} className="text-onyx-300" />
        ) : (
          <Cpu size={13} className="text-gray-400" />
        )}
      </div>

      <div className={cn('flex flex-col gap-1 max-w-[80%]', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'bg-onyx-700 text-white rounded-tr-sm'
              : 'bg-gray-900 text-gray-100 border border-gray-800 rounded-tl-sm',
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose-chat">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const isBlock = className?.startsWith('language-')
                    if (isBlock) {
                      return <CodeBlock className={className}>{children}</CodeBlock>
                    }
                    return (
                      <code
                        className="bg-gray-800 text-purple-300 px-1.5 py-0.5 rounded text-xs font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  },
                  pre({ children }) {
                    return <>{children}</>
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
              {streaming && (
                <span className="inline-block w-1.5 h-4 bg-onyx-400 animate-pulse ml-0.5 rounded-sm" />
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-gray-400 flex items-center gap-1 text-xs px-1"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
