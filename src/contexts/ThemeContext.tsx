import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ThemeMode, AccentColor, ThemeSettings } from '../types'

interface ThemeContextValue {
  settings: ThemeSettings
  isDark: boolean
  setMode: (mode: ThemeMode) => void
  setAccentColor: (color: AccentColor) => void
  toggleMode: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const THEME_STORAGE_KEY = 'onyxgpt_theme_settings'

const DEFAULT_SETTINGS: ThemeSettings = {
  mode: 'dark',
  accentColor: 'purple',
}

const ACCENT_COLORS: Record<AccentColor, { primary: string; secondary: string; cssVar: string }> = {
  purple: { primary: '#7c3aed', secondary: '#a78bfa', cssVar: '#7c3aed' },
  blue: { primary: '#2563eb', secondary: '#60a5fa', cssVar: '#2563eb' },
  green: { primary: '#059669', secondary: '#34d399', cssVar: '#059669' },
  orange: { primary: '#ea580c', secondary: '#fb923c', cssVar: '#ea580c' },
  pink: { primary: '#db2777', secondary: '#f472b6', cssVar: '#db2777' },
  cyan: { primary: '#0891b2', secondary: '#22d3ee', cssVar: '#0891b2' },
}

function loadSettings(): ThemeSettings {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS
}

function saveSettings(settings: ThemeSettings): void {
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(settings))
}

function getSystemIsDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(loadSettings)
  const [isDark, setIsDark] = useState(() => {
    const s = loadSettings()
    return s.mode === 'system' ? getSystemIsDark() : s.mode === 'dark'
  })

  useEffect(() => {
    const dark = settings.mode === 'system' ? getSystemIsDark() : settings.mode === 'dark'
    setIsDark(dark)

    // Apply dark/light mode
    if (dark) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }

    // Apply accent color CSS variable
    const accent = ACCENT_COLORS[settings.accentColor]
    document.documentElement.style.setProperty('--accent-color', accent.cssVar)
    document.documentElement.style.setProperty('--accent-primary', accent.primary)
    document.documentElement.style.setProperty('--accent-secondary', accent.secondary)

    saveSettings(settings)
  }, [settings])

  // Listen for system theme changes
  useEffect(() => {
    if (settings.mode !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [settings.mode])

  const setMode = useCallback((mode: ThemeMode) => {
    setSettings((s) => ({ ...s, mode }))
  }, [])

  const setAccentColor = useCallback((accentColor: AccentColor) => {
    setSettings((s) => ({ ...s, accentColor }))
  }, [])

  const toggleMode = useCallback(() => {
    setSettings((s) => ({
      ...s,
      mode: s.mode === 'dark' ? 'light' : 'dark',
    }))
  }, [])

  return (
    <ThemeContext.Provider
      value={{
        settings,
        isDark,
        setMode,
        setAccentColor,
        toggleMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export { ACCENT_COLORS }
