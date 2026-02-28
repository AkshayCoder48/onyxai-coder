import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useSupabase } from '../../contexts/SupabaseContext'
import { getSupabaseConfig } from '../../lib/supabase'
import { Database, Link2, Info } from 'lucide-react'
import toast from 'react-hot-toast'

type Tab = 'supabase' | 'about'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

function SupabaseTab() {
  const { configure, disconnect, configured } = useSupabase()
  const config = getSupabaseConfig()
  const [url, setUrl] = useState(config?.url ?? '')
  const [anonKey, setAnonKey] = useState(config?.anonKey ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || !anonKey.trim()) return
    setSaving(true)
    try {
      await configure(url.trim(), anonKey.trim())
      toast.success('Supabase configured successfully')
    } catch {
      toast.error('Failed to connect to Supabase')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
        <p className="text-xs text-blue-300 flex items-start gap-2">
          <Info size={13} className="mt-0.5 shrink-0" />
          Enter your Supabase project URL and anon key to enable data persistence. Your data stays
          in your own Supabase project.
        </p>
      </div>

      {configured && (
        <div className="flex items-center gap-2 p-2.5 bg-green-900/20 border border-green-800 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <p className="text-xs text-green-400">Connected to Supabase</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-3">
        <Input
          label="Supabase URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-project.supabase.co"
          type="url"
        />
        <div className="relative">
          <Input
            label="Anon Key"
            value={anonKey}
            onChange={(e) => setAnonKey(e.target.value)}
            placeholder="eyJ..."
            type="password"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" loading={saving} disabled={!url.trim() || !anonKey.trim()} className="flex-1">
            <Database size={14} />
            {configured ? 'Update Connection' : 'Connect'}
          </Button>
          {configured && (
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                disconnect()
                setUrl('')
                setAnonKey('')
                toast.success('Disconnected from Supabase')
              }}
            >
              Disconnect
            </Button>
          )}
        </div>
      </form>

      <div className="border-t border-gray-800 pt-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Required Tables</h3>
        <p className="text-xs text-gray-500 mb-3">
          Run this SQL in your Supabase SQL editor to create the required tables:
        </p>
        <pre className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-xs text-gray-400 overflow-x-auto whitespace-pre font-mono leading-relaxed">
{`-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Workspaces
create table workspaces (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  model_id text not null default 'gpt-4o-mini',
  system_prompt text,
  temperature float default 0.7,
  max_tokens int default 2048,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table workspaces enable row level security;
create policy "Users own workspaces" on workspaces
  for all using (auth.uid() = user_id);

-- Conversations
create table conversations (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references workspaces on delete cascade,
  user_id uuid references auth.users not null,
  title text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table conversations enable row level security;
create policy "Users own conversations" on conversations
  for all using (auth.uid() = user_id);

-- Messages
create table messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references conversations on delete cascade,
  role text not null,
  content text not null,
  model_id text,
  tokens_used int,
  created_at timestamptz default now()
);
alter table messages enable row level security;
create policy "Users own messages" on messages
  for all using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
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
              'BYOS — Bring Your Own Supabase',
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
  const [tab, setTab] = useState<Tab>('supabase')

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'supabase', label: 'Supabase', icon: <Database size={14} /> },
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
          {tab === 'supabase' && <SupabaseTab />}
          {tab === 'about' && <AboutTab />}
        </div>
      </div>
    </Modal>
  )
}
