import api from './api'
import type { ApiResponse, WebsiteContent } from '@/types'

/* ── Public ── */

export async function getWebsiteContent(): Promise<WebsiteContent> {
  const res = await api.get<ApiResponse<WebsiteContent>>('/website-content')
  return res.data
}

/* ── Admin ── */

export async function getAdminWebsiteSettings(): Promise<WebsiteContent> {
  const res = await api.get<ApiResponse<WebsiteContent>>('/admin/website-settings')
  return res.data
}

export async function updateAdminWebsiteSettings(data: Partial<WebsiteContent>): Promise<WebsiteContent> {
  const res = await api.put<ApiResponse<WebsiteContent>>('/admin/website-settings', data)
  return res.data
}