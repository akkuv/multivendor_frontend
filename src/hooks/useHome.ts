import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getHomePage } from '@/services/home'
import type { HomePageData } from '@/types'

/**
 * Bump this whenever the shape or meaning of the cached payload changes so old
 * snapshots (e.g. captured before the storefront layout was made deterministic)
 * are discarded instead of being served as fresh data.
 */
export const HOME_PAGE_CACHE_VERSION = 6

export const HOME_PAGE_CACHE_KEY = 'home-page-cache'

interface HomePageSnapshot {
  version: number
  data: HomePageData
  /** When the snapshot was captured, so its real age survives a reload. */
  savedAt: number
}

export function invalidateHomePageCache(): void {
  try {
    localStorage.removeItem(HOME_PAGE_CACHE_KEY)
  } catch {
    // ignore storage errors
  }
}

function readSnapshot(): HomePageSnapshot | null {
  try {
    const raw = localStorage.getItem(HOME_PAGE_CACHE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<HomePageSnapshot>
    if (parsed.version !== HOME_PAGE_CACHE_VERSION || !parsed.data) {
      return null
    }

    return parsed as HomePageSnapshot
  } catch {
    return null
  }
}

export function useHome() {
  const queryClient = useQueryClient()

  // Admins drop the persisted snapshot after every save. When that happens in
  // another tab (admin + storefront open side by side) drop the in-memory copy
  // here as well, so storefront edits show up without a hard reload.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === HOME_PAGE_CACHE_KEY && !event.newValue) {
        queryClient.invalidateQueries({ queryKey: ['home'] })
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [queryClient])

  return useQuery({
    queryKey: ['home'],
    queryFn: async () => {
      const data = await getHomePage()
      try {
        const snapshot: HomePageSnapshot = {
          version: HOME_PAGE_CACHE_VERSION,
          data,
          savedAt: Date.now(),
        }
        localStorage.setItem(HOME_PAGE_CACHE_KEY, JSON.stringify(snapshot))
      } catch {
        // ignore storage errors
      }
      return data
    },
    // Paint instantly from the snapshot, but always refresh in the background so a
    // storefront tab picks up an admin save (new cards, headings, links) on its own
    // instead of staying pinned to whatever it loaded first.
    initialData: () => readSnapshot()?.data,
    initialDataUpdatedAt: () => readSnapshot()?.savedAt ?? 0,
    staleTime: 0,
    // The global default disables these, which left a long-lived storefront tab
    // showing stale section content long after the admin saved.
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}
