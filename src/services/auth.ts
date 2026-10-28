import api from './api'
import type { ApiResponse, User } from '@/types'

export interface AuthResult {
  user: User
  token: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
  phone?: string
  role: 'CUSTOMER' | 'VENDOR'
  store_name?: string
  description?: string
}

export async function register(data: RegisterPayload): Promise<AuthResult> {
  const res = await api.post<ApiResponse<AuthResult>>('/auth/register', data)
  return res.data
}

export async function login(data: { email: string; password: string }): Promise<AuthResult> {
  const res = await api.post<ApiResponse<AuthResult>>('/auth/login', data)
  return res.data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

export async function me(): Promise<User> {
  const res = await api.get<ApiResponse<User>>('/auth/me')
  return res.data
}
