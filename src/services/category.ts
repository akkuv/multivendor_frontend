import api from './api'
import type { ApiResponse, Category } from '@/types'

export async function getCategories(): Promise<Category[]> {
  const res = await api.get<ApiResponse<Category[]>>('/categories')
  return res.data
}

export async function getAdminCategoriesAll(): Promise<Category[]> {
  const res = await api.get<ApiResponse<Category[]>>('/admin/categories/all', { params: { is_active: true } })
  return res.data
}

export async function getCategory(id: number): Promise<Category> {
  const res = await api.get<ApiResponse<Category>>(`/categories/${id}`)
  return res.data
}
