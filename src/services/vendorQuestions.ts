import api from './api'
import type { ApiResponse, Paginated, ProductAnswerPayload, ProductQuestion } from '@/types'

export async function getVendorQuestions(): Promise<Paginated<ProductQuestion>> {
  const res = await api.get<ApiResponse<ProductQuestion[]>>('/vendor/questions')
  const items = Array.isArray(res.data) ? res.data : []
  return {
    data: items,
    current_page: 1,
    last_page: 1,
    per_page: items.length,
    total: items.length,
  }
}

export async function answerQuestion(
  id: number,
  payload: ProductAnswerPayload,
): Promise<ProductQuestion> {
  const res = await api.post<ApiResponse<ProductQuestion>>(`/vendor/questions/${id}/answer`, payload)
  return res.data
}