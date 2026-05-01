import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react'
import en from '../../i18n/en.json'
import fr from '../../i18n/fr.json'

export type Locale = 'en' | 'fr'

interface Dictionary {
  [key: string]: string | Dictionary
}

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const dictionaries: Record<Locale, Dictionary> = {
  en: en as Dictionary,
  fr: fr as Dictionary,
}

function resolveNestedValue(dictionary: Dictionary, key: string): string | null {
  const parts = key.split('.')
  let cursor: string | Dictionary = dictionary

  for (const part of parts) {
    if (typeof cursor !== 'object' || cursor === null || !(part in cursor)) {
      return null
    }
    cursor = (cursor as Dictionary)[part]
  }

  return typeof cursor === 'string' ? cursor : null
}

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const persisted = window.localStorage.getItem('graph-lab-locale')
    return persisted === 'fr' ? 'fr' : 'en'
  })

  function setLocale(nextLocale: Locale) {
    setLocaleState(nextLocale)
    window.localStorage.setItem('graph-lab-locale', nextLocale)
  }

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      setLocale,
      t: (key) => {
        return (
          resolveNestedValue(dictionaries[locale], key) ??
          resolveNestedValue(dictionaries.en, key) ??
          key
        )
      },
    }
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === null) {
    throw new Error('useI18n must be used inside I18nProvider')
  }
  return context
}


