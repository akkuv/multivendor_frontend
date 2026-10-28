import api from './api'
import type { ApiResponse, Paginated, AdminCustomPagePayload, CustomPage, CustomPageData } from '@/types'

/* ── Public ── */

export async function getCustomPage(slug: string): Promise<CustomPageData> {
  const path = slug
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/')
  const res = await api.get<ApiResponse<CustomPageData>>(`/pages/${path}`)
  return res.data
}

/* ── Admin: Pages ── */

export async function getAdminPages(params?: {
  search?: string
  is_active?: boolean
  page?: number
  per_page?: number
}): Promise<Paginated<CustomPage>> {
  const res = await api.get<ApiResponse<Paginated<CustomPage>>>('/admin/pages', { params })
  return res.data
}

export async function getAdminPage(id: number): Promise<CustomPage> {
  const res = await api.get<ApiResponse<CustomPage>>(`/admin/pages/${id}`)
  return res.data
}

export async function createAdminPage(data: AdminCustomPagePayload): Promise<CustomPage> {
  const res = await api.post<ApiResponse<CustomPage>>('/admin/pages', data)
  return res.data
}

export async function updateAdminPage(id: number, data: Partial<AdminCustomPagePayload>): Promise<CustomPage> {
  const res = await api.put<ApiResponse<CustomPage>>(`/admin/pages/${id}`, data)
  return res.data
}

export async function deleteAdminPage(id: number): Promise<void> {
  await api.delete(`/admin/pages/${id}`)
}

export async function toggleAdminPage(id: number): Promise<CustomPage> {
  const res = await api.put<ApiResponse<CustomPage>>(`/admin/pages/${id}/toggle`)
  return res.data
}
