# OnyxGPT

A full-featured, multi-provider AI chat application built with React + Vite (TypeScript).

## Features

- **Multi-provider AI support**: OpenAI, Anthropic (Claude), Google (Gemini), Mistral, Groq
- **Workspace organization**: Create workspaces with custom system prompts, models, and settings
- **Streaming responses**: Real-time token streaming from all providers
- **Markdown rendering**: Full GFM markdown with syntax-highlighted code blocks
- **BYOK**: Bring Your Own Keys — API keys stored locally, never sent to third parties
- **BYOS**: Bring Your Own Supabase — connect your own Supabase project for data persistence
- **Auth**: Email/password and Google OAuth via Supabase Auth

## Getting Started

```bash
npm install
npm run dev
```

On first launch you'll be prompted to enter your Supabase project URL and anon key.

## Supabase Setup

Run the SQL from the Settings → Supabase tab in the app to create the required tables:
- `workspaces`
- `conversations`
- `messages`
- `api_keys`

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 3
- Supabase JS client
- OpenAI SDK (also used for Groq via base URL override)
- react-markdown + remark-gfm
- lucide-react
- react-hot-toast
