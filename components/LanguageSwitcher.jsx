import { useLanguage } from '@/contexts/LanguageContext'

export default function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage()

  return (
    <button
        className="px-3 py-1 text-sm bg-gray-200 text-slate-800 rounded dark:text-white dark:bg-slate-500"
      onClick={toggleLanguage}
    >
      {language === 'en' ? 'বাংলা' : 'English'}
    </button>
  )
}
