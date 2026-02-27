import React, { useState } from 'react'
import { useSupabase } from '../contexts/SupabaseContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Database, MessageSquare, Key, Sparkles, Info } from 'lucide-react'
import toast from 'react-hot-toast'

export function SetupPage() {
  const { configure } = useSupabase()
  const [url, setUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')
  const [loading, setLoading] = useState(false)
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || !anonKey.trim()) return
    setLoading(true)
    try {
      await configure(url.trim(), anonKey.trim())
      toast.success('Connected to Supabase!')
    } catch {
      toast.error('Failed to connect. Check your URL and key.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    configure('https://placeholder.supabase.co', 'placeholder-key').catch(() => {})
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-onyx-900 border border-onyx-700 rounded-2xl mb-4">
            <MessageSquare size={28} className="text-onyx-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to OnyxGPT</h1>
          <p className="text-gray-400">Connect your Supabase project to get started</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-start gap-2 p-3 bg-blue-900/20 border border-blue-800/50 rounded-lg mb-5">
            <Info size={14} className="text-blue-400 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-300">
              OnyxGPT uses Bring Your Own Supabase (BYOS). Your data is stored in your own project.
              No data is sent to any third party.
            </p>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            <Input
              label="Supabase Project URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xxxx.supabase.co"
              type="url"
              hint="Found in your Supabase project settings"
              required
            />
            <Input
              label="Anon / Public Key"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              type="password"
              hint="Found in Settings > API in your Supabase dashboard"
              required
            />
            <Button
              type="submit"
              loading={loading}
              disabled={!url.trim() || !anonKey.trim()}
              className="w-full"
              size="lg"
            >
              <Database size={16} />
              Connect Supabase
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gray-900 px-2 text-xs text-gray-500">or</span>
            </div>
          </div>

          <button
            onClick={handleSkip}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-300 transition-colors py-2"
          >
            Continue without Supabase (demo mode)
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { icon: <Key size={16} />, title: 'Your Keys', desc: 'Use your own API keys' },
            { icon: <Database size={16} />, title: 'Your Data', desc: 'Stored in your Supabase' },
            { icon: <Sparkles size={16} />, title: 'Any Model', desc: 'OpenAI, Anthropic & more' },
          ].map((f) => (
            <div key={f.title} className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-900 border border-gray-800 rounded-lg text-onyx-400 mb-2">
                {f.icon}
              </div>
              <p className="text-xs font-medium text-gray-300">{f.title}</p>
              <p className="text-xs text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
