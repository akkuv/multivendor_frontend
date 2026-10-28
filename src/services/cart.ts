import api from './api'
import type { ApiResponse, Cart, CartTotals } from '@/types'

export interface AddToCartPayload {
  productId: number
  variantId?: number | null
  quantity?: number
}

export async function getCart(): Promise<Cart> {
  const res = await api.get<ApiResponse<Cart>>('/user/cart')
  return res.data
}

export async function addToCart(payload: AddToCartPayload): Promise<Cart> {
  const { productId, variantId, quantity = 1 } = payload
  const res = await api.post<ApiResponse<Cart>>('/user/cart/items', {
    product_id: productId,
    variant_id: variantId ?? null,
    quantity,
  })
  return res.data
}

export async function updateCartItem(itemId: number, quantity: number): Promise<Cart> {
  const res = await api.put<ApiResponse<Cart>>(`/user/cart/items/${itemId}`, { quantity })
  return res.data
}

export async function removeCartItem(itemId: number): Promise<Cart> {
  const res = await api.delete<ApiResponse<Cart>>(`/user/cart/items/${itemId}`)
  return res.data
}

export async function clearCart(): Promise<void> {
  await api.delete('/user/cart')
}

export async function getCartTotals(): Promise<CartTotals> {
  const res = await api.get<ApiResponse<CartTotals>>('/user/cart/totals')
  return res.data
}