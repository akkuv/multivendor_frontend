import { Link } from 'react-router-dom'
import { assetUrl } from '@/lib/assets'
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Clock,
  LayoutDashboard,
  MapPin,
  Package,
  Plus,
  RefreshCcw,
  ShoppingBag,
  Star,
  Store,
  TrendingUp,
  Wallet as WalletIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { tStatus } from '@/i18n/status'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/components/common/admin'
import { useVendorDashboard, useVendorProfile } from '@/hooks/useVendor'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { cn } from '@/utils/cn'

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  gradient,
  iconClass,
  to,
}: {
  label: string
  value: string
  sub?: string
  icon: typeof Clock
  gradient: string
  iconClass: string
  to?: string
}) {
  return (
    <Link
      to={to ?? '#'}
      className={
        to
          ? 'block cursor-pointer'
          : 'pointer-events-none block'
      }
    >
      <Card className="group relative overflow-hidden border-transparent bg-white/70 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg dark:bg-card/70">
        <div className={`absolute inset-x-0 top-0 h-1 ${gradient}`} />
        <div className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClass} transition duration-300 group-hover:scale-110`}
            >
              <Icon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2.5 text-2xl font-extrabold tracking-tight">{value}</p>
          {sub && <p className="mt-0.5 text-xs font-medium text-muted-foreground">{sub}</p>}
        </div>
      </Card>
    </Link>
  )
}

function orderStatusBadge(status: string, t: TFunction) {
  switch (status) {
    case 'DELIVERED':
      return <Badge variant="success">{t('Delivered')}</Badge>
    case 'PENDING':
      return <Badge variant="warning">{t('Pending')}</Badge>
    case 'CANCELLED':
      return <Badge variant="destructive">{t('Cancelled')}</Badge>
    case 'REFUNDED':
      return <Badge variant="destructive">{t('Refunded')}</Badge>
    case 'RETURNED':
      return <Badge variant="destructive">{t('Returned')}</Badge>
    case 'SHIPPED':
      return <Badge variant="success">{t('Shipped')}</Badge>
    case 'OUT_FOR_DELIVERY':
      return <Badge variant="success">{t('Out for delivery')}</Badge>
    default:
      return <Badge variant="secondary">{tStatus(t, status)}</Badge>
  }
}

export function VendorDashboardPage() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useVendorDashboard()
  const profileQuery = useVendorProfile()
  const profile = profileQuery.data

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return <ApiError error={{ message: t('Could not load dashboard.') }} onRetry={refetch} />
  }

  const recentOrders = Array.isArray(data.recent_orders) ? data.recent_orders : []
  const dash = {
    product_count: data.product_count ?? 0,
    order_count: data.order_count ?? 0,
    pending_orders: data.pending_orders ?? 0,
    revenue: data.revenue ?? 0,
    wallet_balance: data.wallet_balance ?? 0,
    recent_orders: recentOrders as {
      id: number
      vendor_order_number: string
      total: number
      status: string
      created_at: string
      order?: { order_number?: string; user?: { name?: string } | null } | null
    }[],
  }

  const storeName = profile?.store_name ?? 'Your Store'
  const location = [profile?.city, profile?.state, profile?.country]
    .filter(Boolean)
    .join(', ')
  const rating = profile?.rating_avg != null ? Number(profile.rating_avg) : null
  const showStarterHint = dash.product_count === 0 && dash.order_count === 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <LayoutDashboard className="h-6 w-6 text-primary" /> {t('Dashboard')}
          </h1>
          <p className="text-muted-foreground">Hello, welcome back to {storeName}.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} title={t('Refresh')}>
          <RefreshCcw className="mr-1 h-4 w-4" /> {t('Refresh')}
        </Button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border shadow-sm">
        {profile?.banner ? (
          <img
            src={assetUrl(profile.banner)}
            alt={t('Store banner')}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-amber-700" />
        )}
        <div className="absolute inset-0 bg-black/35" />

        {profileQuery.isLoading ? (
          <div className="relative flex items-center gap-4 p-6 sm:p-8">
            <Skeleton className="h-20 w-20 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex min-w-0 items-center gap-4">
              {profile?.logo ? (
                <img
                  src={assetUrl(profile.logo)}
                  alt={t('Store logo')}
                  className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-2 ring-white/40 sm:h-20 sm:w-20"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/40 backdrop-blur sm:h-20 sm:w-20">
                  <Store className="h-9 w-9 text-white" />
                </div>
              )}
              <div className="min-w-0 text-white">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
                    {storeName}
                  </h2>
                  <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-300" aria-label={t('Verified store')} />
                </div>
                {profile?.description ? (
                  <p className="mt-1 line-clamp-2 max-w-xl text-sm text-white/85">
                    {profile.description}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-white/75">
                  {location ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {location}
                    </span>
                  ) : null}
                  {rating != null ? (
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {rating.toFixed(1)}
                      <span className="text-white/60">({profile?.rating_count ?? 0})</span>
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" /> {dash.product_count} products
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {profile ? (
                <Button asChild size="sm" className="bg-white text-slate-900 hover:bg-white/90">
                  <Link to={`/vendors/${profile.id}`}>
                    View store <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
              <Button
                asChild
                size="sm"
                variant="outline"
                className="bg-white/10 text-white ring-1 ring-white/30 hover:bg-white/20"
              >
                <Link to="/vendor/profile">
                  Edit profile <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {showStarterHint ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-primary/40 bg-primary/[0.04] px-5 py-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Plus className="h-4 w-4 text-primary" /> {t('Let\'s get your store selling')}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t('Add your first product to start receiving orders, or complete your store profile.')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link to="/vendor/products">{t('Add product')}</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/vendor/profile">{t('Setup store')}</Link>
            </Button>
          </div>
        </div>
      ) : null}
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('Total Revenue')}
          value={formatCurrency(dash.revenue)}
          sub="Paid orders"
          icon={TrendingUp}
          gradient="from-emerald-400 to-teal-600"
          iconClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
          to="/vendor/reports"
        />
        <StatCard
          label={t('Orders')}
          value={String(dash.order_count)}
          sub={`${dash.pending_orders} pending`}
          icon={ShoppingBag}
          gradient="from-amber-400 to-orange-600"
          iconClass="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
          to="/vendor/orders"
        />
        <StatCard
          label={t('Products')}
          value={String(dash.product_count)}
          sub="In your catalog"
          icon={Package}
          gradient="from-yellow-400 to-amber-600"
          iconClass="bg-yellow-100 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-400"
          to="/vendor/products"
        />
        <StatCard
          label={t('Wallet Balance')}
          value={formatCurrency(dash.wallet_balance)}
          sub="Available for payout"
          icon={WalletIcon}
          gradient="from-amber-400 to-orange-600"
          iconClass="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
          to="/vendor/wallet"
        />
      </div>

      <Card className="overflow-hidden border-transparent bg-white/70 shadow-sm backdrop-blur dark:bg-card/70">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5 text-primary" /> {t('Recent Orders')}
          </CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link to="/vendor/orders">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {dash.recent_orders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60">
                <ShoppingBag className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium">{t('No orders yet')}</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {t('When customers order your products, they\'ll show up here.')}
              </p>
              <Button asChild size="sm" variant="outline" className="mt-1">
                <Link to="/vendor/products">{t('Browse your products')}</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {dash.recent_orders.map((order) => (
                <Link
                  key={order.id}
                  to={`/vendor/orders/${order.id}`}
                  className={cn(
                    'flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-muted/40',
                    order.status === 'PENDING' && 'bg-primary/[0.03]',
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">
                        {order.vendor_order_number ?? `#${order.id}`}
                      </p>
                      {order.status === 'PENDING' ? (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.order?.user?.name ?? 'Customer'} ·{' '}
                      {formatDateTime(order.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <p className="text-sm font-bold">{formatCurrency(Number(order.total))}</p>
                    {orderStatusBadge(order.status, t)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link to="/vendor/payouts" className="group block">
          <Card className="flex h-full items-center justify-between gap-4 border-transparent bg-white/70 p-5 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg dark:bg-card/70">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                <Banknote className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{t('Request a payout')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('Withdraw your available earnings.')}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
          </Card>
        </Link>
        <Link to="/vendor/products" className="group block">
          <Card className="flex h-full items-center justify-between gap-4 border-transparent bg-white/70 p-5 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg dark:bg-card/70">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-400">
                <Package className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{t('Manage store')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('Add products and update your profile.')}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
          </Card>
        </Link>
      </div>
    </div>
  )
}