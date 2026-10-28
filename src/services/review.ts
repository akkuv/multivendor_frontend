import api from './api'
import type { ApiResponse, Paginated, Review, ReviewPayload, ReviewStats } from '@/types'

export async function getProductReviews(productId: number): Promise<Review[]> {
  const res = await api.get<ApiResponse<Review[]>>(`/products/${productId}/reviews`)
  return res.data
}

export async function getMyReviews(): Promise<Paginated<Review>> {
  const res = await api.get<ApiResponse<Paginated<Review>>>('/user/reviews')
  return res.data
}

export async function submitReview(payload: ReviewPayload): Promise<{ review: Review }> {
  const res = await api.post<ApiResponse<{ review: Review }>>('/user/reviews', payload)
  return res.data
}

export async function updateReview(id: number, payload: ReviewPayload): Promise<{ review: Review }> {
  const res = await api.put<ApiResponse<{ review: Review }>>(`/user/reviews/${id}`, payload)
  return res.data
}

export async function deleteReview(id: number): Promise<void> {
  await api.delete(`/user/reviews/${id}`)
}

/* ---- Admin moderation ---- */

export interface AdminReviewQuery {
  status?: 'pending' | 'approved' | 'hidden' | 'reported'
  product_id?: number
  vendor_id?: number
  rating?: number
  per_page?: number
  page?: number
}

export async function getAdminReviews(params?: AdminReviewQuery): Promise<Paginated<Review>> {
  const res = await api.get<ApiResponse<Paginated<Review>>>('/admin/reviews', { params })
  return res.data
}

export async function getAdminReviewStats(): Promise<ReviewStats> {
  const res = await api.get<ApiResponse<ReviewStats>>('/admin/reviews/stats')
  return res.data
}

export async function approveReview(id: number): Promise<Review> {
  const res = await api.put<ApiResponse<Review>>(`/admin/reviews/${id}/approve`)
  return res.data
}

export async function hideReview(id: number): Promise<Review> {
  const res = await api.put<ApiResponse<Review>>(`/admin/reviews/${id}/hide`)
  return res.data
}

export async function unhideReview(id: number): Promise<Review> {
  const res = await api.put<ApiResponse<Review>>(`/admin/reviews/${id}/unhide`)
  return res.data
}

export async function reportReview(id: number, reason: string): Promise<Review> {
  const res = await api.post<ApiResponse<Review>>(`/admin/reviews/${id}/report`, { reason })
  return res.data
}

export async function clearReport(id: number): Promise<Review> {
  const res = await api.delete<ApiResponse<Review>>(`/admin/reviews/${id}/report`)
  return res.data
}

export async function moderateReviewImages(id: number, images: string[]): Promise<Review> {
  const res = await api.put<ApiResponse<Review>>(`/admin/reviews/${id}/images`, { images })
  return res.data
}

export async function deleteReviewAsAdmin(id: number): Promise<void> {
  await api.delete(`/admin/reviews/${id}`)
}