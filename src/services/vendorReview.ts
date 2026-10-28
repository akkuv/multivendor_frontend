import api from './api'
import type { ApiResponse, Paginated, Vendor, VendorReview, VendorReviewPayload } from '@/types'

export async function getVendor(vendorId: number): Promise<Vendor> {
  const res = await api.get<ApiResponse<Vendor>>(`/vendors/${vendorId}`)
  return res.data
}

export async function getVendorReviews(vendorId: number): Promise<VendorReview[]> {
  const res = await api.get<ApiResponse<VendorReview[]>>(`/vendors/${vendorId}/reviews`)
  return res.data
}

export async function getMyVendorReviews(): Promise<Paginated<VendorReview>> {
  const res = await api.get<ApiResponse<Paginated<VendorReview>>>('/user/vendor-reviews')
  return res.data
}

export async function submitVendorReview(
  payload: VendorReviewPayload,
): Promise<{ review: VendorReview }> {
  const res = await api.post<ApiResponse<{ review: VendorReview }>>('/user/vendor-reviews', payload)
  return res.data
}

export async function deleteVendorReview(id: number): Promise<void> {
  await api.delete(`/user/vendor-reviews/${id}`)
}

/* ---- Admin moderation ---- */

export interface AdminVendorReviewQuery {
  status?: 'pending' | 'approved' | 'hidden' | 'reported'
  vendor_id?: number
  rating?: number
  per_page?: number
  page?: number
}

export async function getAdminVendorReviews(
  params?: AdminVendorReviewQuery,
): Promise<Paginated<VendorReview>> {
  const res = await api.get<ApiResponse<Paginated<VendorReview>>>('/admin/vendor-reviews', {
    params,
  })
  return res.data
}

export async function approveVendorReview(id: number): Promise<VendorReview> {
  const res = await api.put<ApiResponse<VendorReview>>(`/admin/vendor-reviews/${id}/approve`)
  return res.data
}

export async function hideVendorReview(id: number): Promise<VendorReview> {
  const res = await api.put<ApiResponse<VendorReview>>(`/admin/vendor-reviews/${id}/hide`)
  return res.data
}

export async function unhideVendorReview(id: number): Promise<VendorReview> {
  const res = await api.put<ApiResponse<VendorReview>>(`/admin/vendor-reviews/${id}/unhide`)
  return res.data
}

export async function reportVendorReview(id: number, reason: string): Promise<VendorReview> {
  const res = await api.post<ApiResponse<VendorReview>>(`/admin/vendor-reviews/${id}/report`, {
    reason,
  })
  return res.data
}

export async function clearVendorReviewReport(id: number): Promise<VendorReview> {
  const res = await api.delete<ApiResponse<VendorReview>>(`/admin/vendor-reviews/${id}/report`)
  return res.data
}

export async function deleteVendorReviewAsAdmin(id: number): Promise<void> {
  await api.delete(`/admin/vendor-reviews/${id}`)
}