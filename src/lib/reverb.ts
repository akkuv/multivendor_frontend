import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { TOKEN_KEY } from '@/store/authStore'

/**
 * The `reverb` driver of laravel-echo looks for a global Pusher constructor, so
 * pusher-js has to be handed to it explicitly rather than just imported.
 */
;(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher

/**
 * Realtime transport for the vendor <-> admin support chat.
 *
 * Reverb speaks the Pusher protocol, so the `reverb` driver of laravel-echo is
 * pointed straight at the Reverb server. The socket is built on first use —
 * anonymous visitors never pay for a connection — and rebuilt if the signed-in
 * user changes, because the channel auth request carries the Sanctum token in
 * its Authorization header.
 */

interface RealtimeConfig {
  broadcaster: 'reverb'
  key: string
  wsHost: string
  wsPort: number
  wssPort: number
  forceTLS: boolean
  enabledTransports: ('ws' | 'wss')[]
  authEndpoint: string
  auth: { headers: { Accept: string; Authorization: string } }
}

let echo: Echo<'reverb'> | null = null
let echoToken: string | null = null

function realtimeConfig(token: string): RealtimeConfig {
  // Prefer the explicitly configured host, but fall back to the API origin's host
  // (and finally the current page host) so realtime keeps working when the .env
  // host is stale or points at localhost from another device.
  const apiRoot = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/api\/v1\/?$/, '')
  const pageHost = typeof window !== 'undefined' ? window.location.hostname : ''
  const pagePort = typeof window !== 'undefined' ? window.location.port : ''
  let host = import.meta.env.VITE_REVERB_HOST
  // In dev the Vite proxy forwards /app to Reverb on the same origin, so use
  // the page host/port. Otherwise (prod or explicitly configured) use config.
  const useSameOrigin =
    !host ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    (/^\d+\.\d+\.\d+\.\d+$/.test(host) && pageHost && host !== pageHost)
  if (useSameOrigin && pageHost) {
    host = pageHost
  }
  const key = import.meta.env.VITE_REVERB_APP_KEY
  const scheme = import.meta.env.VITE_REVERB_SCHEME ?? 'http'
  const port = useSameOrigin
    ? Number(pagePort || (scheme === 'https' ? 443 : 80))
    : Number(import.meta.env.VITE_REVERB_PORT ?? (scheme === 'https' ? 443 : 80))

  if (!host || !key) {
    throw new Error(
      'Realtime chat is not configured: set VITE_REVERB_HOST and VITE_REVERB_APP_KEY in frontend/.env.',
    )
  }

  // VITE_API_BASE_URL ends in /api/v1; broadcasting/auth sits at the API root.

  return {
    broadcaster: 'reverb',
    key,
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${apiRoot}/broadcasting/auth`,
    auth: {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  }
}

/**
 * The shared socket for the current signed-in user.
 *
 * Falls back to the stored token so it can be called from places that do not
 * already hold one.
 */
export function getEcho(token?: string | null): Echo<'reverb'> {
  const bearer = token ?? localStorage.getItem(TOKEN_KEY)

  if (echo && echoToken === bearer) {
    return echo
  }

  echo?.disconnect()
  echoToken = bearer
  echo = bearer ? new Echo(realtimeConfig(bearer)) : null

  if (!echo) {
    throw new Error('Sign in to use support chat.')
  }

  return echo
}

export function isRealtimeConfigured(): boolean {
  return Boolean(import.meta.env.VITE_REVERB_HOST && import.meta.env.VITE_REVERB_APP_KEY)
}

/**
 * Tear the socket down, e.g. on sign-out.
 */
export function disconnectEcho(): void {
  echo?.disconnect()
  echo = null
  echoToken = null
}