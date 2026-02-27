import { Toaster } from 'react-hot-toast'
import { SupabaseProvider, useSupabase } from './contexts/SupabaseContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import { ApiKeyProvider } from './contexts/ApiKeyContext'
import { SetupPage } from './pages/SetupPage'
import { AuthPage } from './pages/AuthPage'
import { ChatPage } from './pages/ChatPage'

function AppContent() {
  const { configured, user, loading } = useSupabase()

  if (!configured) {
    return <SetupPage />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-onyx-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return (
    <WorkspaceProvider>
      <ChatPage />
    </WorkspaceProvider>
  )
}

export default function App() {
  return (
    <SupabaseProvider>
      <ApiKeyProvider>
        <AppContent />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#f3f4f6',
              border: '1px solid #374151',
              borderRadius: '12px',
              fontSize: '13px',
            },
            success: {
              iconTheme: { primary: '#8b5cf6', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </ApiKeyProvider>
    </SupabaseProvider>
  )
}
