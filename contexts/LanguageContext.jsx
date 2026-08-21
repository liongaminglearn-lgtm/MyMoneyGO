'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import translations from '@/lib/i18n'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('es')

  useEffect(() => {
    const saved = localStorage.getItem('mmg_lang')
    if (saved === 'en' || saved === 'es') setLang(saved)
  }, [])

  function switchLang(l) {
    setLang(l)
    localStorage.setItem('mmg_lang', l)
  }

  const t = (key, ...args) => {
    const val = translations[lang]?.[key] ?? translations.es[key] ?? key
    return typeof val === 'function' ? val(...args) : val
  }

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}
