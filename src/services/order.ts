import api from './api'
import type { ApiResponse, Order, Paginated, ShipmentDetail } from '@/types'

export interface RazorpayCheckout {
  order_id: string
  payment_id: number
  amount: number
  currency: string
  key: string
  wallet_amount: number
}

export interface PlaceOrderResult {
  order: Order
  payment: RazorpayCheckout | null
}

export interface PlaceOrderPayload {
  address_id: number
  coupon_code?: string
  payment_method?: string
  wallet_amount?: number
}

export interface VerifyPaymentPayload {
  order_id: number
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export async function placeOrder(data: PlaceOrderPayload): Promise<PlaceOrderResult> {
  const res = await api.post<ApiResponse<PlaceOrderResult>>('/user/orders', data)
  return res.data
}

export async function getMyOrders(): Promise<Paginated<Order>> {
  const res = await api.get<ApiResponse<Paginated<Order>>>('/user/orders')
  return res.data
}

export async function getOrder(id: number): Promise<Order> {
  const res = await api.get<ApiResponse<{ order: Order }>>(`/user/orders/${id}`)
  return res.data.order
}

export async function cancelOrder(id: number, reason?: string): Promise<Order> {
  const res = await api.post<ApiResponse<{ order: Order }>>(`/user/orders/${id}/cancel`, { reason })
  return res.data.order
}

export async function verifyPayment(data: VerifyPaymentPayload): Promise<void> {
  await api.post('/user/payments/verify', data)
}

export interface TrackingLeg {
  status?: string
  status_date?: string
  date?: string
  time?: string
  location?: string
  remark?: string
}

export interface CourierTracking {
  awb?: string
  tracking_number?: string
  is_current?: boolean
  couriers?: { name?: string; phone?: string }
  tracking_data?: TrackingLeg[]
}

export interface OrderTracking {
  shipment: ShipmentDetail
  tracking: CourierTracking | null
  /** Set when the live courier lookup failed but a stored status is available. */
  tracking_notice: string | null
}

/**
 * Live AWB status for one of the signed-in customer's orders. The backend
 * proxies the Shiprocket lookup so no Shiprocket credentials reach the browser.
 */
export async function trackOrder(id: number): Promise<OrderTracking> {
  const res = await api.get<ApiResponse<OrderTracking>>(`/user/track/${id}`)
  return res.data
}
