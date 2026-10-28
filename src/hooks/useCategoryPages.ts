import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAdminCategoryPage,
  createAdminCategoryPageSection,
  deleteAdminCategoryPage,
  deleteAdminCategoryPageSection,
  getAdminCategoryPage,
  getAdminCategoryPages,
  getCategoryPage,
  reorderAdminCategoryPageSections,
  toggleAdminCategoryPage,
  updateAdminCategoryPage,
  updateAdminCategoryPageSection,
} from '@/services/categoryPages'
import type { AdminCategoryPagePayload, CategoryPageSection } from '@/types'

export function useCategoryPage(slug: string | undefined) {
  return useQuery({
    queryKey: ['category-page', slug],
    queryFn: () => getCategoryPage(slug as string),
    enabled: !!slug,
  })
}

export function useAdminCategoryPages(params?: { search?: string; is_active?: boolean; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ['admin', 'category-pages', params],
    queryFn: () => getAdminCategoryPages(params),
  })
}

export function useAdminCategoryPage(id: number | undefined) {
  return useQuery({
    queryKey: ['admin', 'category-page', id],
    queryFn: () => getAdminCategoryPage(id as number),
    enabled: id != null,
  })
}

export function useCreateAdminCategoryPage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAdminCategoryPage,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'category-pages'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useUpdateAdminCategoryPage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AdminCategoryPagePayload> }) => updateAdminCategoryPage(id, data),
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'category-pages'] })
      qc.invalidateQueries({ queryKey: ['admin', 'category-page', vars.id] })
      qc.invalidateQueries({ queryKey: ['category-page'] })
    },
  })
}

export function useDeleteAdminCategoryPage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminCategoryPage,
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'category-pages'] }),
  })
}

export function useToggleAdminCategoryPage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: toggleAdminCategoryPage,
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'category-pages'] })
      qc.invalidateQueries({ queryKey: ['admin', 'category-page', vars] })
    },
  })
}

export function useCreateAdminCategoryPageSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ pageId, data }: { pageId: number; data: Partial<CategoryPageSection> }) =>
      createAdminCategoryPageSection(pageId, data),
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'category-page', vars.pageId] })
      qc.invalidateQueries({ queryKey: ['category-page'] })
    },
  })
}

export function useUpdateAdminCategoryPageSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CategoryPageSection> }) =>
      updateAdminCategoryPageSection(id, data),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'category-page'] })
      qc.invalidateQueries({ queryKey: ['category-page'] })
    },
  })
}

export function useDeleteAdminCategoryPageSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminCategoryPageSection,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'category-page'] })
      qc.invalidateQueries({ queryKey: ['category-page'] })
    },
  })
}

export function useReorderAdminCategoryPageSections() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ pageId, sections }: { pageId: number; sections: { id: number; is_active?: boolean }[] }) =>
      reorderAdminCategoryPageSections(pageId, sections),
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'category-page', vars.pageId] })
      qc.invalidateQueries({ queryKey: ['category-page'] })
    },
  })
}