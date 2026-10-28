import api from './api'
import type { ApiResponse, Coupon } from '@/types'

export interface CouponValidation {
  coupon: Coupon
  discount: number
}

export async function validateCoupon(
  code: string,
  subtotal: number,
): Promise<CouponValidation> {
  const res = await api.post<ApiResponse<CouponValidation>>('/user/coupons/validate', {
    code,
    subtotal,
  })
  return res.data
}
