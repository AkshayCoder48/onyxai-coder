import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { useApiKeys } from '../../contexts/ApiKeyContext'
import { useSupabase } from '../../contexts/SupabaseContext'
import { useTheme, ACCENT_COLORS } from '../../contexts/ThemeContext'
import type { ApiKey, ThemeMode, AccentColor } from '../../types'
import { Trash2, Eye, EyeOff, Plus, Key, Database, Link2, Info, Palette, Moon, Sun, Monitor } from 'lucide-react'
import { PROVIDER_LABELS } from '../../lib/models'
import { getSupabaseConfig } from '../../lib/supabase'
import toast from 'react-hot-toast'

type Tab = 'api-keys' | 'supabase' | 'appearance' | 'about'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

const PROVIDERS: ApiKey['provider'][] = ['openai', 'anthropic', 'google', 'mistral', 'groq']

const THEME_MODES: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { id: 'dark', label: 'Dark', icon: <Moon size={16} /> },
  { id: 'light', label: 'Light', icon: <Sun size={16} /> },
  { id: 'system', label: 'System', icon: <Monitor size={16} /> },
]

function ApiKeysTab() {
  const { apiKeys, addApiKey, removeApiKey } = useApiKeys()
  const [selected, setSelected] = useState<ApiKey['provider']>('openai')
  const [keyValue, setKeyValue] = useState('')
  const [label, setLabel] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyValue.trim()) return
    setSaving(true)
    try {
      await addApiKey(selected, label.trim() || PROVIDER_LABELS[selected] || selected, keyValue.trim())
      toast.success('API key saved')
      setKeyValue('')
      setLabel('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save key')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <Key size={14} className="text-onyx-400" />
          Saved API Keys
        </h3>
        {apiKeys.length === 0 ? (
          <p className="text-xs text-gray-500">No API keys added yet.</p>
        ) : (
          <div className="space-y-2">
            {apiKeys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between p-2.5 bg-gray-900 rounded-lg border border-gray-800"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="purple">{PROVIDER_LABELS[k.provider] ?? k.provider}</Badge>
                    <span className="text-sm text-gray-300">{k.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{k.key_preview}</p>
                </div>
                <button
                  onClick={() => {
                    removeApiKey(k.id)
                    toast.success('API key removed')
                  }}
                  className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-800 pt-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <Plus size={14} className="text-onyx-400" />
          Add API Key
        </h3>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {PROVIDERS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSelected(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selected === p
                    ? 'bg-onyx-700 text-onyx-300'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {PROVIDER_LABELS[p]}
              </button>
            ))}
          </div>

          <Input
            label="Label (optional)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={`My ${PROVIDER_LABELS[selected]} Key`}
          />

          <div className="relative">
            <Input
              label="API Key"
              type={show ? 'text' : 'password'}
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              placeholder="sk-..."
              required
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-8 text-gray-500 hover:text-gray-300"
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          <Button type="submit" loading={saving} disabled={!keyValue.trim()} className="w-full">
            Save Key
          </Button>
        </form>
      </div>
    </div>
  )
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
    } catch (err) {
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
        <pre className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-xs text-gray-400 overflow-x-auto whitespace-pre font-mono leading-relaxed max-h-64 overflow-y-auto">
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
  );

-- API Keys
create table api_keys (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  provider text not null,
  label text not null,
  key_hash text not null,
  key_preview text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, provider)
);
alter table api_keys enable row level security;
create policy "Users own api_keys" on api_keys
  for all using (auth.uid() = user_id);

-- Mindstore Items
create table mindstore_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  content text not null,
  category text,
  tags text[] default '{}',
  is_prompt boolean default false,
  is_favorite boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table mindstore_items enable row level security;
create policy "Users own mindstore_items" on mindstore_items
  for all using (auth.uid() = user_id);

-- Gallery Images
create table gallery_images (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  filename text not null,
  url text not null,
  thumbnail_url text,
  size int not null,
  mime_type text not null,
  width int,
  height int,
  prompt text,
  model text,
  tags text[] default '{}',
  created_at timestamptz default now()
);
alter table gallery_images enable row level security;
create policy "Users own gallery_images" on gallery_images
  for all using (auth.uid() = user_id);

-- Create storage bucket for gallery
insert into storage.buckets (id, name, public) values ('gallery', 'gallery', true);

-- Storage policies
create policy "Users can upload their own images" on storage.objects
  for insert with check (bucket_id = 'gallery' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can view their own images" on storage.objects
  for select using (bucket_id = 'gallery' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete their own images" on storage.objects
  for delete using (bucket_id = 'gallery' and auth.uid()::text = (storage.foldername(name))[1]);`}
        </pre>
      </div>
    </div>
  )
}

function AppearanceTab() {
  const { settings, setMode, setAccentColor } = useTheme()

  return (
    <div className="space-y-6">
      {/* Theme Mode */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <Palette size={14} className="text-onyx-400" />
          Theme Mode
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {THEME_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setMode(mode.id)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                settings.mode === mode.id
                  ? 'bg-onyx-900 border-onyx-600 text-onyx-300'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-300'
              }`}
            >
              {mode.icon}
              <span className="text-xs font-medium">{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: ACCENT_COLORS[settings.accentColor].primary }}
          />
          Accent Color
        </h3>
        <div className="grid grid-cols-6 gap-2">
          {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((color) => (
            <button
              key={color}
              onClick={() => setAccentColor(color)}
              className={`w-10 h-10 rounded-xl transition-all ${
                settings.accentColor === color
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-950 scale-110'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: ACCENT_COLORS[color].primary }}
              title={color}
            />
          ))}
        </div>
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
        <p>A powerful multi-provider AI chat interface with workspace organization.</p>
        <div className="border-t border-gray-800 pt-3 space-y-1.5">
          <p className="font-medium text-gray-300">Features</p>
          <ul className="space-y-1 text-xs">
            {[
              'Multi-provider support (OpenAI, Anthropic, Google, Mistral, Groq)',
              'Workspace-based organization',
              'Mindstore for prompts and snippets',
              'Image gallery with storage',
              'Streaming responses',
              'Markdown rendering with syntax highlighting',
              'BYOK — Bring Your Own Keys',
              'BYOS — Bring Your Own Supabase',
              'Light/Dark themes with accent colors',
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
  const [tab, setTab] = useState<Tab>('api-keys')

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'api-keys', label: 'API Keys', icon: <Key size={14} /> },
    { id: 'supabase', label: 'Supabase', icon: <Database size={14} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={14} /> },
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
          {tab === 'api-keys' && <ApiKeysTab />}
          {tab === 'supabase' && <SupabaseTab />}
          {tab === 'appearance' && <AppearanceTab />}
          {tab === 'about' && <AboutTab />}
        </div>
      </div>
    </Modal>
  )
}
