import api from './api'
import type { ApiResponse, PaymentOptions, PaymentSettings } from '@/types'

export async function getPaymentOptions(): Promise<PaymentOptions> {
  const res = await api.get<ApiResponse<PaymentOptions>>('/payment-options')
  return res.data
}

export async function getAdminPaymentSettings(): Promise<PaymentSettings> {
  const res = await api.get<ApiResponse<PaymentSettings>>('/admin/payment-settings')
  return res.data
}

export interface AdminPaymentSettingsPayload {
  razorpay_enabled?: boolean
  cod_enabled?: boolean
  wallet_enabled?: boolean
  razorpay_key_id?: string | null
  razorpay_key_secret?: string
  razorpay_webhook_secret?: string
  razorpay_mode?: string
  cod_min_amount?: number
  cod_max_amount?: number | null
  cod_fee?: number
  free_delivery_threshold?: number | null
  currency?: string
}

export interface RazorpayConnectionResult {
  connected: boolean
  message: string
}

export async function updateAdminPaymentSettings(
  data: AdminPaymentSettingsPayload,
): Promise<PaymentSettings> {
  const res = await api.put<ApiResponse<PaymentSettings>>('/admin/payment-settings', data)
  return res.data
}

export interface RazorpayTestPayload {
  razorpay_key_id?: string | null
  razorpay_key_secret?: string
}

export async function testAdminRazorpay(
  payload: RazorpayTestPayload = {},
): Promise<RazorpayConnectionResult> {
  const res = await api.post<ApiResponse<RazorpayConnectionResult>>(
    '/admin/payment-settings/test-razorpay',
    payload,
  )
  return res.data
}