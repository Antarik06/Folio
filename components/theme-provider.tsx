'use client'

import * as React from 'react'

type Theme = 'light' | 'dark' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
  storageKey?: string
  attribute?: 'class'
}

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyThemeClass(theme: 'light' | 'dark', disableTransitionOnChange?: boolean) {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  let cleanup: (() => void) | undefined
  if (disableTransitionOnChange) {
    const style = document.createElement('style')
    style.appendChild(document.createTextNode('*{transition:none!important}'))
    document.head.appendChild(style)
    cleanup = () => {
      void root.offsetHeight
      document.head.removeChild(style)
    }
  }

  root.classList.remove('light', 'dark')
  root.classList.add(theme)

  cleanup?.()
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  enableSystem = true,
  disableTransitionOnChange = false,
  storageKey = 'theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark'>('light')

  React.useEffect(() => {
    const saved = window.localStorage.getItem(storageKey) as Theme | null
    const nextTheme = saved || defaultTheme
    setThemeState(nextTheme)
  }, [defaultTheme, storageKey])

  React.useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const refresh = () => {
      const nextResolved: 'light' | 'dark' =
        theme === 'system' && enableSystem ? getSystemTheme() : theme === 'dark' ? 'dark' : 'light'
      setResolvedTheme(nextResolved)
      applyThemeClass(nextResolved, disableTransitionOnChange)
    }

    refresh()

    media.addEventListener('change', refresh)
    return () => media.removeEventListener('change', refresh)
  }, [theme, enableSystem, disableTransitionOnChange])

  const setTheme = React.useCallback(
    (nextTheme: Theme) => {
      setThemeState(nextTheme)
      window.localStorage.setItem(storageKey, nextTheme)
    },
    [storageKey]
  )

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
