import { useEffect, useState } from 'react'
import {
  ChevronDown,
  Monitor,
  Moon,
  Sun,
} from 'lucide-react'
import {
  applyThemeMode,
  getStoredThemeMode,
  type ThemeMode,
} from '../../theme'

interface ThemeModeControlProps {
  compact?: boolean
}

function ThemeModeControl({
  compact = false,
}: ThemeModeControlProps) {
  const [mode, setMode] = useState<ThemeMode>(
    getStoredThemeMode,
  )

  useEffect(() => {
    applyThemeMode(mode)

    if (mode !== 'system') {
      return undefined
    }

    const mediaQuery = window.matchMedia(
      '(prefers-color-scheme: dark)',
    )

    const updateSystemTheme = () => {
      applyThemeMode('system')
    }

    mediaQuery.addEventListener(
      'change',
      updateSystemTheme,
    )

    return () => {
      mediaQuery.removeEventListener(
        'change',
        updateSystemTheme,
      )
    }
  }, [mode])

  const Icon =
    mode === 'dark'
      ? Moon
      : mode === 'light'
        ? Sun
        : Monitor

  return (
    <label
      className={`theme-mode-control ${
        compact ? 'theme-mode-control-compact' : ''
      }`}
    >
      <span className="theme-mode-label">Mode</span>

      <span className="theme-mode-select-shell">
        <Icon size={15} aria-hidden="true" />

        <select
          value={mode}
          onChange={(event) =>
            setMode(event.target.value as ThemeMode)
          }
          aria-label="Color mode"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>

        <ChevronDown
          size={14}
          aria-hidden="true"
          className="theme-mode-chevron"
        />
      </span>
    </label>
  )
}

export default ThemeModeControl
