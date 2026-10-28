import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import hi from './locales/hi.json'

/**
 * Translation keys ARE the English source strings.
 *
 * This keeps ~1,800 storefront/account/panel strings maintainable without
 * inventing a parallel key namespace, and gives a safe failure mode: a key
 * that has no Hindi entry simply renders the original English text instead of
 * leaking a raw key like `cart.empty.title` into the UI.
 *
 * Because keys contain spaces and dots (e.g. "Add to Cart", "Page 1 of 5"),
 * key/namespace separators are disabled.
 */
export const SUPPORTED_LANGUAGES = ['en', 'hi'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'EN',
  hi: 'हिंदी',
}

export const isSupportedLanguage = (value?: string | null): value is SupportedLanguage =>
  !!value && (SUPPORTED_LANGUAGES as readonly string[]).includes(value.split('-')[0])

const resources = {
  en: { translation: {} },
  hi: { translation: hi },
}

/** Normalises `en-US`, `HI`, `hi` etc. to a supported language code. */
export const normalizeLanguage = (value?: string | null): SupportedLanguage =>
  (value?.split('-')[0]?.toLowerCase() as SupportedLanguage) ?? 'en'

if (!i18n.isInitialized) {
  i18n.on('languageChanged', (lng: string) => {
    // Keep <html lang> accurate for screen readers and font shaping.
    const normalized = normalizeLanguage(lng)
    if (typeof document !== 'undefined') document.documentElement.lang = normalized
  })

  i18n.use(LanguageDetector).use(initReactI18next).init({
    resources,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    fallbackLng: 'en',
    keySeparator: false,
    nsSeparator: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'querystring', 'navigator'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  })
}

export default i18n