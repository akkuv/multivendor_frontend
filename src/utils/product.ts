export function specificationsToText(
  specifications: string[] | Record<string, string> | undefined,
): string {
  if (!specifications) return ''
  if (Array.isArray(specifications)) return specifications.join('\n')
  return Object.entries(specifications)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')
}

export const NEW_ARRIVAL_WINDOW_HOURS = 24

/**
 * A product counts as a "New arrival" only while it is inside the freshness
 * window (default 24h) measured from its created_at timestamp.
 */
export function isRecentlyAdded(
  product: { created_at?: string | null },
  hours: number = NEW_ARRIVAL_WINDOW_HOURS,
): boolean {
  if (!product?.created_at) return false

  const created = Date.parse(product.created_at)
  if (Number.isNaN(created)) return false

  const ageMs = Date.now() - created
  if (ageMs < 0) return false

  return ageMs < hours * 60 * 60 * 1000
}