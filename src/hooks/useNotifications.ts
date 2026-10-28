import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteMyNotification,
  getMyNotifications,
  getMyNotificationsUnreadCount,
  markAllMyNotificationsRead,
  markMyNotificationRead,
} from '@/services/notifications'

const KEY = 'user' as const

export function useMyNotifications(page = 1, perPage = 15, refetchInterval = 0) {
  return useQuery({
    queryKey: [KEY, 'notifications', page, perPage],
    queryFn: () => getMyNotifications(page, perPage),
    refetchInterval,
  })
}

export function useMyNotificationsUnreadCount(refetchInterval = 15_000) {
  return useQuery({
    queryKey: [KEY, 'notifications', 'unread'],
    queryFn: getMyNotificationsUnreadCount,
    refetchInterval,
  })
}

export function useMarkMyNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markMyNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'notifications'] })
      queryClient.invalidateQueries({ queryKey: [KEY, 'notifications', 'unread'] })
    },
  })
}

export function useMarkAllMyNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => markAllMyNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'notifications'] })
      queryClient.invalidateQueries({ queryKey: [KEY, 'notifications', 'unread'] })
    },
  })
}

export function useDeleteMyNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteMyNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'notifications'] })
      queryClient.invalidateQueries({ queryKey: [KEY, 'notifications', 'unread'] })
    },
  })
}
