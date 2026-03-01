import { Toaster } from 'react-hot-toast'
import { PuterAuthProvider, usePuterAuth } from './contexts/PuterAuthContext'
import { SupabaseProvider, useSupabase } from './contexts/SupabaseContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import { SetupPage } from './pages/SetupPage'
import { AuthPage } from './pages/AuthPage'
import { ChatPage } from './pages/ChatPage'

function AppContent() {
  const { user: puterUser, loading: authLoading } = usePuterAuth()
  const { configured } = useSupabase()

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-onyx-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!puterUser) {
    return <AuthPage />
  }

  if (!configured) {
    return <SetupPage />
  }

  return (
    <WorkspaceProvider>
      <ChatPage />
    </WorkspaceProvider>
  )
}

export default function App() {
  return (
    <PuterAuthProvider>
      <SupabaseProvider>
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
      </SupabaseProvider>
    </PuterAuthProvider>
  )
}
