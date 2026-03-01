import { useState } from 'react'
import { usePuterAuth } from '../contexts/PuterAuthContext'
import { Button } from '../components/ui/Button'
import { MessageSquare, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'

export function AuthPage() {
  const { signIn, loading } = usePuterAuth()
  const [signingIn, setSigningIn] = useState(false)

  const handleSignIn = async () => {
    setSigningIn(true)
    try {
      await signIn()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-onyx-900 border border-onyx-700 rounded-xl mb-3">
            <MessageSquare size={22} className="text-onyx-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">OnyxGPT</h1>
          <p className="text-sm text-gray-500 mt-1">
            AI-powered chat with web search
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <Button
            onClick={handleSignIn}
            loading={signingIn || loading}
            className="w-full"
            size="lg"
          >
            <LogIn size={16} />
            Sign in with Puter
          </Button>

          <p className="text-center text-xs text-gray-500 mt-4">
            Free AI chat powered by Puter
          </p>
        </div>
      </div>
    </div>
  )
}
