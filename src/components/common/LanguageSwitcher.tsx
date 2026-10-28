import { useTranslation } from 'react-i18next'

export function LanguageSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage?.split('-')[0] || i18n.language.split('-')[0] || 'en') as 'en' | 'hi'

  const toggle = () => {
    const next = lang === 'en' ? 'hi' : 'en'
    try {
      localStorage.setItem('i18nextLng', next)
    } catch {}
    i18n.changeLanguage(next)
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggle}
        className="flex h-9 items-center rounded-full border border-line-warm bg-ivory px-1 shadow-sm transition-colors hover:bg-cream"
        title={t('Switch language')}
      >
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
            lang === 'en' ? 'bg-ink text-[#e9c891]' : 'text-ink-soft'
          }`}
        >
          EN
        </span>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
            lang === 'hi' ? 'bg-ink text-[#e9c891]' : 'text-ink-soft'
          }`}
        >
          हिंदी
        </span>
      </button>
    </div>
  )
}
