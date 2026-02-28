import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SupabaseProvider, useSupabase } from './contexts/SupabaseContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ApiKeyProvider } from './contexts/ApiKeyContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import { MindstoreProvider } from './contexts/MindstoreContext'
import { GalleryProvider } from './contexts/GalleryContext'
import { SetupPage } from './pages/SetupPage'
import { AuthPage } from './pages/AuthPage'
import { ChatPage } from './pages/ChatPage'
import { MindstorePage } from './pages/MindstorePage'
import { GalleryPage } from './pages/GalleryPage'
import { MainLayout } from './components/layout/MainLayout'

function AppRoutes() {
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
      <MindstoreProvider>
        <GalleryProvider>
          <MainLayout>
            <Routes>
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/mindstore" element={<MindstorePage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/" element={<Navigate to="/chat" replace />} />
            </Routes>
          </MainLayout>
        </GalleryProvider>
      </MindstoreProvider>
    </WorkspaceProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <SupabaseProvider>
          <ApiKeyProvider>
            <AppRoutes />
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
      </ThemeProvider>
    </BrowserRouter>
  )
}
