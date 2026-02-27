import React, { useState } from 'react'
import { useSupabase } from '../contexts/SupabaseContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { MessageSquare, Chrome } from 'lucide-react'
import toast from 'react-hot-toast'

type Mode = 'signin' | 'signup'

export function AuthPage() {
  const { signIn, signUp, signInWithGoogle } = useSupabase()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password, fullName)
        setSignUpSuccess(true)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Google sign-in failed')
      setGoogleLoading(false)
    }
  }

  if (signUpSuccess) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center max-w-sm w-full">
          <div className="w-12 h-12 bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-400 text-xl">✓</span>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Check your email</h2>
          <p className="text-sm text-gray-400 mb-4">
            We sent a confirmation link to <strong className="text-gray-200">{email}</strong>.
            Click the link to verify your account.
          </p>
          <button
            onClick={() => { setSignUpSuccess(false); setMode('signin') }}
            className="text-sm text-onyx-400 hover:text-onyx-300"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
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
            {mode === 'signin' ? 'Sign in to your account' : 'Create an account'}
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <Button
            onClick={handleGoogle}
            loading={googleLoading}
            variant="outline"
            className="w-full mb-4"
          >
            <Chrome size={16} />
            Continue with Google
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gray-900 px-2 text-xs text-gray-500">or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                autoComplete="name"
              />
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              hint={mode === 'signup' ? 'At least 6 characters' : undefined}
            />

            <Button type="submit" loading={loading} className="w-full mt-1">
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            {mode === 'signin' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-onyx-400 hover:text-onyx-300 font-medium"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-onyx-400 hover:text-onyx-300 font-medium"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
