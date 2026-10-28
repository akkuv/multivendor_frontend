import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  BellOff,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError, ConfirmDialog } from '@/components/common/admin'
import {
  useAdminNotifications,
  useDeleteAdminNotification,
  useMarkAllAdminNotificationsRead,
  useMarkAdminNotificationRead,
} from '@/hooks/useAdmin'
import { formatDateTime } from '@/utils/format'
import { cn } from '@/utils/cn'
import { adminNotificationTarget } from '@/lib/notifications'
import type { Notification } from '@/types'
import { useTranslation } from 'react-i18next'
import { tStatus } from '@/i18n/status'

export function AdminNotificationsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState<{ id: string; title: string } | null>(null)

  const { data, isLoading, isError, refetch } = useAdminNotifications(page, 15)
  const markRead = useMarkAdminNotificationRead()
  const markAllRead = useMarkAllAdminNotificationsRead()
  const deleteMutation = useDeleteAdminNotification()

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await deleteMutation.mutateAsync(deleting.id)
      setDeleting(null)
    } catch {
      /* keep dialog open to show error */
    }
  }

  const unread = data?.data.filter((n) => !n.read_at) ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Bell className="h-6 w-6 text-primary" /> {t('Notifications')}
          </h1>
          <p className="text-muted-foreground">
            {t('{{count}} notifications · {{unread}} unread', {
              count: data?.total ?? 0,
              unread: unread.length,
            })}{' '}
            · <span className="font-medium text-foreground">{t('Click a notification to open it')}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unread.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="mr-1 h-4 w-4" /> {t('Mark all read')}
            </Button>
          ) : null}
          <Button variant="outline" size="icon" onClick={() => refetch()} title={t('Refresh')}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5 text-primary" /> {t('Inbox')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <ApiError error={{ message: t('Could not load notifications.') }} onRetry={refetch} />
          ) : !data || data.data.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60">
                <BellOff className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium">{t('No notifications yet')}</p>
              <p className="text-sm text-muted-foreground">
                {t('Order updates, product approvals, and more will appear here.')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {data.data.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onRead={() => !n.read_at && markRead.mutate(n.id)}
                  onDelete={() => setDeleting({ id: n.id, title: n.title ?? t('Notification') })}
                />
              ))}
            </div>
          )}
        </CardContent>
        {data && data.last_page > 1 ? (
          <div className="flex items-center justify-between border-t px-5 py-3 text-sm text-muted-foreground">
            <span>
              {t('Page {{page}} of {{total}}', { page: data.current_page, total: data.last_page })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> {t('Previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('Next')} <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t('Delete Notification')}
        description={t('Delete "{{title}}"?', { title: deleting?.title })}
        confirmLabel={t('Delete')}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        error={deleteMutation.error?.message ?? null}
      />
    </div>
  )
}

function NotificationRow({
  notification,
  onRead,
  onDelete,
}: {
  notification: Notification
  onRead: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const target = adminNotificationTarget(notification)
  const unread = !notification.read_at

  const content = (
    <>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        {unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
        <p className="truncate text-sm font-semibold">{notification.title ?? t('Notification')}</p>
      </span>
      {notification.message ? (
        <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
      ) : null}
      <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        {notification.type ? (
          <Badge variant="secondary" className="text-[10px] uppercase">
            {tStatus(t, notification.type)}
          </Badge>
        ) : null}
        {formatDateTime(notification.created_at)}
      </span>
    </>
  )

  return (
    <div className={cn('group relative px-5 py-4 transition-colors', unread && 'bg-primary/[0.03]')}>
      {target ? (
        <Link
          to={target.to}
          onClick={onRead}
          className={cn(
            '-mx-3 block rounded-lg px-3 py-1 outline-none transition-colors',
            'hover:bg-accent hover:ring-1 hover:ring-ring focus-visible:ring-2',
          )}
          title={`${notification.title ?? t('Notification')} · ${target.label}`}
        >
          {content}
          <span className="pointer-events-none absolute right-11 top-1/2 hidden -translate-y-1/2 items-center gap-1 text-xs font-medium text-primary group-hover:flex">
            {t(target.label)}
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      ) : (
        <button
          type="button"
          onClick={onRead}
          className="w-full cursor-default text-left"
          aria-label={notification.title ?? t('Notification')}
        >
          {content}
        </button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2 shrink-0 text-muted-foreground opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDelete()
        }}
        title={t('Delete')}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )
}