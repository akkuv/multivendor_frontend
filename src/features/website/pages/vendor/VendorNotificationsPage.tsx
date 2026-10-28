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
  useDeleteVendorNotification,
  useMarkAllVendorNotificationsRead,
  useMarkVendorNotificationRead,
  useVendorNotifications,
} from '@/hooks/useVendor'
import { formatDateTime } from '@/utils/format'
import { cn } from '@/utils/cn'
import { vendorNotificationTarget } from '@/lib/notifications'
import { useTranslation } from 'react-i18next'
import { tStatus } from '@/i18n/status'

export function VendorNotificationsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState<{ id: string; title: string } | null>(null)

  const { data, isLoading, isError, refetch } = useVendorNotifications(page, 15)
  const markRead = useMarkVendorNotificationRead()
  const markAllRead = useMarkAllVendorNotificationsRead()
  const deleteMutation = useDeleteVendorNotification()

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
            <Bell className="h-6 w-6" /> {t('Notifications')}
          </h1>
          <p className="text-muted-foreground">
            {t('{{count}} notifications', { count: data?.total ?? 0 })} ·{' '}
            {t('{{count}} unread', { count: unread.length })} ·{' '}
            <span className="font-medium text-foreground">{t('Click a notification to open it')}</span>
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
              {data.data.map((n) => {
                const target = vendorNotificationTarget(n)
                const unread = !n.read_at

                const content = (
                  <>
                    <div className="flex items-center gap-2">
                      {unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
                      <p className="truncate text-sm font-semibold">{n.title ?? t('Notification')}</p>
                    </div>
                    {n.message ? (
                      <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {n.type ? (
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {tStatus(t, n.type)}
                        </Badge>
                      ) : null}
                      {formatDateTime(n.created_at)}
                    </p>
                  </>
                )

                return (
                  <div
                    key={n.id}
                    className={cn('group relative px-5 py-4 transition-colors', unread && 'bg-primary/[0.03]')}
                  >
                    {target ? (
                      <Link
                        to={target.to}
                        onClick={() => {
                          if (unread) markRead.mutate(n.id)
                        }}
                        className="-mx-3 block rounded-lg px-3 py-1 outline-none transition-colors hover:bg-accent hover:ring-1 hover:ring-ring focus-visible:ring-2"
                        title={`${n.title ?? t('Notification')} · ${t(target.label)}`}
                      >
                        {content}
                        <span className="pointer-events-none absolute right-11 top-1/2 hidden -translate-y-1/2 items-center gap-1 text-xs font-medium text-primary group-hover:flex">
                          {t(target.label)}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </Link>
                    ) : (
                      <div className="-mx-3 block rounded-lg px-3 py-1">{content}</div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 shrink-0 -translate-y-1/2"
                      onClick={() => setDeleting({ id: n.id, title: n.title ?? 'Notification' })}
                      title={t('Delete')}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
        {data && data.last_page > 1 ? (
          <div className="flex items-center justify-between border-t px-5 py-3 text-sm text-muted-foreground">
            <span>
              Page {data.current_page} of {data.last_page}
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
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t('Delete Notification')}
        description={`Delete "${deleting?.title}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        error={deleteMutation.error?.message ?? null}
      />
    </div>
  )
}