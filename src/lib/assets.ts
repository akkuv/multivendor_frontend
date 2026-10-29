/**
 * The Vite dev server and the Laravel API run on separate ports, so any path
 * the backend stores or returns must be resolved against the API origin
 * instead of the frontend origin.
 */
function resolveOrigin(): string {
  const configured = import.meta.env.VITE_ASSET_BASE_URL
  if (configured) {
    try {
      const url = new URL(configured)
      const pageHost = typeof window !== 'undefined' ? window.location.hostname : ''
      const isStale =
        (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)) &&
        pageHost &&
        pageHost !== 'localhost' &&
        pageHost !== '127.0.0.1' &&
        url.hostname !== pageHost
      if (!isStale) return configured.replace(/\/+$/, '')
    } catch {
      /* fall through */
    }
  }
  if (import.meta.env.PROD) {
    return 'https://mauryaapi.expertshub.in'
  }
  // Dev: derive from the page host so images resolve on any device/network.
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:8001`
  }
  return ''
}

const ENV_ORIGIN = resolveOrigin()

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