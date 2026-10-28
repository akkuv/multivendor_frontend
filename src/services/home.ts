import api from './api'
import type { ApiResponse, Paginated, HomeBanner, HomePageData, HomepageSection, Testimonial } from '@/types'

/* ── Public ── */

export async function getHomePage(): Promise<HomePageData> {
  const res = await api.get<ApiResponse<HomePageData>>('/home')
  return res.data
}

/* ── Admin: Homepage Sections ── */

export async function getAdminHomepageSections(customPageId?: number): Promise<HomepageSection[]> {
  const res = await api.get<ApiResponse<HomepageSection[]>>('/admin/homepage-sections', {
    params: customPageId ? { custom_page_id: customPageId } : undefined,
  })
  return res.data
}

export async function getAdminHomepageSection(id: number): Promise<HomepageSection> {
  const res = await api.get<ApiResponse<HomepageSection>>(`/admin/homepage-sections/${id}`)
  return res.data
}

export async function createAdminHomepageSection(data: Partial<HomepageSection>): Promise<HomepageSection> {
  const res = await api.post<ApiResponse<HomepageSection>>('/admin/homepage-sections', data)
  return res.data
}

export async function updateAdminHomepageSection(id: number, data: Partial<HomepageSection>): Promise<HomepageSection> {
  const res = await api.put<ApiResponse<HomepageSection>>(`/admin/homepage-sections/${id}`, data)
  return res.data
}

export async function deleteAdminHomepageSection(id: number): Promise<void> {
  await api.delete(`/admin/homepage-sections/${id}`)
}

export async function reorderAdminHomepageSections(
  sections: { id: number; is_active?: boolean }[],
): Promise<void> {
  await api.put('/admin/homepage-sections/reorder', { sections })
}

export async function toggleAdminHomepageSection(id: number): Promise<HomepageSection> {
  const res = await api.put<ApiResponse<HomepageSection>>(`/admin/homepage-sections/${id}/toggle`)
  return res.data
}

/* ── Admin: Banners ── */

export async function getAdminBanners(params?: { position?: string; is_active?: boolean; page?: number; per_page?: number }): Promise<Paginated<HomeBanner>> {
  const res = await api.get<ApiResponse<Paginated<HomeBanner>>>('/admin/banners', { params })
  return res.data
}

export async function createAdminBanner(data: Partial<HomeBanner>): Promise<HomeBanner> {
  const res = await api.post<ApiResponse<HomeBanner>>('/admin/banners', data)
  return res.data
}

export async function updateAdminBanner(id: number, data: Partial<HomeBanner>): Promise<HomeBanner> {
  const res = await api.put<ApiResponse<HomeBanner>>(`/admin/banners/${id}`, data)
  return res.data
}

export async function deleteAdminBanner(id: number): Promise<void> {
  await api.delete(`/admin/banners/${id}`)
}

export async function reorderAdminBanners(ordered_ids: number[]): Promise<void> {
  await api.put('/admin/banners/reorder', { ordered_ids })
}

export async function toggleAdminBanner(id: number): Promise<HomeBanner> {
  const res = await api.put<ApiResponse<HomeBanner>>(`/admin/banners/${id}/toggle`)
  return res.data
}

/* ── Admin: Testimonials ── */

export async function getAdminTestimonials(params?: { is_active?: boolean; page?: number; per_page?: number }): Promise<Paginated<Testimonial>> {
  const res = await api.get<ApiResponse<Paginated<Testimonial>>>('/admin/testimonials', { params })
  return res.data
}

export async function createAdminTestimonial(data: Partial<Testimonial>): Promise<Testimonial> {
  const res = await api.post<ApiResponse<Testimonial>>('/admin/testimonials', data)
  return res.data
}

export async function updateAdminTestimonial(id: number, data: Partial<Testimonial>): Promise<Testimonial> {
  const res = await api.put<ApiResponse<Testimonial>>(`/admin/testimonials/${id}`, data)
  return res.data
}

export async function deleteAdminTestimonial(id: number): Promise<void> {
  await api.delete(`/admin/testimonials/${id}`)
}

export async function toggleAdminTestimonial(id: number): Promise<Testimonial> {
  const res = await api.put<ApiResponse<Testimonial>>(`/admin/testimonials/${id}/toggle`)
  return res.data
}
