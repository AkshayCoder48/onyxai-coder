import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  Brain,
  Image,
  Plus,
  Settings,
  LogOut,
  User,
  PanelLeft,
  PanelLeftClose,
  Sun,
  Moon,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useSupabase } from '../../contexts/SupabaseContext'
import { useTheme } from '../../contexts/ThemeContext'
import { SettingsModal } from '../settings/SettingsModal'
import { Button } from '../ui/Button'

interface MainLayoutProps {
  children: React.ReactNode
}

const NAV_ITEMS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/chat' },
  { id: 'mindstore', label: 'Mindstore', icon: Brain, path: '/mindstore' },
  { id: 'gallery', label: 'Gallery', icon: Image, path: '/gallery' },
]

export function MainLayout({ children }: MainLayoutProps) {
  const { user, signOut } = useSupabase()
  const { isDark, toggleMode } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const activeItem = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path))?.id ?? 'chat'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="flex flex-col h-full bg-gray-950 border-r border-gray-800 w-64 shrink-0">
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-onyx-600 rounded-lg flex items-center justify-center">
                <MessageSquare size={16} className="text-white" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">OnyxGPT</span>
            </div>
            <Button
              onClick={() => navigate('/chat')}
              className="w-full"
              size="sm"
            >
              <Plus size={14} />
              New Chat
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeItem === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-onyx-900 text-onyx-300 border border-onyx-800'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900',
                  )}
                >
                  <Icon size={18} className={isActive ? 'text-onyx-400' : 'text-gray-500'} />
                  {item.label}
                </button>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-gray-800 space-y-1">
            {/* Theme Toggle */}
            <button
              onClick={toggleMode}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-900 transition-colors"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>

            {/* Settings */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-900 transition-colors"
            >
              <Settings size={18} />
              Settings
            </button>

            {/* User */}
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-onyx-800 flex items-center justify-center">
                <User size={14} className="text-onyx-300" />
              </div>
              <span className="text-sm text-gray-400 truncate flex-1">
                {user?.email ?? 'Guest'}
              </span>
              <button
                onClick={() => signOut()}
                className="text-gray-600 hover:text-gray-300 transition-colors p-1 rounded hover:bg-gray-800"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile/Compact Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-950 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="text-gray-500 hover:text-gray-300 transition-colors p-1.5 rounded-lg hover:bg-gray-800"
            >
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMode}
              className="text-gray-500 hover:text-gray-300 transition-colors p-1.5 rounded-lg hover:bg-gray-800"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="text-gray-500 hover:text-gray-300 transition-colors p-1.5 rounded-lg hover:bg-gray-800"
            >
              <Settings size={18} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
