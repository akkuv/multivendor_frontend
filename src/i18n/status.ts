import type { TFunction } from 'i18next'

/**
 * Localized label for a raw snake_case status/type code coming from the API
 * (e.g. "IN_TRANSIT", "order_created").
 *
 * The backend already sends a translated `status_label` for real enum values;
 * this helper covers the defensive fallbacks (synthetic rows, courier-feed
 * legs, local filter lists) by treating the humanized English code as the
 * i18n key. Anything with a Hindi entry in hi.json renders in Hindi, anything
 * without falls back to the humanized English text.
 */
export function tStatus(t: TFunction, code: string): string {
  return t(code.toLowerCase().replace(/_/g, ' '))
}