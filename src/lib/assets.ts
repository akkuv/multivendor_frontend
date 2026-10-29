/**
 * The Vite dev server and the Laravel API run on separate ports, so any path
 * the backend stores or returns must be resolved against the API origin
 * instead of the frontend origin.
 */
const ENV_ORIGIN = (import.meta.env.VITE_ASSET_BASE_URL ?? (import.meta.env.PROD ? 'https://mauryaapi.expertshub.in' : '')).replace(/\/+$/, '')

/**
 * Origin of the API the browser is actually talking to right now. The backend
 * sends this on every response, so stored relative paths keep resolving even
 * when the LAN IP / host changes and `VITE_ASSET_BASE_URL` goes stale.
 */
let runtimeOrigin = ''

/** Records the API origin reported by the backend (see the axios interceptor). */
export function setAssetOrigin(origin: string | null | undefined): void {
  if (typeof origin === 'string') {
    runtimeOrigin = origin.replace(/\/+$/, '')
  }
}

/**
 * Turns a backend-supplied image path into a URL the browser can load.
 *
 * Absolute URLs and data URIs are returned untouched. Root-relative paths such
 * as `/uploads/images/2026-10/ab.png` are prefixed with the runtime API origin
 * when available, falling back to `VITE_ASSET_BASE_URL`.
 */
export function assetUrl(path: string | null | undefined): string {
  if (typeof path !== 'string' || !path) {
    return ''
  }

  const trimmed = path.trim()
  if (!trimmed || /^(https?:|data:|blob:)/i.test(trimmed)) {
    return trimmed
  }

  const origin = runtimeOrigin || ENV_ORIGIN
  if (!origin) {
    return trimmed
  }

  return `${origin}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`
}