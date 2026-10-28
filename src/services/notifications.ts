import api from './api'
import type { ApiResponse, Notification, Paginated } from '@/types'

/** The signed-in customer's general notifications (`/user/notifications`). */

export async function getMyNotifications(
  page = 1,
  perPage = 15,
): Promise<Paginated<Notification>> {
  const res = await api.get<ApiResponse<Paginated<Notification>>>('/user/notifications', {
    params: { page, per_page: perPage },
  })
  return res.data
}

export async function getMyNotificationsUnreadCount(): Promise<{ count: number }> {
  const res = await api.get<ApiResponse<{ count: number }>>('/user/notifications/unread-count')
  return res.data
}

export async function markMyNotificationRead(id: string): Promise<Notification> {
  const res = await api.put<ApiResponse<Notification>>(`/user/notifications/${id}/read`)
  return res.data
}

export async function markAllMyNotificationsRead(): Promise<void> {
  await api.post('/user/notifications/read-all')
}

export async function deleteMyNotification(id: string): Promise<void> {
  await api.delete(`/user/notifications/${id}`)
}
