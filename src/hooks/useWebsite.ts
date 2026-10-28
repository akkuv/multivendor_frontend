import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAdminWebsiteSettings,
  getWebsiteContent,
  updateAdminWebsiteSettings,
} from '@/services/website'
import { normalizeWebsiteContent } from '@/utils/websiteContent'
import type { WebsiteContent } from '@/types'

const WEBSITE_CONTENT_CACHE_KEY = 'website-content-cache'

function saveWebsiteContentCache(data: WebsiteContent): void {
  try {
    localStorage.setItem(WEBSITE_CONTENT_CACHE_KEY, JSON.stringify(data))
  } catch {
    // ignore storage errors
  }
}

function loadCachedWebsiteContent(): WebsiteContent | undefined {
  try {
    const raw = localStorage.getItem(WEBSITE_CONTENT_CACHE_KEY)
    return raw ? normalizeWebsiteContent(JSON.parse(raw) as WebsiteContent) : undefined
  } catch {
    return undefined
  }
}

export function useWebsiteContent() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== WEBSITE_CONTENT_CACHE_KEY) return
      const fresh = loadCachedWebsiteContent()
      if (fresh) queryClient.setQueryData(['website-content'], fresh)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [queryClient])

  return useQuery({
    queryKey: ['website-content'],
    queryFn: async () => {
      const data = normalizeWebsiteContent(await getWebsiteContent())
      saveWebsiteContentCache(data)
      return data
    },
    initialData: loadCachedWebsiteContent,
    staleTime: 0,
  })
}

export function useAdminWebsiteSettings() {
  return useQuery({
    queryKey: ['admin', 'website-settings'],
    queryFn: getAdminWebsiteSettings,
  })
}

export function useUpdateWebsiteSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateAdminWebsiteSettings,
    onSuccess: (result) => {
      const normalized = normalizeWebsiteContent(result)
      qc.setQueryData(['website-content'], normalized)
      qc.setQueryData(['admin', 'website-settings'], normalized)
      saveWebsiteContentCache(normalized)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'website-settings'] })
      qc.invalidateQueries({ queryKey: ['website-content'] })
    },
  })
}

export type { WebsiteContent }