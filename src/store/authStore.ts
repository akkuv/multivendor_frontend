import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

export const TOKEN_KEY = 'auth_token'

/**
 * Invalidate the landing-page snapshot whenever the auth state changes (login
 * or logout) so the storefront always reflects the current admin-configured
 * homepage instead of a stale cached layout from another session.
 */
function invalidateStorefrontHomeCache(): void {
  try {
    localStorage.removeItem('home-page-cache')
  } catch {
    // ignore storage errors
  }
}

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  setUser: (user: User) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem(TOKEN_KEY, token)
        invalidateStorefrontHomeCache()
        set({ user, token })
      },
      setUser: (user) => set({ user }),
      clearAuth: () => {
        localStorage.removeItem(TOKEN_KEY)
        invalidateStorefrontHomeCache()
        set({ user: null, token: null })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
)
