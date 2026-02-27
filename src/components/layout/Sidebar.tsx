import React, { useState } from 'react'
import {
  MessageSquare,
  Plus,
  Settings,
  Trash2,
  ChevronDown,
  ChevronRight,
  Layers,
  LogOut,
  User,
  Edit2,
  Check,
  X,
} from 'lucide-react'
import { cn, formatDate, truncate } from '../../lib/utils'
import type { Conversation, Workspace } from '../../types'
import { Button } from '../ui/Button'

interface SidebarProps {
  workspaces: Workspace[]
  activeWorkspace: Workspace | null
  conversations: Conversation[]
  activeConversationId: string | null
  loadingConversations: boolean
  userName: string | null
  onSelectWorkspace: (ws: Workspace) => void
  onCreateWorkspace: () => void
  onSelectConversation: (conv: Conversation) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
  onRenameConversation: (id: string, title: string) => void
  onOpenSettings: () => void
  onSignOut: () => void
}

export function Sidebar({
  workspaces,
  activeWorkspace,
  conversations,
  activeConversationId,
  loadingConversations,
  userName,
  onSelectWorkspace,
  onCreateWorkspace,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onOpenSettings,
  onSignOut,
}: SidebarProps) {
  const [workspacesOpen, setWorkspacesOpen] = useState(true)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation()
    setRenamingId(conv.id)
    setRenameValue(conv.title)
  }

  const handleConfirmRename = (id: string) => {
    if (renameValue.trim()) {
      onRenameConversation(id, renameValue.trim())
    }
    setRenamingId(null)
  }

  return (
    <aside className="flex flex-col h-full bg-gray-950 border-r border-gray-800 w-64 shrink-0">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-onyx-600 rounded-lg flex items-center justify-center">
            <MessageSquare size={14} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm tracking-wide">OnyxGPT</span>
        </div>
        <Button
          onClick={onNewConversation}
          className="w-full"
          size="sm"
        >
          <Plus size={14} />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <button
            onClick={() => setWorkspacesOpen((v) => !v)}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors rounded"
          >
            {workspacesOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <Layers size={12} />
            Workspaces
          </button>

          {workspacesOpen && (
            <div className="mt-1 space-y-0.5">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => onSelectWorkspace(ws)}
                  className={cn(
                    'w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors truncate',
                    activeWorkspace?.id === ws.id
                      ? 'bg-onyx-900 text-onyx-300'
                      : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200',
                  )}
                >
                  {ws.name}
                </button>
              ))}
              <button
                onClick={onCreateWorkspace}
                className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-gray-600 hover:text-gray-400 hover:bg-gray-900 transition-colors flex items-center gap-1"
              >
                <Plus size={10} />
                New workspace
              </button>
            </div>
          )}
        </div>

        <div className="p-2 pt-1">
          <p className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Conversations
          </p>

          {loadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-4 h-4 border-2 border-onyx-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-gray-600 px-2 py-3">No conversations yet</p>
          ) : (
            <div className="space-y-0.5">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    'group flex items-center gap-1 rounded-lg transition-colors',
                    activeConversationId === conv.id
                      ? 'bg-gray-800'
                      : 'hover:bg-gray-900',
                  )}
                >
                  {renamingId === conv.id ? (
                    <div className="flex-1 flex items-center gap-1 px-2 py-1.5">
                      <input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirmRename(conv.id)
                          if (e.key === 'Escape') setRenamingId(null)
                        }}
                        className="flex-1 bg-gray-700 rounded px-1.5 py-0.5 text-xs text-gray-100 outline-none focus:ring-1 focus:ring-onyx-500"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={() => handleConfirmRename(conv.id)}
                        className="text-green-500 hover:text-green-400"
                      >
                        <Check size={10} />
                      </button>
                      <button
                        onClick={() => setRenamingId(null)}
                        className="text-gray-500 hover:text-gray-300"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => onSelectConversation(conv)}
                        className="flex-1 text-left px-2 py-1.5 min-w-0"
                      >
                        <p className={cn(
                          'text-xs truncate',
                          activeConversationId === conv.id ? 'text-gray-200' : 'text-gray-400',
                        )}>
                          {truncate(conv.title, 30)}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {formatDate(conv.updated_at)}
                        </p>
                      </button>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 pr-1.5 transition-opacity">
                        <button
                          onClick={(e) => handleStartRename(conv, e)}
                          className="p-1 text-gray-500 hover:text-gray-300 rounded"
                        >
                          <Edit2 size={10} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteConversation(conv.id)
                          }}
                          className="p-1 text-gray-500 hover:text-red-400 rounded"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-gray-800 space-y-1">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-900 transition-colors text-sm"
        >
          <Settings size={14} />
          Settings
        </button>
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-6 h-6 rounded-full bg-onyx-800 flex items-center justify-center">
            <User size={12} className="text-onyx-300" />
          </div>
          <span className="text-xs text-gray-400 truncate flex-1">
            {userName ?? 'Guest'}
          </span>
          <button
            onClick={onSignOut}
            className="text-gray-600 hover:text-gray-300 transition-colors"
            title="Sign out"
          >
            <LogOut size={12} />
          </button>
        </div>
      </div>
    </aside>
  )
}
