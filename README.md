# OnyxGPT

A full-featured AI chat application powered by Puter AI, built with React + Vite (TypeScript).

## Features

- **Puter AI Integration**: Streaming AI chat with web search capabilities via Puter AI
- **Workspace organization**: Create workspaces with custom system prompts, models, and settings
- **Streaming responses**: Real-time token streaming from Puter AI
- **Markdown rendering**: Full GFM markdown with syntax-highlighted code blocks
- **Web Search**: Built-in web search tool for up-to-date information
- **BYOS**: Bring Your Own Supabase — connect your own Supabase project for data persistence
- **Auth**: Email/password and Google OAuth via Supabase Auth

## Getting Started

```bash
npm install
npm run dev
```

On first launch you'll be prompted to enter your Supabase project URL and anon key.

## Running in Puter

This application is designed to run within the Puter environment where the `puter` global object provides AI capabilities. Make sure to deploy your app to Puter to access the AI features.

## Supabase Setup

Run the SQL from the Settings → Supabase tab in the app to create the required tables:
- `workspaces`
- `conversations`
- `messages`

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 3
- Supabase JS client
- Puter AI (via `puter.js`)
- react-markdown + remark-gfm
- lucide-react
- react-hot-toast
