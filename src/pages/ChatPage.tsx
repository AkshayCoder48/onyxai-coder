import { useState, useEffect, useCallback, useRef } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { ChatArea } from '../components/chat/ChatArea'
import { ChatInput } from '../components/chat/ChatInput'
import { SettingsModal } from '../components/settings/SettingsModal'
import { WorkspaceModal } from '../components/workspace/WorkspaceModal'
import { useSupabase } from '../contexts/SupabaseContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { useConversations } from '../hooks/useConversations'
import { useMessages } from '../hooks/useMessages'
import { MODELS, getModelById } from '../lib/models'
import { generateTitle } from '../lib/utils'
import type { Model, Workspace } from '../types'
import { Settings, PanelLeft, PanelLeftClose, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function ChatPage() {
  const { user, signOut } = useSupabase()
  const { workspaces, activeWorkspace, setActiveWorkspace, createWorkspace, updateWorkspace } = useWorkspace()

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)

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
    <div className="flex h-screen overflow-hidden bg-gray-950">
      {sidebarOpen && (
        <Sidebar
          workspaces={workspaces}
          activeWorkspace={activeWorkspace}
          conversations={conversations}
          activeConversationId={activeConversationId}
          loadingConversations={convsLoading}
          userName={user?.email ?? null}
          onSelectWorkspace={handleSelectWorkspace}
          onCreateWorkspace={handleCreateWorkspace}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={updateConversationTitle}
          onOpenSettings={() => setSettingsOpen(true)}
          onSignOut={signOut}
        />
      )}

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-950 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-800"
            >
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
            </button>

            {activeWorkspace && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{activeWorkspace.name}</span>
                <button
                  onClick={() => {
                    setEditingWorkspace(activeWorkspace)
                    setWorkspaceModalOpen(true)
                  }}
                  className="text-gray-600 hover:text-gray-400 transition-colors"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setSettingsOpen(true)}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-800"
          >
            <Settings size={18} />
          </button>
        </header>

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
