import { useEffect, useState } from 'react'
import { assetUrl } from '@/lib/assets'
import { Link } from 'react-router-dom'
import {
  Banknote,
  ChevronRight,
  Package,
  RefreshCcw,
  Search,
  ShoppingBag,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ApiError, PaginationFooter } from '@/components/common/admin'
import { useVendorOrders } from '@/hooks/useVendor'
import { formatCurrency, formatDateTime, orderGrandTotal } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { VendorOrder } from '@/types'
import { useTranslation } from 'react-i18next'
import { tStatus } from '@/i18n/status'

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'PACKED', label: 'Packed' },
  { value: 'READY_TO_SHIP', label: 'Ready to ship' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'RETURN_REQUESTED', label: 'Return requested' },
  { value: 'RETURNED', label: 'Returned' },
  { value: 'REFUNDED', label: 'Refunded' },
]

const STATUS_CHIPS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Shipped', value: 'SHIPPED' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

const STATUS_META: Record<string, { badge: 'success' | 'warning' | 'destructive' | 'secondary'; bar: string }> = {
  DELIVERED: { badge: 'success', bar: 'from-emerald-400 to-green-600' },
  SHIPPED: { badge: 'success', bar: 'from-amber-400 to-orange-500' },
  OUT_FOR_DELIVERY: { badge: 'success', bar: 'from-amber-400 to-orange-500' },
  PENDING: { badge: 'warning', bar: 'from-amber-400 to-orange-500' },
  CONFIRMED: { badge: 'secondary', bar: 'from-yellow-400 to-amber-500' },
  PROCESSING: { badge: 'secondary', bar: 'from-yellow-400 to-amber-500' },
  PACKED: { badge: 'secondary', bar: 'from-orange-400 to-teal-500' },
  READY_TO_SHIP: { badge: 'secondary', bar: 'from-orange-400 to-teal-500' },
  RETURN_REQUESTED: { badge: 'warning', bar: 'from-amber-400 to-orange-500' },
  CANCELLED: { badge: 'destructive', bar: 'from-rose-400 to-red-600' },
  RETURNED: { badge: 'destructive', bar: 'from-rose-400 to-red-600' },
  REFUNDED: { badge: 'destructive', bar: 'from-rose-400 to-red-600' },
}

function metaFor(status: string) {
  return STATUS_META[status] ?? { badge: 'secondary' as const, bar: 'from-slate-400 to-slate-600' }
}

function ItemThumbnails({ order }: { order: VendorOrder }) {
  const items = order.items ?? []
  const shown = items.slice(0, 3)
  const extra = items.length - shown.length

  if (items.length === 0) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/70">
        <Package className="h-5 w-5 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex -space-x-2">
      {shown.map((item) =>
        item.product_image ? (
          <img
            key={item.id}
            src={assetUrl(item.product_image)}
            alt={item.product_name}
            className="h-10 w-10 rounded-lg border-2 border-background object-cover shadow-sm"
          />
        ) : (
          <div
            key={item.id}
            className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-background bg-muted/70 shadow-sm"
          >
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
        ),
      )}
      {extra > 0 ? (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-background bg-primary/10 text-xs font-bold text-primary shadow-sm">
          +{extra}
        </div>
      ) : null}
    </div>
  )
}

function OrderCard({ order }: { order: VendorOrder }) {
  const { t } = useTranslation()
  const meta = metaFor(order.status)
  const firstItem = order.items?.[0]
  const extraItems = Math.max((order.items?.length ?? 0) - 1, 0)

  return (
    <Link
      to={`/vendor/orders/${order.id}`}
      className="group flex h-full flex-col outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="relative flex h-full flex-col overflow-hidden border-transparent bg-white/70 shadow-sm backdrop-blur transition duration-300 group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-lg dark:bg-card/70">
        <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', meta.bar)} />
        <CardContent className="flex flex-1 flex-col gap-4 p-5 pt-6">
          <div className="flex items-center justify-between gap-2">
            <Badge variant={meta.badge}>{order.status_label ?? tStatus(t, order.status)}</Badge>
            <span className="truncate text-xs font-medium text-muted-foreground">
              #{order.vendor_order_number}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ItemThumbnails order={order} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {firstItem?.product_name ?? t('{{count}} items', { count: order.items?.length ?? 0 })}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('{{count}} items', { count: order.items?.length ?? 0 })}
                {extraItems > 0 ? ` · ${t('{{count}} more', { count: extraItems })}` : ''}
              </p>
            </div>
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 border-t pt-3.5">
            <div className="min-w-0">
              <p className="text-lg font-extrabold tracking-tight">
                {formatCurrency(orderGrandTotal(order))}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {order.order?.customer?.name ?? t('Customer')} · {formatDateTime(order.created_at)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md bg-muted/70 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                <Banknote className="h-3 w-3" />
                {order.order?.payment_method ?? '—'}
                <Badge variant={order.order?.payment_status === 'PAID' ? 'success' : 'warning'} className="ml-0.5 px-1.5 py-0 text-[10px]">
                  {order.order?.payment_status ?? '—'}
                </Badge>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1 text-sm font-medium text-primary">
            {t('View details')}
            <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function VendorOrdersPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')

  const { data, isLoading, error, refetch } = useVendorOrders({
    page,
    per_page: 12,
    status: status || undefined,
    search: debounced || undefined,
  })

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  const hasFilters = Boolean(status || debounced)

  const clearFilters = () => {
    setStatus('')
    setSearch('')
    setDebounced('')
    setPage(1)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <ShoppingBag className="h-6 w-6 text-primary" /> {t('Orders')}
          </h1>
          <p className="text-muted-foreground">{t('Track and fulfil orders placed on your products.')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCcw className="mr-1 h-4 w-4" /> {t('Refresh')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Search order number...')}
            className="w-64 pl-8"
          />
        </div>
        <Select value={status} onValueChange={(v) => {
          setStatus(v === 'ALL' ? '' : v)
          setPage(1)
        }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t('All statuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('All statuses')}</SelectItem>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters ? (
          <Button size="sm" variant="ghost" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" /> {t('Clear')}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_CHIPS.map((chip) => {
          const active = status === chip.value
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => {
                setStatus(chip.value)
                setPage(1)
              }}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {chip.label}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <ApiError error={error} onRetry={refetch} />
      ) : !data || data.data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border bg-background/60 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-medium">{hasFilters ? 'No orders match your filters' : 'No orders yet'}</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {hasFilters
              ? 'Try a different status or search term, or clear your filters to see everything.'
              : 'When customers order your products, they will show up here.'}
          </p>
          {hasFilters ? (
            <Button size="sm" variant="outline" className="mt-1" onClick={clearFilters}>
              <X className="mr-1 h-4 w-4" /> {t('Clear filters')}
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline" className="mt-1">
              <Link to="/vendor/products">{t('Browse your products')}</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{data.data.length}</span> of{' '}
            <span className="font-semibold text-foreground">{data.total}</span> orders
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.data.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
          <PaginationFooter data={data} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}