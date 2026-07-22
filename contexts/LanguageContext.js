'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import i18n from '@/lib/i18n'



const LanguageContext = createContext({
  language: 'en',
  toggleLanguage: () => {},
  setLanguage: () => {},
})

export const useLanguage = () => useContext(LanguageContext)

export function LanguageProvider({ children }) {
  const [language, setLang] = useState('en')

  const setLanguage = (lang) => {
    i18n.changeLanguage(lang)
    setLang(lang)
    localStorage.setItem('lang', lang)
  }

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'bn' : 'en'
    setLanguage(newLang)
  }

  useEffect(() => {
    const storedLang = (localStorage.getItem('lang')) || 'en'
    setLanguage(storedLang)
  }, [])

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}
