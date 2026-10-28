import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { getEcho, isRealtimeConfigured } from '@/lib/reverb'
import { toast } from '@/lib/toast'
import { adminNotificationTarget } from '@/lib/notifications'

/** Payload the backend pushes over `App.Models.User.{id}`. */
export interface NotificationCreatedEvent {
  type: string | null
  title: string | null
  message: string | null
  meta: Record<string, unknown>
}

const ADMIN_NOTIFICATIONS_KEY = ['admin', 'notifications'] as const
const ADMIN_NOTIFICATIONS_UNREAD_KEY = ['admin', 'notifications', 'unread'] as const

/**
 * Keep the admin panel's notification bell live.
 *
 * Subscribes to the signed-in admin's own private channel and, whenever a
 * notification lands, pops a toast on whatever admin page is open and
 * invalidates the bell queries so the badge updates immediately instead of
 * waiting for the 15s poll. The backend is the source of truth: the event only
 * triggers a refetch, it never renders directly.
 */
export function useAdminNotificationsRealtime(): void {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    if (!user?.id || !token || !isRealtimeConfigured()) {
      return
    }

    let echo: ReturnType<typeof getEcho>
    try {
      echo = getEcho(token)
    } catch {
      return
    }

    const channelName = `App.Models.User.${user.id}`
    const channel = echo.private(channelName)

    channel.listen('.notification.created', (event: NotificationCreatedEvent) => {
      const target = adminNotificationTarget({ type: event.type, meta: event.meta })

      toast({
        title: event.title ?? t('Notification'),
        description: event.message ?? undefined,
        duration: 6000,
        ...(target ? { action: { label: t(target.label), to: target.to } } : {}),
      })

      queryClient.invalidateQueries({ queryKey: ADMIN_NOTIFICATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: ADMIN_NOTIFICATIONS_UNREAD_KEY })
    })

    return () => {
      // Leaving the channel rather than disconnecting: the same socket is
      // shared with the support chat, so tearing it down would break both.
      echo.leave(channelName)
    }
    // The listener closure only depends on the signed-in identity; `t` and
    // `queryClient` are stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, token])
}