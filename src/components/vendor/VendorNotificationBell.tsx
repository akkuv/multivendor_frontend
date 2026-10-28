import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  Banknote,
  CheckCheck,
  CreditCard,
  MessageCircleQuestion,
  Package,
  RotateCcw,
  ShoppingBag,
  Store,
  Truck,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useVendorNotifications, useVendorNotificationsUnreadCount, useMarkAllVendorNotificationsRead, useMarkVendorNotificationRead } from '@/hooks/useVendor'
import { formatDateTime } from '@/utils/format'
import { cn } from '@/utils/cn'
import { vendorNotificationTarget } from '@/lib/notifications'
import { useVendorNotificationsRealtime } from '@/hooks/useVendorNotificationsRealtime'
import type { Notification } from '@/types'
import { useTranslation } from 'react-i18next'
import { tStatus } from '@/i18n/status'

const POLL_INTERVAL = 15_000

const TYPE_TONE: { match: (type: string) => boolean; chip: string; icon: typeof Bell }[] = [
  {
    match: (t) => t === 'payout_approved' || t === 'admin_payout_request',
    chip: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400',
    icon: Banknote,
  },
  {
    match: (t) => t.startsWith('new_order') || t === 'admin_new_order',
    chip: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400',
    icon: ShoppingBag,
  },
  {
    match: (t) => t.startsWith('return_') || t === 'admin_return_request',
    chip: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400',
    icon: RotateCcw,
  },
  {
    match: (t) => t.startsWith('product_') || t === 'new_product_submitted',
    chip: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400',
    icon: Package,
  },
  {
    match: (t) => t === 'vendor_approved' || t === 'new_vendor_registered',
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400',
    icon: Store,
  },
  {
    match: (t) => t.startsWith('wallet_'),
    chip: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400',
    icon: Wallet,
  },
  {
    match: (t) => t.includes('payment_failure') || t.includes('payment'),
    chip: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400',
    icon: CreditCard,
  },
  {
    match: (t) => t.includes('shipping'),
    chip: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400',
    icon: Truck,
  },
  {
    match: (t) => t === 'order_query_for_vendor' || t === 'product_query_for_vendor',
    chip: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400',
    icon: MessageCircleQuestion,
  },
]

function toneFor(type: string | null) {
  if (!type) return TYPE_TONE[0]
  const tone = TYPE_TONE.find((t) => t.match(type))
  return tone ?? TYPE_TONE[0]
}

function timeAgo(value: string): string {
  try {
    const diff = Date.now() - new Date(value).getTime()
    const minutes = Math.floor(diff / 60_000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
    return formatDateTime(value)
  } catch {
    return formatDateTime(value)
  }
}

function NotificationRow({
  notification,
  onRead,
  onClose,
}: {
  notification: Notification
  onRead: (id: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tone = toneFor(notification.type)
  const unread = !notification.read_at
  const Icon = tone.icon
  const target = vendorNotificationTarget(notification)

  const handleOpen = () => {
    if (unread) onRead(notification.id)
    onClose()
    if (target) navigate(target.to)
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      title={target ? `${notification.title ?? t('Notification')} · ${t(target.label)}` : undefined}
      className={cn(
        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
        unread ? 'bg-primary/[0.03] hover:bg-primary/[0.06]' : 'hover:bg-muted/60',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
          tone.chip,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          {unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
          <span className={cn('truncate text-sm', unread ? 'font-semibold' : 'font-medium text-muted-foreground')}>
            {notification.title ?? t('Notification')}
          </span>
        </span>
        {notification.message ? (
          <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">
            {notification.message}
          </span>
        ) : null}
        <span className="mt-0.5 block text-[11px] text-muted-foreground/70">
          {timeAgo(notification.created_at)}
          {notification.type ? (
            <span className="ml-1.5 uppercase">{tStatus(t, notification.type)}</span>
          ) : null}
        </span>
      </span>
    </button>
  )
}

export function VendorNotificationBell() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  useVendorNotificationsRealtime()
  const unreadQuery = useVendorNotificationsUnreadCount(POLL_INTERVAL)
  const listQuery = useVendorNotifications(1, 7, POLL_INTERVAL)
  const markRead = useMarkVendorNotificationRead()
  const markAllRead = useMarkAllVendorNotificationsRead()

  const unread = unreadQuery.data?.count ?? 0
  const notifications = listQuery.data?.data ?? []

  const handleRead = (id: string) => {
    markRead.mutate(id)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative" title={t('Notifications')}>
          <Bell className="h-5 w-5" />
          {unread > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground ring-2 ring-background">
              {unread > 99 ? '99+' : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <DropdownMenuLabel className="flex items-center gap-2 p-0">
            <Bell className="h-4 w-4 text-primary" />
            Notifications
            {unread > 0 ? (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                {unread}
              </span>
            ) : null}
          </DropdownMenuLabel>
          {unread > 0 ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" /> {t('Mark all read')}
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator className="my-0" />

        {listQuery.isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium">{t('You\'re all caught up')}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('New activity will appear here in real time.')}
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onRead={handleRead}
                onClose={() => setOpen(false)}
              />
            ))}
          </div>
        )}

        <DropdownMenuSeparator className="my-0" />
        <Link
          to="/vendor/notifications"
          onClick={() => setOpen(false)}
          className="block px-4 py-2.5 text-center text-sm font-medium text-primary transition-colors hover:bg-accent"
        >
          {t('View all notifications')}
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}