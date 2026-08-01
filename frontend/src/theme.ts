export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'flowops_theme_mode'

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)

  return isThemeMode(stored) ? stored : 'light'
}

export function resolveThemeMode(
  mode: ThemeMode,
): 'light' | 'dark' {
  if (mode !== 'system') {
    return mode
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function applyThemeMode(mode: ThemeMode): void {
  if (typeof window === 'undefined') {
    return
  }

  const resolved = resolveThemeMode(mode)
  const root = document.documentElement

  root.dataset.theme = resolved
  root.dataset.themeMode = mode
  root.style.colorScheme = resolved

  window.localStorage.setItem(STORAGE_KEY, mode)
}

export function initializeTheme(): void {
  applyThemeMode(getStoredThemeMode())
}
