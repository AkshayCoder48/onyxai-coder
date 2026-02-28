# OnyxGPT

A powerful multi-provider AI chat interface with workspace organization, mindstore, image gallery, and theming support.

![OnyxGPT](https://img.shields.io/badge/OnyxGPT-v1.0.0-7c3aed)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)
![Vite](https://img.shields.io/badge/Vite-7-646CFF)
![Supabase](https://img.shields.io/badge/Supabase-BYOS-3ECF8E)

## Features

### 🤖 Multi-Provider AI Support
- **OpenAI** - GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo
- **Anthropic** - Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
- **Google** - Gemini 1.5 Pro, Gemini 1.5 Flash
- **Mistral** - Mistral Large
- **Groq** - Mixtral 8x7B, LLaMA 3.1 70B
- **Puter AI** - Automatic integration when running in Puter environment

### 🏢 Workspace Organization
- Create multiple workspaces for different projects/purposes
- Each workspace has its own:
  - Default AI model
  - System prompt
  - Temperature and max tokens settings
- Organize conversations by workspace

### 🧠 Mindstore
- Save and organize prompts, code snippets, and ideas
- Categorize items with custom categories
- Tag system for easy filtering
- Favorite important items
- Search through all your saved content
- Quick copy to clipboard

### 🖼️ Image Gallery
- Upload and store images
- Drag-and-drop support
- Image preview with metadata
- Copy image URLs
- Download images
- Works with Supabase Storage (with local fallback)

### 🎨 Theming
- **Dark Mode** - Easy on the eyes
- **Light Mode** - Clean and bright
- **System Mode** - Follows OS preference
- **Accent Colors** - Purple, Blue, Green, Orange, Pink, Cyan

### 🔐 Security & Privacy
- **BYOK** (Bring Your Own Keys) - Use your own API keys
- **BYOS** (Bring Your Own Supabase) - Your data stays in your own Supabase project
- Local storage fallback for offline usage
- No data sent to third parties except AI providers

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (optional, for data persistence)
- AI provider API keys

### Installation

```bash
# Clone the repository
git clone https://github.com/AkshayCoder48/onyxai-coder.git
cd onyxai-coder

# Install dependencies
npm install

# Start development server
npm run dev
```

### Initial Setup

1. **Connect Supabase** (Recommended)
   - Create a project at [supabase.com](https://supabase.com)
   - Get your Project URL and Anon Key from Settings > API
   - Enter them in the OnyxGPT setup screen
   - Run the SQL from Settings > Supabase to create required tables

2. **Add API Keys**
   - Go to Settings > API Keys
   - Add keys for the AI providers you want to use:
     - OpenAI: https://platform.openai.com/api-keys
     - Anthropic: https://console.anthropic.com/settings/keys
     - Google: https://aistudio.google.com/app/apikey
     - Mistral: https://console.mistral.ai/api-keys/
     - Groq: https://console.groq.com/keys

3. **Sign Up/Sign In**
   - Create an account or sign in with Google
   - Your data will be stored in your Supabase project

## Required Supabase Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
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
  for delete using (bucket_id = 'gallery' and auth.uid()::text = (storage.foldername(name))[1]);
```

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

## Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3
- **State Management**: React Context + Hooks
- **Routing**: React Router 7
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email + Google OAuth)
- **Storage**: Supabase Storage (for images)

### Project Structure
```
src/
├── components/
│   ├── chat/           # Chat components
│   ├── layout/         # Layout components
│   ├── settings/       # Settings components
│   ├── ui/             # Reusable UI components
│   └── workspace/      # Workspace components
├── contexts/           # React Contexts
│   ├── ApiKeyContext.tsx
│   ├── GalleryContext.tsx
│   ├── MindstoreContext.tsx
│   ├── SupabaseContext.tsx
│   ├── ThemeContext.tsx
│   └── WorkspaceContext.tsx
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
│   ├── models.ts       # AI model definitions
│   ├── openai.ts       # AI streaming logic
│   ├── puter.ts        # Puter AI integration
│   ├── supabase.ts     # Supabase client
│   └── utils.ts        # Helper functions
├── pages/              # Page components
│   ├── AuthPage.tsx
│   ├── ChatPage.tsx
│   ├── GalleryPage.tsx
│   ├── MindstorePage.tsx
│   └── SetupPage.tsx
├── types/              # TypeScript types
└── App.tsx
```

## Puter AI Integration

When running OnyxGPT inside [Puter](https://puter.com), the app automatically detects and uses Puter's AI capabilities. No API keys needed!

Available Puter models:
- GPT-4o
- GPT-4o Mini
- Claude 3.5 Sonnet
- Claude 3.5 Haiku
- Gemini 1.5 Pro
- Gemini 1.5 Flash
- Mistral Large

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Built with [React](https://react.dev)
- Powered by [Supabase](https://supabase.com)
- Icons by [Lucide](https://lucide.dev)
- UI inspired by modern chat interfaces
