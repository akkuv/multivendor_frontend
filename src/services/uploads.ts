import { TOKEN_KEY } from '@/store/authStore'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/+$/, '')

function resolveBase(): string {
  // Relative paths (e.g. /api/v1) resolve against the current origin so the
  // request works in dev (Vite proxy) and on the deployed frontend alike.
  if (API_BASE.startsWith('/')) {
    return `${window.location.origin}${API_BASE}`
  }
  return API_BASE
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('image', file)

  const token = localStorage.getItem(TOKEN_KEY)
  const res = await fetch(`${resolveBase()}/uploads/images`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  })

  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || 'Could not upload the image. Please try again.')
  }
  return json.data.url
}

export async function uploadVideo(file: File): Promise<string> {
  const form = new FormData()
  form.append('video', file)

  const token = localStorage.getItem(TOKEN_KEY)
  const res = await fetch(`${resolveBase()}/uploads/videos`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  })

  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || 'Could not upload the video. Please try again.')
  }
  return json.data.url
}