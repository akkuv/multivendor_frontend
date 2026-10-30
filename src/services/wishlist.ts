import api from './api'
import type { ApiResponse, Cart, Paginated, Product, WishlistItem, WishlistNotification } from '@/types'

export async function getWishlist(): Promise<Paginated<WishlistItem>> {
  const res = await api.get<ApiResponse<Paginated<WishlistItem>>>('/user/wishlist')
  return res.data
}

export async function addToWishlist(productId: number): Promise<WishlistItem> {
  const res = await api.post<ApiResponse<WishlistItem>>('/user/wishlist', { product_id: productId })
  return res.data
}

export async function removeFromWishlist(product: Product): Promise<void> {
  await api.delete(`/user/wishlist/${product.id}`)
}

export async function clearWishlist(): Promise<void> {
  await api.delete('/user/wishlist')
}

export interface UpdateNotificationsPayload {
  notifyPriceDrops?: boolean
  notifyBackInStock?: boolean
}

export async function updateWishlistNotifications(
  productId: number,
  payload: UpdateNotificationsPayload,
): Promise<WishlistItem> {
  const res = await api.put<ApiResponse<WishlistItem>>(`/user/wishlist/${productId}/notifications`, {
    notify_price_drops: payload.notifyPriceDrops,
    notify_back_in_stock: payload.notifyBackInStock,
  })
  return res.data
}

export async function getWishlistNotifications(): Promise<Paginated<WishlistNotification>> {
  const res = await api.get<ApiResponse<Paginated<WishlistNotification>>>('/user/wishlist-notifications')
  return res.data
}

export async function markWishlistNotificationsRead(): Promise<void> {
  await api.post('/user/wishlist-notifications/read')
}

export interface MoveToCartPayload {
  variantId?: number | null
  quantity?: number
}

export async function moveWishlistItemToCart(product: Product, payload: MoveToCartPayload = {}): Promise<Cart> {
  const res = await api.post<ApiResponse<Cart>>(`/user/wishlist/${product.id}/move-to-cart`, {
    variant_id: payload.variantId ?? null,
    quantity: payload.quantity ?? 1,
  })
  return res.data
}

// ---- Admin wishlist insights ----
export interface WishlistInsightStats {
  total_entries: number
  active_entries: number
  removed_entries: number
  customers_with_wishlist: number
  unique_products: number
  most_wishlisted: Array<{ product_id: number; wishlist_count: number; product?: any }>
  recent: Array<any>
}

export async function getWishlistInsightStats(): Promise<WishlistInsightStats> {
  const res = await api.get<ApiResponse<WishlistInsightStats>>('/admin/wishlist/insights/stats')
  return res.data
}

export async function getWishlistInsightList(params: Record<string, unknown> = {}): Promise<Paginated<any>> {
  const res = await api.get<ApiResponse<Paginated<any>>>('/admin/wishlist/insights', { params })
  return res.data
}

export async function getCustomerWishlistDetail(userId: number): Promise<any> {
  const res = await api.get<ApiResponse<any>>(`/admin/wishlist/insights/customers/${userId}`)
  return res.data
}

export async function getWishlistRecommendations(productId: number): Promise<any[]> {
  const res = await api.get<ApiResponse<any[]>>(`/admin/wishlist/insights/recommendations/${productId}`)
  return res.data
}

export async function sendWishlistSuggestion(payload: {
  customer_user_id: number
  product_id: number
  recommended_product_ids: number[]
  message?: string
  channel?: string
}): Promise<{ suggestion: any; delivery_status: string }> {
  const res = await api.post<ApiResponse<{ suggestion: any; delivery_status: string }>>('/admin/wishlist/insights/suggest', payload)
  return res.data
}

export async function getWishlistSuggestionHistory(params: Record<string, unknown> = {}): Promise<Paginated<any>> {
  const res = await api.get<ApiResponse<Paginated<any>>>('/admin/wishlist/insights/suggestions', { params })
  return res.data
}