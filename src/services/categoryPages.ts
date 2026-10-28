import api from './api'
import type { ApiResponse, Paginated, AdminCategoryPage, AdminCategoryPagePayload, CategoryPageData, CategoryPageSection } from '@/types'

/* ── Public ── */

export async function getCategoryPage(slug: string): Promise<CategoryPageData> {
  const res = await api.get<ApiResponse<CategoryPageData>>(`/category-pages/${slug}`)
  return res.data
}

/* ── Admin: Pages ── */

export async function getAdminCategoryPages(params?: {
  search?: string
  is_active?: boolean
  page?: number
  per_page?: number
}): Promise<Paginated<AdminCategoryPage>> {
  const res = await api.get<ApiResponse<Paginated<AdminCategoryPage>>>('/admin/category-pages', { params })
  return res.data
}

export async function getAdminCategoryPage(id: number): Promise<AdminCategoryPage> {
  const res = await api.get<ApiResponse<AdminCategoryPage>>(`/admin/category-pages/${id}`)
  return res.data
}

export async function createAdminCategoryPage(data: AdminCategoryPagePayload): Promise<AdminCategoryPage> {
  const res = await api.post<ApiResponse<AdminCategoryPage>>('/admin/category-pages', data)
  return res.data
}

export async function updateAdminCategoryPage(id: number, data: Partial<AdminCategoryPagePayload>): Promise<AdminCategoryPage> {
  const res = await api.put<ApiResponse<AdminCategoryPage>>(`/admin/category-pages/${id}`, data)
  return res.data
}

export async function deleteAdminCategoryPage(id: number): Promise<void> {
  await api.delete(`/admin/category-pages/${id}`)
}

export async function toggleAdminCategoryPage(id: number): Promise<AdminCategoryPage> {
  const res = await api.put<ApiResponse<AdminCategoryPage>>(`/admin/category-pages/${id}/toggle`)
  return res.data
}

/* ── Admin: Sections ── */

export async function createAdminCategoryPageSection(pageId: number, data: Partial<CategoryPageSection>): Promise<CategoryPageSection> {
  const res = await api.post<ApiResponse<CategoryPageSection>>(`/admin/category-pages/${pageId}/sections`, data)
  return res.data
}

export async function updateAdminCategoryPageSection(id: number, data: Partial<CategoryPageSection>): Promise<CategoryPageSection> {
  const res = await api.put<ApiResponse<CategoryPageSection>>(`/admin/category-page-sections/${id}`, data)
  return res.data
}

export async function deleteAdminCategoryPageSection(id: number): Promise<void> {
  await api.delete(`/admin/category-page-sections/${id}`)
}

export async function reorderAdminCategoryPageSections(
  pageId: number,
  sections: { id: number; is_active?: boolean }[],
): Promise<void> {
  await api.put(`/admin/category-pages/${pageId}/sections/reorder`, { sections })
}