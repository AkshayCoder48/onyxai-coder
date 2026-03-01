import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { useTurso } from '../../contexts/TursoContext'
import { Database, Link2, Info, Key } from 'lucide-react'

type Tab = 'turso' | 'about'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

function TursoTab() {
  const { configured } = useTurso()

  return (
    <div className="space-y-5">
      <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
        <p className="text-xs text-blue-300 flex items-start gap-2">
          <Info size={13} className="mt-0.5 shrink-0" />
          Turso (libSQL) powers data persistence. Set the environment variables below in Vercel to
          enable storage for your conversations.
        </p>
      </div>

      {configured ? (
        <div className="flex items-center gap-2 p-2.5 bg-green-900/20 border border-green-800 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <p className="text-xs text-green-400">Connected to Turso</p>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-2.5 bg-yellow-900/20 border border-yellow-800 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <p className="text-xs text-yellow-300">Missing Turso environment variables</p>
        </div>
      )}

      <div className="grid gap-3 text-sm text-gray-300">
        <div className="flex items-center gap-2">
          <Database size={14} className="text-onyx-400" />
          <span className="font-medium">TURSO_DATABASE_URL</span>
        </div>
        <div className="flex items-center gap-2">
          <Key size={14} className="text-onyx-400" />
          <span className="font-medium">TURSO_AUTH_TOKEN</span>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Required Tables</h3>
        <p className="text-xs text-gray-500 mb-3">
          Run this SQL in your Turso/libSQL database to create the required tables:
        </p>
        <pre className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-xs text-gray-400 overflow-x-auto whitespace-pre font-mono leading-relaxed">
{`create table if not exists workspaces (
  id text primary key,
  user_id text not null,
  name text not null,
  description text,
  model_id text not null default 'gpt-4o-mini',
  system_prompt text,
  temperature real default 0.7,
  max_tokens integer default 2048,
  created_at text not null,
  updated_at text not null
);

create table if not exists conversations (
  id text primary key,
  workspace_id text not null,
  user_id text not null,
  title text not null,
  created_at text not null,
  updated_at text not null,
  foreign key (workspace_id) references workspaces(id) on delete cascade
);

create table if not exists messages (
  id text primary key,
  conversation_id text not null,
  role text not null,
  content text not null,
  model_id text,
  tokens_used integer,
  created_at text not null,
  foreign key (conversation_id) references conversations(id) on delete cascade
);`}
        </pre>
      </div>
    </div>
  )
}

function AboutTab() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-14 h-14 rounded-2xl bg-onyx-900 border border-onyx-700 flex items-center justify-center">
          <Link2 size={24} className="text-onyx-400" />
        </div>
        <div className="text-center">
          <h2 className="font-bold text-lg text-white">OnyxGPT</h2>
          <p className="text-sm text-gray-400">v1.0.0</p>
        </div>
      </div>
      <div className="space-y-3 text-sm text-gray-400">
        <p>A powerful AI chat interface powered by Puter AI with web search capabilities.</p>
        <div className="border-t border-gray-800 pt-3 space-y-1.5">
          <p className="font-medium text-gray-300">Features</p>
          <ul className="space-y-1 text-xs">
            {[
              'Puter AI streaming with web search',
              'Workspace-based organization',
              'Streaming responses',
              'Markdown rendering with syntax highlighting',
              'Turso-powered persistence',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="text-onyx-400 mt-0.5">•</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>('turso')

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'turso', label: 'Turso', icon: <Database size={14} /> },
    { id: 'about', label: 'About', icon: <Info size={14} /> },
  ]

  return (
    <Modal open={open} onClose={onClose} title="Settings" size="xl">
      <div className="flex gap-4 min-h-[400px]">
        <nav className="flex flex-col gap-0.5 w-36 shrink-0 border-r border-gray-800 pr-3 -ml-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                tab === t.id
                  ? 'bg-onyx-900 text-onyx-300'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto">
          {tab === 'turso' && <TursoTab />}
          {tab === 'about' && <AboutTab />}
        </div>
      </div>
    </Modal>
  )
}
