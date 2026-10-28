import { useState } from 'react'
import { assetUrl } from '@/lib/assets'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CalendarDays,
  Hash,
  MapPin,
  MessageCircleQuestion,
  Package,
  Phone,
  RefreshCcw,
  Search,
  Store,
  User,
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
  useAdminVendorOrder,
  useAdminVendorOrders,
  useUpdateAdminVendorOrderStatus,
} from '@/hooks/useAdmin'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { OrderItem, VendorOrder, VendorOrderStatusValue } from '@/types'
import { useTranslation } from 'react-i18next'
import { tStatus } from '@/i18n/status'

const VENDOR_ORDER_STATUS_OPTIONS: VendorOrderStatusValue[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'READY_TO_SHIP',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'RETURN_REQUESTED',
  'RETURNED',
  'REFUNDED',
  'CANCELLED',
]

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  DELIVERED: 'success',
  SHIPPED: 'success',
  OUT_FOR_DELIVERY: 'success',
  PENDING: 'warning',
  PROCESSING: 'warning',
  RETURN_REQUESTED: 'warning',
  CONFIRMED: 'secondary',
  PACKED: 'secondary',
  READY_TO_SHIP: 'secondary',
  RETURNED: 'destructive',
  REFUNDED: 'secondary',
  CANCELLED: 'destructive',
}

function VendorOrderStatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_BADGE[status] ?? 'secondary'}>{status}</Badge>
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

function VendorOrderRow({
  order,
  onSelect,
}: {
  order: VendorOrder
  onSelect: (id: number) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(order.id)}
      className="flex min-w-0 flex-1 flex-col gap-2 rounded-md text-left transition-colors hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:px-2"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold">{order.vendor_order_number}</p>
        <VendorOrderStatusBadge status={order.status} />
      </div>
      <p className="text-sm text-muted-foreground">
        {order.items?.length ?? 0} item(s) · {formatDateTime(order.created_at)}
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {order.vendor?.store_name ? (
          <span className="inline-flex items-center gap-1">
            <Store className="h-3 w-3" /> {order.vendor.store_name}
          </span>
        ) : null}
        {order.order?.customer?.name ? (
          <span className="inline-flex items-center gap-1">
            <User className="h-3 w-3" /> {order.order.customer.name}
          </span>
        ) : null}
      </div>
    </button>
  )
}

function VendorOrderDetailDialog({
  orderId,
  onClose,
}: {
  orderId: number | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { data: order, isLoading } = useAdminVendorOrder(orderId)
  const updateStatus = useUpdateAdminVendorOrderStatus()
  const navigate = useNavigate()

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
                {order.vendor_order_number}
              </DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-3">
                {order.vendor?.store_name && (
                  <span className="inline-flex items-center gap-1">
                    <Store className="h-3.5 w-3.5" />
                    {order.vendor.store_name}
                  </span>
                )}
                {order.order?.customer?.name && (
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {order.order.customer.name}
                    {order.order.customer.email && (
                      <span className="text-muted-foreground">({order.order.customer.email})</span>
                    )}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Placed {formatDateTime(order.created_at)}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <VendorOrderStatusBadge status={order.status} />
                {order.order?.payment_status && (
                  <Badge variant="outline">Payment: {order.order.payment_status}</Badge>
                )}
              </div>
              <Select
                value={order.status}
                onValueChange={(v) => updateStatus.mutate({ id: order.id, status: v as VendorOrderStatusValue })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VENDOR_ORDER_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {tStatus(t, s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose()
                  navigate(
                    order.order_id && order.vendor?.id
                      ? `/admin/order-queries?new=1&order_id=${order.order_id}&vendor_id=${order.vendor.id}`
                      : '/admin/order-queries?new=1',
                  )
                }}
              >
                <MessageCircleQuestion className="mr-1.5 h-4 w-4" /> {t('Query vendor')}
              </Button>
            </div>

            {updateStatus.error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                {updateStatus.error instanceof Error
                  ? updateStatus.error.message
                  : 'Could not update status.'}
              </p>
            ) : null}

            <section>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Items ({order.items?.length ?? 0})
              </h3>
              <div className="divide-y rounded-lg border">
                {(order.items ?? []).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3">
                    <ItemThumb item={item} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.product_name}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {formatCurrency(item.unit_price)} × {item.quantity}
                        </span>
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
                        <span
                          className={`mt-1.5 h-2.5 w-2.5 rounded-full ${
                            i === 0 ? 'bg-primary' : 'bg-muted-foreground/40'
                          }`}
                        />
                        {i < order.status_histories!.length - 1 && <span className="w-px flex-1 bg-border" />}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm">
                          <span className="font-medium">{h.from_status ?? '—'}</span>
                          <span className="mx-1 text-muted-foreground">→</span>
                          <span className="font-medium">{h.to_status ?? '—'}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {h.actor?.name ?? 'System'} · {formatDateTime(h.changed_at)}
                        </p>
                        {h.notes && <p className="mt-0.5 text-xs text-muted-foreground">{h.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="grid gap-4 md:grid-cols-2">
              {order.order?.order_address && (
                <div className="rounded-lg border p-4">
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {t('Shipping address')}
                  </h3>
                  <p className="text-sm font-medium">{order.order.order_address.name}</p>
                  {order.order.order_address.phone && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {order.order.order_address.phone}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.order.order_address.address_line1}
                    {order.order.order_address.address_line2 && `, ${order.order.order_address.address_line2}`}
                    , {order.order.order_address.city}, {order.order.order_address.state} -{' '}
                    {order.order.order_address.pincode}
                  </p>
                </div>
              )}

              <div className="rounded-lg border p-4">
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">{t('Summary')}</h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('Subtotal')}</span>
                    <span>{formatCurrency(order.subtotal)}</span>
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
                  {order.shipping_charge > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('Shipping')}</span>
                      <span>{formatCurrency(order.shipping_charge)}</span>
                    </div>
                  )}
                  {order.cod_charge > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('COD charge')}</span>
                      <span>{formatCurrency(order.cod_charge)}</span>
                    </div>
                  )}
                  {order.fees_total > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('Product fees')}</span>
                      <span>{formatCurrency(order.fees_total)}</span>
                    </div>
                  )}
                  {order.wallet_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('Wallet')}</span>
                      <span className="text-emerald-600">−{formatCurrency(order.wallet_amount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-base font-bold">
                    <span>{t('Total')}</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function AdminVendorOrdersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const routeOrderId = id ? Number(id) : null
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [status, setStatus] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)

  const { data, isLoading, isError, refetch } = useAdminVendorOrders({
    page,
    per_page: 15,
    search: debounced || undefined,
    status: status || undefined,
  })

  const detailId = routeOrderId ?? selectedOrderId

  const handleClose = () => {
    setSelectedOrderId(null)
    if (routeOrderId != null) navigate('/admin/vendor-orders')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Store className="h-6 w-6 text-primary" /> {t('Vendor Orders')}
        </h1>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCcw className="mr-1 h-4 w-4" /> {t('Refresh')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('Search vendor order number...')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              window.setTimeout(() => setDebounced(e.target.value), 300)
            }}
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v === 'ALL' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('All statuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('All statuses')}</SelectItem>
            {VENDOR_ORDER_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {tStatus(t, s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center justify-between rounded-lg border p-6 text-sm text-destructive">
          {t('Could not load vendor orders.')}
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCcw className="mr-1 h-4 w-4" /> {t('Retry')}
          </Button>
        </div>
      ) : data && data.data.length === 0 ? (
        <EmptyState message="No vendor orders found." />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {data?.data.map((order) => (
                  <div key={order.id} className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
                    <VendorOrderRow order={order} onSelect={setSelectedOrderId} />
                    <div className="flex shrink-0 items-center gap-3">
                      <p className="text-lg font-bold">{formatCurrency(order.total)}</p>
                      <Button variant="outline" size="sm" onClick={() => setSelectedOrderId(order.id)}>
                        {t('View')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title={t('Ask this vendor about the order')}
                        onClick={() =>
                          navigate(
                            order.vendor?.id != null
                              ? `/admin/order-queries?new=1&order_id=${order.order_id}&vendor_id=${order.vendor.id}`
                              : `/admin/order-queries?new=1&order_id=${order.order_id}`,
                          )
                        }
                      >
                        <MessageCircleQuestion className="mr-1 h-4 w-4" />
                        {t('Query')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <PaginationFooter data={data as never} onPageChange={setPage} />
        </>
      )}

      <VendorOrderDetailDialog orderId={detailId} onClose={handleClose} />
    </div>
  )
}