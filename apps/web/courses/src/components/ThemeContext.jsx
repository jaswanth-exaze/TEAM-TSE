import { createContext, useContext, useLayoutEffect, useState } from 'react'
import Icon from './Icon'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'tse-learning-theme'

function readTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readTheme)

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
    const themeColorMeta = document.querySelector('meta[name="theme-color"]')
    if (themeColorMeta) themeColorMeta.content = theme === 'light' ? '#f5f7fb' : '#0b0e14'
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // The selected theme still applies to this page if storage is unavailable.
    }
  }, [theme])

  const toggleTheme = () => setTheme((current) => current === 'dark' ? 'light' : 'dark')
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function ThemeToggle() {
  const context = useContext(ThemeContext)
  if (!context) return null
  const { theme, toggleTheme } = context
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      aria-pressed={theme === 'light'}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-3 text-xs font-medium text-white/75 transition-colors hover:border-white/25 hover:bg-white/[0.07] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={15} />
      <span className="hidden min-[400px]:inline">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
    </button>
  )
}
