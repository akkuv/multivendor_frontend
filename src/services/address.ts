import api from './api'
import type { Address, ApiResponse } from '@/types'

export type AddressPayload = Omit<Address, 'id'>

export async function getAddresses(): Promise<Address[]> {
  const res = await api.get<ApiResponse<Address[]>>('/user/addresses')
  return res.data
}

export async function createAddress(data: AddressPayload): Promise<Address> {
  const res = await api.post<ApiResponse<Address>>('/user/addresses', data)
  return res.data
}

export async function updateAddress(id: number, data: Partial<AddressPayload>): Promise<Address> {
  const res = await api.put<ApiResponse<Address>>(`/user/addresses/${id}`, data)
  return res.data
}

export async function deleteAddress(id: number): Promise<void> {
  await api.delete(`/user/addresses/${id}`)
}
