import {
  MantineProvider,
  createTheme,
  type MantineColorsTuple,
} from '@mantine/core'
import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react'

type ColorScheme = 'light' | 'dark'

interface AppThemeContextValue {
  colorScheme: ColorScheme
  setColorScheme: (scheme: ColorScheme) => void
  toggleColorScheme: () => void
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null)

const elementaryIndigo: MantineColorsTuple = [
  '#eef2ff',
  '#e0e7ff',
  '#c7d2fe',
  '#a5b4fc',
  '#818cf8',
  '#6366f1',
  '#4f46e5',
  '#4338ca',
  '#3730a3',
  '#312e81',
]

const theme = createTheme({
  primaryColor: 'indigo',
  colors: {
    indigo: elementaryIndigo,
  },
  fontFamily: 'Outfit, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  defaultRadius: 'md',
})

export function AppThemeProvider({ children }: PropsWithChildren) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    const persisted = window.localStorage.getItem('graph-lab-color-scheme')
    return persisted === 'dark' ? 'dark' : 'light'
  })

  function setColorScheme(nextScheme: ColorScheme) {
    setColorSchemeState(nextScheme)
    window.localStorage.setItem('graph-lab-color-scheme', nextScheme)
  }

  function toggleColorScheme() {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')
  }

  const value = useMemo<AppThemeContextValue>(
    () => ({ colorScheme, setColorScheme, toggleColorScheme }),
    [colorScheme],
  )

  return (
    <AppThemeContext.Provider value={value}>
      <MantineProvider theme={theme} forceColorScheme={colorScheme} defaultColorScheme="light">
        {children}
      </MantineProvider>
    </AppThemeContext.Provider>
  )
}

export function useAppTheme() {
  const context = useContext(AppThemeContext)
  if (context === null) {
    throw new Error('useAppTheme must be used inside AppThemeProvider')
  }
  return context
}


