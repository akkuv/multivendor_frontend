import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAdminPage,
  deleteAdminPage,
  getAdminPage,
  getAdminPages,
  getCustomPage,
  toggleAdminPage,
  updateAdminPage,
} from '@/services/pages'
import type { AdminCustomPagePayload } from '@/types'

export function useCustomPage(slug: string | undefined) {
  return useQuery({
    queryKey: ['custom-page', slug],
    queryFn: () => getCustomPage(slug as string),
    enabled: !!slug,
  })
}

export function useAdminPages(params?: { search?: string; is_active?: boolean; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ['admin', 'pages', params],
    queryFn: () => getAdminPages(params),
  })
}

export function useAdminPage(id: number | undefined) {
  return useQuery({
    queryKey: ['admin', 'page', id],
    queryFn: () => getAdminPage(id as number),
    enabled: id != null,
  })
}

export function useCreateAdminPage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAdminPage,
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'pages'] }),
  })
}

export function useUpdateAdminPage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AdminCustomPagePayload> }) => updateAdminPage(id, data),
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'pages'] })
      qc.invalidateQueries({ queryKey: ['admin', 'page', vars.id] })
      qc.invalidateQueries({ queryKey: ['custom-page'] })
    },
  })
}

export function useDeleteAdminPage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminPage,
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'pages'] }),
  })
}

export function useToggleAdminPage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: toggleAdminPage,
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'pages'] })
      qc.invalidateQueries({ queryKey: ['admin', 'page', vars] })
      qc.invalidateQueries({ queryKey: ['custom-page'] })
    },
  })
}
