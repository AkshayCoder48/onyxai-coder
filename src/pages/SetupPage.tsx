import { Database, Key, MessageSquare, Info } from 'lucide-react'
import { useTurso } from '../contexts/TursoContext'

export function SetupPage() {
  const { configured } = useTurso()

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-onyx-900 border border-onyx-700 rounded-2xl mb-4">
            <MessageSquare size={28} className="text-onyx-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Set Up Turso Storage</h1>
          <p className="text-gray-400">Connect your Turso database to save conversations securely</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-start gap-2 p-3 bg-blue-900/20 border border-blue-800/50 rounded-lg">
            <Info size={14} className="text-blue-400 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-300">
              OnyxGPT now stores data in Turso (libSQL). Configure the environment variables below in
              Vercel and redeploy the project to enable persistence.
            </p>
          </div>

          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-onyx-400" />
              <span className="font-medium">TURSO_DATABASE_URL</span>
            </div>
            <div className="flex items-center gap-2">
              <Key size={16} className="text-onyx-400" />
              <span className="font-medium">TURSO_AUTH_TOKEN</span>
            </div>
          </div>

          <pre className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs text-gray-400 overflow-x-auto whitespace-pre font-mono leading-relaxed">
{`TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token`}
          </pre>

          <div className="text-xs text-gray-500">
            {configured
              ? 'Turso is configured. Reload the app to continue.'
              : 'Once set, redeploy the app and refresh this page.'}
          </div>
        </div>
      </div>
    </div>
  )
}
