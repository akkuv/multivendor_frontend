import api from './api'
import type { ApiResponse, MyReturn } from '@/types'

export interface CreateReturnPayload {
  order_item_id: number
  quantity?: number
  reason: string
  description?: string | null
  images?: string[]
  pickup_address_id?: number
}

export async function getMyReturns(): Promise<MyReturn[]> {
  const res = await api.get<ApiResponse<MyReturn[]>>('/user/returns')
  return res.data
}

export async function getMyReturn(id: number): Promise<MyReturn> {
  const res = await api.get<ApiResponse<MyReturn>>(`/user/returns/${id}`)
  return res.data
}

export async function createReturnRequest(data: CreateReturnPayload): Promise<MyReturn> {
  const res = await api.post<ApiResponse<MyReturn>>('/user/returns', data)
  return res.data
}

export async function withdrawReturn(id: number): Promise<MyReturn> {
  const res = await api.post<ApiResponse<MyReturn>>(`/user/returns/${id}/withdraw`)
  return res.data
}