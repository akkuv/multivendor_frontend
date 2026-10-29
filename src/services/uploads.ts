import api from './api'
import type { ApiResponse } from '@/types'

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('image', file)
  const res = await api.post<ApiResponse<{ url: string }>>('/uploads/images', form, {
    headers: { 'Content-Type': undefined },
  })
  return res.data.url
}

export async function uploadVideo(file: File): Promise<string> {
  const form = new FormData()
  form.append('video', file)
  const res = await api.post<ApiResponse<{ url: string }>>('/uploads/videos', form, {
    headers: { 'Content-Type': undefined },
  })
  return res.data.url
}