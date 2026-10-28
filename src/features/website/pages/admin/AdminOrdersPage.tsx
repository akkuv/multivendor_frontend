import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { assetUrl } from '@/lib/assets'
import {
  CalendarDays,
  CreditCard,
  Hash,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Search,
  Store,
  Truck,
  User,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState, PaginationFooter } from '@/components/common/admin'
import {
  useAdminOrder,
  useAdminOrders,
  useUpdateAdminOrderStatus,
} from '@/hooks/useAdmin'
import { useDebouncedUrlFilter, useUrlFilters } from '@/hooks/useUrlFilters'
import { formatCurrency, formatDateTime, orderGrandTotal } from '@/utils/format'
import type { Order, OrderItem } from '@/types'
import { useTranslation } from 'react-i18next'

const ORDER_STATUS_OPTIONS = ['PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED']
const ORDER_VARIANTS: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  DELIVERED: 'success',
  SHIPPED: 'success',
  PLACED: 'secondary',
  CONFIRMED: 'secondary',
  PROCESSING: 'warning',
  PACKED: 'warning',
  CANCELLED: 'destructive',
  RETURNED: 'destructive',
  REFUNDED: 'warning',
}
const PAYMENT_VARIANTS: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  PAID: 'success',
  PENDING: 'warning',
  FAILED: 'destructive',
  REFUNDED: 'secondary',
}

function OrderStatusBadge({ status }: { status: string }) {
  return <Badge variant={ORDER_VARIANTS[status] ?? 'secondary'}>{status}</Badge>
}
function PaymentStatusBadge({ status }: { status: string }) {
  return <Badge variant={PAYMENT_VARIANTS[status] ?? 'secondary'}>{status}</Badge>
}

function ItemThumb({ item }: { item: OrderItem }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
      {item.product_image ? (
        <img src={assetUrl(item.product_image)} alt={item.product_name} className="h-full w-full object-cover" />
      ) : (
        <Package className="h-5 w-5 text-muted-foreground" />
      )}
    </div>
  )
}

function OrderRow({
  order,
  onSelect,
}: {
  order: Order
  onSelect: (id: number) => void
}) {
  const { t } = useTranslation()
  const updateStatus = useUpdateAdminOrderStatus()
  return (
    <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
      <button
        type="button"
        onClick={() => onSelect(order.id)}
        className="min-w-0 flex-1 rounded-md text-left transition-colors hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:px-2"
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{order.order_number}</p>
          <OrderStatusBadge status={order.order_status} />
          <PaymentStatusBadge status={order.payment_status} />
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t('{{count}} item(s) · {{date}}', { count: order.items.length, date: formatDateTime(order.created_at) })}
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {order.items.slice(0, 3).map((item) => (
            <span key={item.id} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {item.product_name} × {item.quantity}
            </span>
          ))}
          {order.items.length > 3 && (
            <span className="text-xs text-muted-foreground">{t('+{{count}} more', { count: order.items.length - 3 })}</span>
          )}
        </div>
      </button>
      <div className="flex items-center gap-3">
        <p className="text-lg font-bold">{formatCurrency(orderGrandTotal(order))}</p>
        <Select value={order.order_status} onValueChange={(v) => updateStatus.mutate({ id: order.id, status: v })}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{t(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function OrderDetailDialog({
  orderId,
  onClose,
}: {
  orderId: number | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { data: order, isLoading } = useAdminOrder(orderId)
  const updateStatus = useUpdateAdminOrderStatus()

  const walletAmount = Number(order?.wallet_amount ?? 0)
  const grandTotal = orderGrandTotal(order ?? { total: 0 })
  // Tax is included in the subtotal already, so it is not subtracted back out.
  const listSubtotal =
    Math.round(
      (grandTotal +
        Number(order?.discount ?? 0) -
        Number(order?.shipping_charge ?? 0) -
        Number(order?.cod_charge ?? 0) -
        Number(order?.fees_total ?? 0)) *
        100,
    ) / 100

  return (
    <Dialog open={orderId != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        {isLoading || !order ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                {order.order_number}
              </DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-3">
                {order.user && (
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {order.user.name} {order.user.email && <span className="text-muted-foreground">({order.user.email})</span>}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {t('Placed {{date}}', { date: formatDateTime(order.created_at) })}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <OrderStatusBadge status={order.order_status} />
                <PaymentStatusBadge status={order.payment_status} />
              </div>
              <Select value={order.order_status} onValueChange={(v) => updateStatus.mutate({ id: order.id, status: v })}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{t(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <section>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">{t('Items ({{count}})', { count: order.items.length })}</h3>
              <div className="divide-y rounded-lg border">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3">
                    <ItemThumb item={item} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.product_name}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatCurrency(item.unit_price)} × {item.quantity}</span>
                        {item.vendor && (
                          <span className="inline-flex items-center gap-1">
                            <Store className="h-3 w-3" /> {item.vendor.store_name}
                          </span>
                        )}
                        <Badge variant="outline">{item.status}</Badge>
                      </div>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(item.total)}</p>
                  </div>
                ))}
              </div>
            </section>

            {order.status_histories && order.status_histories.length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">{t('Status history')}</h3>
                <div className="space-y-0 rounded-lg border p-4">
                  {order.status_histories.map((h, i) => (
                    <div key={h.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${i === 0 ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                        {i < order.status_histories!.length - 1 && <span className="w-px flex-1 bg-border" />}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm">
                          <span className="font-medium">{h.from_status}</span>
                          <span className="mx-1 text-muted-foreground">→</span>
                          <span className="font-medium">{h.to_status}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {h.actor?.name ?? t('System')} · {formatDateTime(h.changed_at)}
                        </p>
                        {h.notes && <p className="mt-0.5 text-xs text-muted-foreground">{h.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="grid gap-4 md:grid-cols-2">
              {order.shipping_address && (
                <div className="rounded-lg border p-4">
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {t('Shipping address')}
                  </h3>
                  <p className="text-sm font-medium">{order.shipping_address.name}</p>
                  {order.shipping_address.phone && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {order.shipping_address.phone}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.shipping_address.address_line1}
                    {order.shipping_address.address_line2 && `, ${order.shipping_address.address_line2}`}
                    , {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                  </p>
                </div>
              )}

              {order.shipment && (
                <div className="rounded-lg border p-4">
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <Truck className="h-4 w-4" /> {t('Shipment')}
                  </h3>
                  <p className="text-sm">
                    {t('Provider')}: <span className="font-medium">{order.shipment.provider}</span>
                  </p>
                  {order.shipment.tracking_number && (
                    <p className="text-xs text-muted-foreground">{t('Tracking')}: {order.shipment.tracking_number}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{t('Status')}: {order.shipment.status}</p>
                </div>
              )}

              <div className="rounded-lg border p-4">
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <CreditCard className="h-4 w-4" /> {t('Payment')}
                </h3>
                <p className="text-sm">
                  {t('Method')}: <span className="font-medium">{order.payment_method}</span>
                </p>
                {order.razorpay_order_id && (
                  <p className="text-xs text-muted-foreground">{t('Razorpay order')}: {order.razorpay_order_id}</p>
                )}
                {order.razorpay_payment_id && (
                  <p className="text-xs text-muted-foreground">{t('Razorpay payment')}: {order.razorpay_payment_id}</p>
                )}
                {order.paid_at && <p className="text-xs text-muted-foreground">{t('Paid at {{date}}', { date: formatDateTime(order.paid_at) })}</p>}
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">{t('Summary')}</h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('Subtotal')}</span>
                    <span>{formatCurrency(listSubtotal)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('Discount')}</span>
                      <span className="text-emerald-600">−{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  {order.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('Tax (inclusive)')}</span>
                      <span>{formatCurrency(order.tax)}</span>
                    </div>
                  )}
                  {(order.shipping_charge ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('Shipping')}</span>
                      <span>{formatCurrency(order.shipping_charge ?? 0)}</span>
                    </div>
                  )}
                  {(order.cod_charge ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('COD charge')}</span>
                      <span>{formatCurrency(order.cod_charge ?? 0)}</span>
                    </div>
                  )}
                  {(order.fees_total ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('Product fees')}</span>
                      <span>{formatCurrency(order.fees_total ?? 0)}</span>
                    </div>
                  )}
                  <Separator />
                  {walletAmount > 0 ? (
                    <>
                      <div className="flex justify-between font-semibold">
                        <span>{t('Order total')}</span>
                        <span>{formatCurrency(grandTotal)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600">
                        <span>{t('Paid from wallet')}</span>
                        <span>−{formatCurrency(walletAmount)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-base font-bold">
                        <span>{t('Amount payable')}</span>
                        <span>{formatCurrency(order.total)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-base font-bold">
                      <span>{t('Total')}</span>
                      <span>{formatCurrency(grandTotal)}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

const ORDER_FILTER_KEYS = [
  'search',
  'status',
  'payment_status',
  'created_days',
  'created_from',
  'created_to',
] as const

export function AdminOrdersPage() {
  const { t } = useTranslation()
  const {
    values: filters,
    set: setFilter,
    reset: resetFilters,
    hasActive,
    page,
    setPage,
  } = useUrlFilters(ORDER_FILTER_KEYS)
  const { input: search, setInput: setSearch } = useDebouncedUrlFilter('search')
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
const location = useLocation()
const [params] = useSearchParams()

useEffect(() => {
  const stateOrderId = (location.state as { orderId?: number } | null)?.orderId
  const urlOrderId = params.get('order_id')
  if (stateOrderId) {
    setSelectedOrderId(stateOrderId)
    return
  }
  if (urlOrderId) {
    const n = Number(urlOrderId)
    if (!Number.isNaN(n)) setSelectedOrderId(n)
  }
}, [location.state, params])
  const { data, isLoading, isError, refetch } = useAdminOrders({
    page,
    per_page: 15,
    search: search || undefined,
    status: filters.status || undefined,
    payment_status: filters.payment_status || undefined,
    created_days: filters.created_days ? Number(filters.created_days) : undefined,
    created_from: filters.created_from || undefined,
    created_to: filters.created_to || undefined,
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('Orders')}</h1>
      </div>

      {(filters.created_days || filters.created_from) && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {filters.created_from
              ? t('Placed on {{date}}', { date: filters.created_from })
              : t('Placed in the last {{days}} days', { days: filters.created_days })}
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('Search order number...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filters.status || 'ALL'} onValueChange={(v) => setFilter('status', v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('All statuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('All statuses')}</SelectItem>
            {ORDER_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{t(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.payment_status || 'ALL'} onValueChange={(v) => setFilter('payment_status', v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('All payments')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('All payments')}</SelectItem>
            <SelectItem value="PAID">{t('Paid')}</SelectItem>
            <SelectItem value="PENDING">{t('Pending')}</SelectItem>
            <SelectItem value="FAILED">{t('Failed')}</SelectItem>
          </SelectContent>
        </Select>
        {hasActive && (
          <Button variant="ghost" onClick={resetFilters}>
            <X className="mr-1 h-4 w-4" /> {t('Clear filters')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center justify-between rounded-lg border p-6 text-sm text-destructive">
          {t('Could not load orders.')}
          <Button size="sm" variant="outline" onClick={() => refetch()}><RefreshCw className="mr-1 h-4 w-4" /> {t('Retry')}</Button>
        </div>
      ) : data && data.data.length === 0 ? (
        <EmptyState message={t('No orders found.')} />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {data?.data.map((order) => (
                  <OrderRow key={order.id} order={order} onSelect={setSelectedOrderId} />
                ))}
              </div>
            </CardContent>
          </Card>

          <PaginationFooter data={data as never} onPageChange={setPage} />
        </>
      )}

      <OrderDetailDialog orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
    </div>
  )
}