import { useState, useEffect, useCallback, useRef } from 'react'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { useApiKeys } from '../contexts/ApiKeyContext'
import { useConversations } from '../hooks/useConversations'
import { useMessages } from '../hooks/useMessages'
import { MODELS, getModelById } from '../lib/models'
import { generateTitle } from '../lib/utils'
import type { Model, Workspace } from '../types'
import { Edit2, ChevronDown } from 'lucide-react'
import { WorkspaceModal } from '../components/workspace/WorkspaceModal'
import { SettingsModal } from '../components/settings/SettingsModal'
import { ChatArea } from '../components/chat/ChatArea'
import { ChatInput } from '../components/chat/ChatInput'
import { cn } from '../lib/utils'
import toast from 'react-hot-toast'

export function ChatPage() {
  const { workspaces, activeWorkspace, setActiveWorkspace, createWorkspace, updateWorkspace } = useWorkspace()
  const { getKeyForProvider } = useApiKeys()

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)

  const defaultModel = activeWorkspace
    ? getModelById(activeWorkspace.model_id) ?? MODELS[0]
    : MODELS[0]
  const [selectedModel, setSelectedModel] = useState<Model>(defaultModel)
  const abortRef = useRef<AbortController | null>(null)

  const { conversations, loading: convsLoading, createConversation, updateConversationTitle, deleteConversation, touchConversation } =
    useConversations(activeWorkspace?.id)

  const { messages, loading: msgsLoading, streaming, error, fetchMessages, sendMessage, clearMessages } =
    useMessages(activeConversationId ?? undefined)

  useEffect(() => {
    if (activeWorkspace) {
      const model = getModelById(activeWorkspace.model_id) ?? MODELS[0]
      setSelectedModel(model)
    }
  }, [activeWorkspace])

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages()
    } else {
      clearMessages()
    }
  }, [activeConversationId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectConversation = useCallback((conv: { id: string }) => {
    setActiveConversationId(conv.id)
  }, [])

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null)
  }, [])

  const handleDeleteConversation = useCallback(async (id: string) => {
    await deleteConversation(id)
    if (activeConversationId === id) {
      setActiveConversationId(null)
    }
  }, [deleteConversation, activeConversationId])

  const handleSend = useCallback(async (content: string) => {
    const apiKey = getKeyForProvider(selectedModel.provider)
    if (!apiKey) {
      toast.error(`No API key for ${selectedModel.provider}. Add one in Settings.`)
      setSettingsOpen(true)
      return
    }

    let convId = activeConversationId

    if (!convId) {
      if (!activeWorkspace) {
        toast.error('Select a workspace first')
        return
      }
      try {
        const title = generateTitle(content)
        const conv = await createConversation(title)
        convId = conv.id
        setActiveConversationId(convId)
      } catch {
        toast.error('Failed to create conversation')
        return
      }
    }

    try {
      await sendMessage(
        {
          conversationId: convId,
          content,
          model: selectedModel,
          apiKey,
          systemPrompt: activeWorkspace?.system_prompt ?? undefined,
          temperature: activeWorkspace?.temperature,
          maxTokens: activeWorkspace?.max_tokens,
        },
      )

      touchConversation(convId)

      if (messages.length === 0) {
        const autoTitle = generateTitle(content)
        updateConversationTitle(convId, autoTitle).catch(() => {})
      }
    } catch (err) {
      if (err instanceof Error && err.message !== 'AbortError') {
        toast.error(err.message || 'Failed to send message')
      }
    }
  }, [
    activeConversationId,
    activeWorkspace,
    selectedModel,
    getKeyForProvider,
    createConversation,
    sendMessage,
    touchConversation,
    messages.length,
    updateConversationTitle,
  ])

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const handleSelectWorkspace = useCallback((ws: Workspace) => {
    setActiveWorkspace(ws)
    setActiveConversationId(null)
    setWorkspaceMenuOpen(false)
  }, [setActiveWorkspace])

  const handleCreateWorkspace = useCallback(() => {
    setEditingWorkspace(null)
    setWorkspaceModalOpen(true)
  }, [])

  const handleSaveWorkspace = useCallback(async (data: Omit<Workspace, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editingWorkspace) {
      await updateWorkspace(editingWorkspace.id, data)
    } else {
      const ws = await createWorkspace(data)
      setActiveWorkspace(ws)
    }
  }, [editingWorkspace, updateWorkspace, createWorkspace, setActiveWorkspace])

  return (
    <div className="flex h-full">
      {/* Conversations Sidebar */}
      <div className="w-64 border-r border-gray-800 bg-gray-950 flex flex-col">
        {/* Workspace Selector */}
        <div className="p-3 border-b border-gray-800">
          <div className="relative">
            <button
              onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors"
            >
              <span className="text-sm font-medium text-gray-200 truncate">
                {activeWorkspace?.name ?? 'Select Workspace'}
              </span>
              <ChevronDown size={16} className={cn("text-gray-500 transition-transform", workspaceMenuOpen && "rotate-180")} />
            </button>

            {workspaceMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setWorkspaceMenuOpen(false)}
                />
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => handleSelectWorkspace(ws)}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm transition-colors',
                        activeWorkspace?.id === ws.id
                          ? 'bg-onyx-900 text-onyx-300'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200',
                      )}
                    >
                      {ws.name}
                    </button>
                  ))}
                  <div className="border-t border-gray-800" />
                  <button
                    onClick={() => {
                      setWorkspaceMenuOpen(false)
                      handleCreateWorkspace()
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
                  >
                    + New Workspace
                  </button>
                </div>
              </>
            )}
          </div>

          {activeWorkspace && (
            <button
              onClick={() => {
                setEditingWorkspace(activeWorkspace)
                setWorkspaceModalOpen(true)
              }}
              className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <Edit2 size={12} />
              Edit workspace
            </button>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="flex items-center justify-between px-2 py-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Conversations</span>
            <button
              onClick={handleNewConversation}
              className="text-xs text-onyx-400 hover:text-onyx-300 transition-colors"
            >
              + New
            </button>
          </div>

          {convsLoading ? (
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
                    'group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors',
                    activeConversationId === conv.id
                      ? 'bg-gray-800'
                      : 'hover:bg-gray-900',
                  )}
                  onClick={() => handleSelectConversation(conv)}
                >
                  <span className={cn(
                    'flex-1 text-xs truncate',
                    activeConversationId === conv.id ? 'text-gray-200' : 'text-gray-400',
                  )}>
                    {conv.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteConversation(conv.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatArea
          messages={messages}
          loading={msgsLoading}
          streaming={streaming}
          error={error}
        />

        <ChatInput
          onSend={handleSend}
          onStop={handleStop}
          disabled={!activeWorkspace}
          streaming={streaming}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          placeholder={
            !activeWorkspace
              ? 'Select or create a workspace first...'
              : 'Message OnyxGPT...'
          }
        />
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <WorkspaceModal
        open={workspaceModalOpen}
        onClose={() => setWorkspaceModalOpen(false)}
        workspace={editingWorkspace}
        onSave={handleSaveWorkspace}
      />
    </div>
  )
}
