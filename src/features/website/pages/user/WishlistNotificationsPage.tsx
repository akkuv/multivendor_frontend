import { Link } from 'react-router-dom'
import { assetUrl } from '@/lib/assets'
import {
  AlertTriangle,
  Bell,
  Check,
  ChevronRight,
  Clock,
  PackageX,
  TrendingDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useMarkWishlistNotificationsRead,
  useWishlistNotifications,
} from '@/hooks/useWishlist'
import { useAuthStore } from '@/store/authStore'
import { AccountSubPageHeader } from '@/components/common/AccountSubPageHeader'
import { formatCurrency } from '@/utils/format'
import type { WishlistNotification } from '@/types'
import { useTranslation } from 'react-i18next'

const TYPE_META: Record<WishlistNotification['type'], { label: string; icon: typeof TrendingDown }> = {
  price_drop: { label: 'Price dropped', icon: TrendingDown },
  back_in_stock: { label: 'Back in stock', icon: PackageX },
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function NotificationCard({ item }: { item: WishlistNotification }) {
  const { t } = useTranslation()
  const meta = TYPE_META[item.type]
  const Icon = meta.icon
  const oldPrice = item.old_price !== null ? Number(item.old_price) : null
  const newPrice = item.new_price !== null ? Number(item.new_price) : null
  const savings =
    oldPrice !== null && newPrice !== null && oldPrice > 0
      ? Math.round((1 - newPrice / oldPrice) * 100)
      : 0

  return (
    <Card
      className={`overflow-hidden transition-all ${
        item.is_read ? 'opacity-70' : 'border-primary/30 shadow-md'
      }`}
    >
      <CardContent className="flex flex-wrap items-start gap-4 p-4 sm:p-5">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            item.type === 'price_drop' ? 'bg-emerald-50 text-emerald-600' : 'bg-yellow-50 text-yellow-600'
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{meta.label}</p>
              {!item.is_read && <span className="h-2 w-2 rounded-full bg-primary" />}
            </div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> {formatDate(item.created_at)}
            </span>
          </div>

          <div className="mt-1.5 text-sm">
            {item.type === 'price_drop' && oldPrice !== null && newPrice !== null ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground line-through">
                  {formatCurrency(oldPrice)}
                </span>
                <span className="text-muted-foreground">&rarr;</span>
                <span className="font-bold text-emerald-600">{formatCurrency(newPrice)}</span>
                {savings > 0 && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                    Save {savings}%
                  </span>
                )}
              </div>
            ) : item.type === 'back_in_stock' ? (
              <>
                Back in stock at{' '}
                {newPrice !== null ? (
                  <span className="font-bold text-foreground">{formatCurrency(newPrice)}</span>
                ) : (
                  'a new price'
                )}
                .
              </>
            ) : (
              item.type === 'price_drop' && <span>{t('This product just got cheaper.')}</span>
            )}
          </div>

          {item.product && (
            <Link
              to={`/product/${item.product.id}`}
              className="mt-3 flex items-center gap-3 rounded-lg bg-muted/50 p-2 transition-colors hover:bg-muted"
            >
              {item.product.images?.[0] && (
                <img
                  src={assetUrl(item.product.images[0])}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-md border object-cover"
                />
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {item.product.name}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function WishlistNotificationsPage() {
  const { t } = useTranslation()
  const token = useAuthStore((s) => s.token)
  const { data: notifications, isLoading, isError, refetch } = useWishlistNotifications(!!token)
  const markRead = useMarkWishlistNotificationsRead()
  const list = notifications ?? []
  const unreadCount = list.filter((n) => !n.is_read).length
  const hasUnread = unreadCount > 0
  const priceDropCount = list.filter((n) => n.type === 'price_drop').length
  const backInStockCount = list.filter((n) => n.type === 'back_in_stock').length

  if (!token) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{t('No notifications')}</h1>
        <p className="mt-2 text-muted-foreground">{t('Sign in to view your wishlist notifications.')}</p>
        <Button asChild className="mt-6">
          <Link to="/login">{t('Sign In')}</Link>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Skeleton className="mb-4 h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-bold">{t('Could not load notifications')}</h1>
        <p className="mt-2 text-muted-foreground">{t('Something went wrong while fetching your notifications.')}</p>
        <Button className="mt-6" onClick={() => refetch()}>
          {t('Try Again')}
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <AccountSubPageHeader
        icon={Bell}
        title={t('Wishlist Alerts')}
        subtitle={t('Price drops and restock updates for items in your wishlist.')}
        actions={
          <>
            {hasUnread && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                {unreadCount} unread
              </span>
            )}
            {hasUnread && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markRead.mutate()}
                disabled={markRead.isPending}
              >
                <Check className="mr-1 h-4 w-4" /> {t('Mark all read')}
              </Button>
            )}
          </>
        }
      />

      {list.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label={t('Total alerts')} value={list.length} />
          <StatCard label={t('Unread')} value={unreadCount} />
          <StatCard label={t('Price drops')} value={priceDropCount} />
          <StatCard label={t('Back in stock')} value={backInStockCount} />
        </div>
      )}

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bell className="h-8 w-8" />
            </div>
            <p className="font-display text-xl font-bold">{t('No alerts yet')}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Enable price-drop or back-in-stock alerts on your wishlist and they will show up
              here.
            </p>
            <Button asChild className="mt-5">
              <Link to="/wishlist">{t('Go to Wishlist')}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {list.map((item) => (
            <NotificationCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}