const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value ?? 0)
}

export function orderGrandTotal(order: {
  total: number | string | null | undefined
  wallet_amount?: number | string | null | undefined
}): number {
  return Math.round((Number(order.total ?? 0) + Number(order.wallet_amount ?? 0)) * 100) / 100
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function addBusinessDays(from: Date, days: number): Date {
  const result = new Date(from)
  let remaining = days
  while (remaining > 0) {
    result.setDate(result.getDate() + 1)
    const weekday = result.getDay()
    if (weekday !== 0 && weekday !== 6) remaining--
  }
  return result
}

/**
 * Estimated delivery window for a product page: a 2–4 business-day dispatch
 * plus a short transit window, formatted like the KALKI PDP
 * ("Fri, 16 Oct – Thu, 22 Oct 2026").
 */
export function estimatedDeliveryWindow(from: Date = new Date()): string {
  const start = addBusinessDays(from, 2)
  const end = addBusinessDays(from, 6)
  const format = (date: Date) =>
    `${date.toLocaleDateString('en-GB', { weekday: 'short' })}, ${date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    })}`
  const sameYear = start.getFullYear() === end.getFullYear()
  return sameYear
    ? `${format(start)} – ${format(end)} ${end.getFullYear()}`
    : `${format(start)} ${start.getFullYear()} – ${format(end)} ${end.getFullYear()}`
}
