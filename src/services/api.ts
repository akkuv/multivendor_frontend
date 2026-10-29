import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { setAssetOrigin } from '@/lib/assets'
import { TOKEN_KEY, useAuthStore } from '@/store/authStore'

function resolveApiBase(): string {
  const configured = import.meta.env.VITE_API_BASE_URL
  const LIVE_API_BASE = 'https://mauryaapi.expertshub.in/api/v1'
  // Relative paths (e.g. /api/v1) are only valid in dev. In production there
  // is no proxy, so fall back to the live backend origin.
  if (configured && configured.startsWith('/')) {
    if (import.meta.env.PROD) return LIVE_API_BASE
    return configured
  }
  if (!configured) {
    return LIVE_API_BASE
  }
  // If the configured host is missing, localhost, or a stale IP that doesn't
  // match the origin the page was served from, fall back to the page host so the
  // API keeps working across devices/networks without editing .env.
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
      if (!isStale) return configured
    } catch {
      /* fall through */
    }
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    const port = import.meta.env.VITE_API_PORT ?? '8001'
    return `${window.location.protocol}//${window.location.hostname}:${port}/api/v1`
  }
  return configured ?? '/api/v1'
}

const instance = axios.create({
  baseURL: resolveApiBase(),
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  try {
    const lng = localStorage.getItem('i18nextLng') || 'en'
    config.headers['X-Locale'] = lng === 'hi' ? 'hi' : 'en'
  } catch {}
  return config
})

instance.interceptors.response.use(
  (response) => {
    const payload = response.data as { asset_base?: unknown } | undefined
    if (payload && typeof payload === 'object' && typeof payload.asset_base === 'string') {
      setAssetOrigin(payload.asset_base)
    }
    // The app unwraps responses to the body directly, so return it as-is.
    return payload as unknown as typeof response
  },
  (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
    const data = error.response?.data
    // Field-level validation errors are preserved so forms can show a message
    // under the exact field that failed, not just one flattened summary line.
    const fieldErrors = data?.errors
    let message = data?.message ?? 'Something went wrong. Please try again.'

    if (fieldErrors) {
      const firstError = Object.values(fieldErrors).flat()[0]
      if (typeof firstError === 'string') message = firstError
      else if (firstError && typeof firstError === 'object' && 'message' in firstError) {
        message = String((firstError as { message: unknown }).message)
      }
      // structured error objects such as { code } are intentionally ignored so
      // the backend's `message` (already set above) is what the UI shows.
    }

    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth()
      document.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }

    return Promise.reject(Object.assign(error, { message, fieldErrors }))
  },
)

interface ApiClient {
  get<T>(url: string, config?: Record<string, unknown>): Promise<T>
  post<T>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<T>
  put<T>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<T>
  patch<T>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<T>
  delete<T>(url: string, config?: Record<string, unknown>): Promise<T>
}

const api = instance as unknown as ApiClient

export default api
