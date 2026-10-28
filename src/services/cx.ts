import api from './api'
import type {
  ApiResponse,
  Paginated,
  Product,
  ProductQuestion,
  ProductQuestionPayload,
} from '@/types'

/* ---- Public discovery ---- */

export async function getRelatedProducts(productId: number): Promise<Product[]> {
  const res = await api.get<ApiResponse<Product[]>>(`/products/${productId}/related`)
  return res.data
}

export async function getFrequentlyBought(productId: number): Promise<Product[]> {
  const res = await api.get<ApiResponse<Product[]>>(`/products/${productId}/frequently-bought`)
  return res.data
}

export async function compareProducts(ids: number[]): Promise<{ order: number[]; products: Product[] }> {
  const res = await api.get<ApiResponse<{ order: number[]; products: Product[] }>>('/products/compare', {
    params: { ids: ids.join(',') },
  })
  return res.data
}

/* ---- Product Q&A ---- */

export async function getProductQuestions(productId: number): Promise<ProductQuestion[]> {
  const res = await api.get<ApiResponse<ProductQuestion[]>>(`/products/${productId}/questions`)
  return res.data
}

export async function askQuestion(
  productId: number,
  payload: ProductQuestionPayload,
): Promise<ProductQuestion> {
  const res = await api.post<ApiResponse<ProductQuestion>>(
    `/user/products/${productId}/questions`,
    payload,
  )
  return res.data
}

export async function getMyQuestions(): Promise<Paginated<ProductQuestion>> {
  const res = await api.get<ApiResponse<Paginated<ProductQuestion>>>('/user/questions')
  return res.data
}

export async function deleteQuestion(id: number): Promise<void> {
  await api.delete(`/user/questions/${id}`)
}

export async function getAdminQuestions(
  params?: { status?: string; product_id?: number; per_page?: number; page?: number },
): Promise<Paginated<ProductQuestion>> {
  const res = await api.get<ApiResponse<Paginated<ProductQuestion>>>('/admin/questions', { params })
  return res.data
}

export async function hideQuestion(id: number): Promise<ProductQuestion> {
  const res = await api.put<ApiResponse<ProductQuestion>>(`/admin/questions/${id}/hide`)
  return res.data
}

export async function unhideQuestion(id: number): Promise<ProductQuestion> {
  const res = await api.put<ApiResponse<ProductQuestion>>(`/admin/questions/${id}/unhide`)
  return res.data
}

export async function reportQuestion(id: number, reason: string): Promise<ProductQuestion> {
  const res = await api.post<ApiResponse<ProductQuestion>>(`/admin/questions/${id}/report`, { reason })
  return res.data
}

export async function clearQuestionReport(id: number): Promise<ProductQuestion> {
  const res = await api.delete<ApiResponse<ProductQuestion>>(`/admin/questions/${id}/report`)
  return res.data
}

export async function deleteQuestionAsAdmin(id: number): Promise<void> {
  await api.delete(`/admin/questions/${id}`)
}

/* ---- Personalized (authenticated) ---- */

export async function getRecentlyViewed(): Promise<Product[]> {
  const res = await api.get<ApiResponse<Product[]>>('/user/recently-viewed')
  return res.data
}

export async function getBuyAgain(): Promise<Product[]> {
  const res = await api.get<ApiResponse<Product[]>>('/user/buy-again')
  return res.data
}

export async function getRecommendations(): Promise<Product[]> {
  const res = await api.get<ApiResponse<Product[]>>('/user/recommendations')
  return res.data
}

export async function recordProductView(productId: number): Promise<void> {
  await api.post(`/user/products/${productId}/view`)
}