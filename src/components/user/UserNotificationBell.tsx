import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  CreditCard,
  RotateCcw,
  ShoppingBag,
  UserCheck,
  Wallet,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  useMarkAllMyNotificationsRead,
  useMarkMyNotificationRead,
  useMyNotifications,
  useMyNotificationsUnreadCount,
} from '@/hooks/useNotifications'
import { customerNotificationTarget } from '@/lib/notifications'
import { useUserNotificationsRealtime } from '@/hooks/useUserNotificationsRealtime'
import { formatDateTime } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { Notification } from '@/types'
import { useTranslation } from 'react-i18next'
import { tStatus } from '@/i18n/status'

const POLL_INTERVAL = 15_000

const TYPE_TONE: { match: (type: string) => boolean; chip: string; icon: typeof Bell }[] = [
  {
    match: (t) => t.startsWith('payment') || t.startsWith('refund'),
    chip: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400',
    icon: CreditCard,
  },
  {
    match: (t) => t.startsWith('wallet'),
    chip: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400',
    icon: Wallet,
  },
  {
    match: (t) => t.startsWith('return'),
    chip: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400',
    icon: RotateCcw,
  },
  {
    match: (t) => t.startsWith('order'),
    chip: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400',
    icon: ShoppingBag,
  },
  {
    match: (t) => t.startsWith('customer'),
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400',
    icon: UserCheck,
  },
]

function toneFor(type: string | null) {
  if (!type) return TYPE_TONE[0]
  const tone = TYPE_TONE.find((t) => t.match(type))
  return tone ?? { chip: 'bg-muted text-muted-foreground ring-border', icon: Bell }
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
  const target = customerNotificationTarget(notification)

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
          {unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-gold-deep" /> : null}
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

export function UserNotificationBell() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  useUserNotificationsRealtime()
  const unreadQuery = useMyNotificationsUnreadCount(POLL_INTERVAL)
  const listQuery = useMyNotifications(1, 7, POLL_INTERVAL)
  const markRead = useMarkMyNotificationRead()
  const markAllRead = useMarkAllMyNotificationsRead()

  const unread = unreadQuery.data?.count ?? 0
  const notifications = listQuery.data?.data ?? []

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-ink transition-colors hover:text-gold-deep"
          aria-label={t('Notifications')}
          title={t('Notifications')}
        >
          <Bell className="h-5 w-5" />
          <span className="hidden text-[9px] font-bold sm:block">{t('Notifications')}</span>
          {unread > 0 ? (
            <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[9px] font-extrabold text-[#e9c891] shadow-sm ring-1 ring-line-warm">
              {unread > 99 ? '99+' : unread}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 border-line-warm bg-ivory p-0">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <DropdownMenuLabel className="flex items-center gap-2 p-0">
            <Bell className="h-4 w-4 text-gold-deep" />
            {t('Notifications')}
            {unread > 0 ? (
              <span className="rounded-full bg-ink px-1.5 py-0.5 text-[10px] font-semibold text-[#e9c891]">
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
            <p className="mt-3 text-sm font-medium">{t("You're all caught up")}</p>
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
                onRead={(id) => markRead.mutate(id)}
                onClose={() => setOpen(false)}
              />
            ))}
          </div>
        )}

        <DropdownMenuSeparator className="my-0" />
        <Link
          to="/account/notifications"
          onClick={() => setOpen(false)}
          className="block px-4 py-2.5 text-center text-sm font-medium text-gold-deep transition-colors hover:bg-cream"
        >
          {t('View all notifications')}
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
