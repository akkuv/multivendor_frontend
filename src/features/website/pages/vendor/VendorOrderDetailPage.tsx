import { useState } from 'react'
import { assetUrl } from '@/lib/assets'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock,
  MapPin,
  Package,
  RefreshCcw,
  RefreshCw,
  RotateCcw,
  Ship,
  Truck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from '@/components/ui/input'
import { FormField, ApiError } from '@/components/common/admin'
import {
  useShipVendorOrder,
  useUpdateVendorOrderItemStatus,
  useUpdateVendorOrderStatus,
  useVendorCourierRates,
  useVendorOrder,
} from '@/hooks/useVendor'
import { formatCurrency, formatDateTime, orderGrandTotal } from '@/utils/format'
import type { VendorOrderStatusValue } from '@/types'
import { useTranslation } from 'react-i18next'
import { tStatus } from '@/i18n/status'

const ALL_STATUSES: { value: VendorOrderStatusValue; label: string }[] = [
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

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  DELIVERED: 'success',
  SHIPPED: 'success',
  OUT_FOR_DELIVERY: 'success',
  PENDING: 'warning',
  CONFIRMED: 'secondary',
  PROCESSING: 'secondary',
  PACKED: 'secondary',
  READY_TO_SHIP: 'secondary',
  CANCELLED: 'destructive',
  RETURN_REQUESTED: 'warning',
  RETURNED: 'destructive',
  REFUNDED: 'destructive',
}

export function VendorOrderDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const orderId = id ? Number(id) : null

  const { data: order, isLoading, isError, refetch } = useVendorOrder(orderId)

  const updateStatus = useUpdateVendorOrderStatus()
  const updateItemStatus = useUpdateVendorOrderItemStatus()
  const shipOrder = useShipVendorOrder()

  const [newStatus, setNewStatus] = useState<VendorOrderStatusValue | ''>('')
  const [itemPicked, setItemPicked] = useState('')
  const [itemStatus, setItemStatus] = useState<VendorOrderStatusValue | ''>('')
  const [shipOpen, setShipOpen] = useState(false)
  const [shipWeight, setShipWeight] = useState('1')
  const [selectedCourierId, setSelectedCourierId] = useState<number | null>(null)

  if (isLoading || !order) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError) {
    return <ApiError error={{ message: t('Could not load order.') }} onRetry={refetch} />
  }

  const handleStatusChange = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStatus) return
    updateStatus.mutate({ id: order.id, status: newStatus })
  }

  const handleItemStatusChange = (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemPicked || !itemStatus) return
    updateItemStatus.mutate({ orderItemId: Number(itemPicked), status: itemStatus })
  }

  const handleShip = (e: React.FormEvent) => {
    e.preventDefault()
    const weight = Number(shipWeight)
    shipOrder.mutate(
      {
        id: order.id,
        payload: {
          weight: Number.isFinite(weight) && weight > 0 ? weight : 1,
          courier_id: selectedCourierId,
        },
      },
      { onSuccess: () => setShipOpen(false) },
    )
  }

  const statusError = updateStatus.error
  const itemStatusError = updateItemStatus.error
  const shipError = shipOrder.error
  const errorMessage = (err: unknown) =>
    typeof err === 'object' && err !== null && 'message' in err
      ? String((err as { message: unknown }).message)
      : null

  const walletAmount = Number(order.wallet_amount ?? 0)
  const grandTotal = orderGrandTotal(order)
  // Tax is included in the subtotal already, so it is not subtracted back out.
  const listSubtotal =
    Math.round(
      (grandTotal +
        Number(order.discount ?? 0) -
        Number(order.shipping_charge ?? 0) -
        Number(order.cod_charge ?? 0) -
        Number(order.fees_total ?? 0)) *
        100,
    ) / 100

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/vendor/orders">
              <ArrowLeft className="h-4 w-4" /> {t('Orders')}
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{order.vendor_order_number}</h1>
            <p className="text-sm text-muted-foreground">
              {t('Order #{{number}} · Placed {{date}}', {
                number: order.order?.order_number ?? '',
                date: formatDateTime(order.created_at),
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_BADGE[order.status] ?? 'secondary'}>
            {order.status_label ?? tStatus(t, order.status)}
          </Badge>
          {order.order?.payment_status ? (
            <Badge variant={order.order.payment_status === 'PAID' ? 'success' : 'warning'}>
              {tStatus(t, order.order.payment_status)}
            </Badge>
          ) : null}
          <Button variant="outline" size="icon" onClick={() => refetch()} title={t('Refresh')}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!order.shipment && ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) ? null : (
        <>
          {!order.shipment && order.status === 'PENDING' ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
              {t('This order is awaiting confirmation. Use the status update to confirm, pack, and ship the order.')}
            </div>
          ) : null}
        </>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5 text-primary" /> {t('Items')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {item.product_image ? (
                      <img
                        src={assetUrl(item.product_image)}
                        alt={item.product_name}
                        className="h-12 w-12 shrink-0 rounded-md border object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-muted">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.unit_price)} × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="font-semibold">{formatCurrency(item.total)}</p>
                    <Badge variant={STATUS_BADGE[item.status] ?? 'secondary'}>
                      {tStatus(t, item.status)}
                    </Badge>
                    {item.commission_amount > 0 ? (
                      <p className="text-[11px] text-muted-foreground">
                        {t('Commission: {{amount}}', { amount: formatCurrency(item.commission_amount) })}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}

              {order.items && order.items.length > 0 ? (
                <form onSubmit={handleItemStatusChange} className="border-t pt-3">
                  <FormField label={t("Update one item's status")}>
                    <div className="flex flex-wrap items-end gap-2">
                      <Select value={itemPicked} onValueChange={setItemPicked}>
                        <SelectTrigger className="w-52">
                          <SelectValue placeholder={t('Select item')} />
                        </SelectTrigger>
                        <SelectContent>
                          {order.items.map((item) => (
                            <SelectItem key={item.id} value={String(item.id)}>
                              {item.product_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={itemStatus} onValueChange={(v) => setItemStatus(v as VendorOrderStatusValue)}>
                        <SelectTrigger className="w-52">
                          <SelectValue placeholder={t('Select new status')} />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="submit"
                        disabled={!itemPicked || !itemStatus || updateItemStatus.isPending}
                      >
                        {t('Apply')}
                      </Button>
                    </div>
                  </FormField>
                  {itemStatusError ? (
                    <p className="mt-2 text-sm text-destructive">{errorMessage(itemStatusError)}</p>
                  ) : null}
                </form>
              ) : null}
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('Payment Summary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('Subtotal')}</span>
                <span>{formatCurrency(listSubtotal)}</span>
              </div>
              {Number(order.discount ?? 0) > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Discount')}</span>
                  <span className="text-destructive">-{formatCurrency(order.discount)}</span>
                </div>
              ) : null}
              {Number(order.tax ?? 0) > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Tax (inclusive)')}</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('Shipping')}</span>
                <span>{formatCurrency(order.shipping_charge)}</span>
              </div>
              {Number(order.cod_charge ?? 0) > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('COD charge')}</span>
                  <span>{formatCurrency(order.cod_charge)}</span>
                </div>
              ) : null}
              {Number(order.fees_total ?? 0) > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Product fees')}</span>
                  <span>{formatCurrency(order.fees_total)}</span>
                </div>
              ) : null}
              <Separator />
              {walletAmount > 0 ? (
                <>
                  <div className="flex justify-between font-semibold">
                    <span>{t('Order total')}</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>{t('Paid from wallet')}</span>
                    <span>-{formatCurrency(walletAmount)}</span>
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
              <p className="text-xs text-muted-foreground">
                Payment method: {order.order?.payment_method ?? '—'} ·{' '}
                {order.order?.payment_status ?? '—'}
              </p>
            </CardContent>
          </Card>

          {/* Status history */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-primary" /> {t('Status History')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!order.status_histories || order.status_histories.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('No status changes recorded yet.')}</p>
              ) : (
                <ol className="space-y-3">
                  {order.status_histories.map((h) => (
                    <li key={h.id} className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <div>
                        <p className="text-sm font-medium">
                          {h.from_status && h.to_status
                            ? t('{{from}} → {{to}}', {
                                from: tStatus(t, h.from_status),
                                to: tStatus(t, h.to_status),
                              })
                            : h.to_status
                              ? tStatus(t, h.to_status)
                              : t('Status set')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(h.changed_at)}
                          {h.actor?.name ? ` · ${t('by {{name}}', { name: h.actor.name })}` : ''}
                        </p>
                        {h.notes ? <p className="text-xs text-muted-foreground">{h.notes}</p> : null}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('Actions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <form onSubmit={handleStatusChange} className="space-y-2">
                <FormField label={t('Update order status')}>
                  <Select value={newStatus} onValueChange={(v) => setNewStatus(v as VendorOrderStatusValue)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('Select status')} />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <Button type="submit" className="w-full" disabled={!newStatus || updateStatus.isPending}>
                  <RotateCcw className="mr-1 h-4 w-4" /> {t('Update status')}
                </Button>
                {statusError ? (
                  <p className="text-sm text-destructive">{errorMessage(statusError)}</p>
                ) : null}
              </form>

              {!order.shipment ? (
                <Button className="w-full" variant="outline" onClick={() => setShipOpen(true)}>
                  <Truck className="mr-1 h-4 w-4" /> {t('Create shipment')}
                </Button>
              ) : (
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/vendor/shipments/${order.shipment.id}`}>
                    <Ship className="mr-1 h-4 w-4" /> {t('View shipment')}
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('Customer')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{order.order?.customer?.name ?? '—'}</p>
              <p className="text-muted-foreground">{order.order?.customer?.email ?? ''}</p>
            </CardContent>
          </Card>

          {/* Shipping address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-5 w-5 text-primary" /> {t('Shipping Address')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {order.order?.order_address ? (
                <>
                  <p className="font-medium">{order.order.order_address.name}</p>
                  <p>{order.order.order_address.address_line1}</p>
                  {order.order.order_address.address_line2 ? (
                    <p>{order.order.order_address.address_line2}</p>
                  ) : null}
                  <p>
                    {[
                      order.order.order_address.city,
                      order.order.order_address.state,
                      order.order.order_address.pincode,
                    ]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </p>
                  <p>{order.order.order_address.phone}</p>
                </>
              ) : (
                <p className="text-muted-foreground">{t('No address on record.')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={shipOpen} onOpenChange={(open) => !open && setShipOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Create Shipment')}</DialogTitle>
            <DialogDescription>
              Create a shipment for order {order.vendor_order_number}. This will request a courier pickup.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleShip} className="space-y-4">
            <FormField label={t('Package weight (kg)')}>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={shipWeight}
                onChange={(e) => {
                  setShipWeight(e.target.value)
                  setSelectedCourierId(null)
                }}
                placeholder={t('e.g. 1.0')}
                required
              />
            </FormField>
            <CourierPicker
              vendorOrderId={order.id}
              weight={Number(shipWeight) > 0 ? Number(shipWeight) : 1}
              enabled={shipOpen}
              selectedId={selectedCourierId}
              onSelect={setSelectedCourierId}
            />
            {shipError ? <p className="text-sm text-destructive">{errorMessage(shipError)}</p> : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShipOpen(false)}
                disabled={shipOrder.isPending}
              >
                {t('Cancel')}
              </Button>
              <Button type="submit" disabled={shipOrder.isPending}>
                {shipOrder.isPending ? 'Creating...' : 'Create shipment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * Live Shiprocket rate shop. Falls back gracefully: when no rates can be
 * quoted the vendor can still ship and Shiprocket picks the recommended courier.
 */
function CourierPicker({
  vendorOrderId,
  weight,
  enabled,
  selectedId,
  onSelect,
}: {
  vendorOrderId: number
  weight: number
  enabled: boolean
  selectedId: number | null
  onSelect: (id: number | null) => void
}) {
  const { t } = useTranslation()
  const { data, isFetching, error } = useVendorCourierRates(vendorOrderId, weight, enabled)
  const [expanded, setExpanded] = useState(true)

  if (!enabled) {
    return null
  }

  if (isFetching && !data) {
    return (
      <div className="rounded-lg border bg-muted/40 p-3">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" /> {t('Fetching courier rates...')}
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-3">
        <p className="text-sm text-muted-foreground">
          {t('Courier rates unavailable. We will let Shiprocket assign the recommended courier.')}
        </p>
      </div>
    )
  }

  if (!data?.available || data.couriers.length === 0) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
        <p className="text-sm text-amber-800">
          {data?.message ?? 'No courier can service this pincode combination.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <button
        type="button"
        className="flex w-full items-center justify-between text-sm font-medium"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          Choose a courier ({data.couriers.length})
        </span>
        <ChevronDown className={expanded ? 'h-4 w-4 rotate-180 transition' : 'h-4 w-4 transition'} />
      </button>

      {expanded && (
        <ul className="space-y-1.5" role="radiogroup" aria-label={t('Courier')}>
          <li>
            <button
              type="button"
              role="radio"
              aria-checked={selectedId == null}
              onClick={() => onSelect(null)}
              className={rowClass(selectedId == null)}
            >
              <span className="font-medium">{t('Let Shiprocket decide')}</span>
              <span className="text-xs text-muted-foreground">{t('Recommended courier')}</span>
            </button>
          </li>
          {data.couriers.map((courier) => {
            // A null id means the courier cannot be requested explicitly, so it
            // must never look selected — that state belongs to "let Shiprocket decide".
            const selectable = courier.courier_id != null
            const active = selectable && selectedId === courier.courier_id

            return (
              <li key={courier.courier_id ?? courier.courier_name}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={!selectable}
                  title={selectable ? undefined : 'Not selectable yet'}
                  onClick={() => selectable && onSelect(courier.courier_id)}
                  className={rowClass(active)}
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    {courier.courier_name}
                    {courier.is_recommended && (
                      <Badge variant="success" className="text-[10px]">
                        {t('Recommended')}
                      </Badge>
                    )}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {courier.days != null && <span>{courier.days} day(s)</span>}
                    {courier.cod_available && <span>{t('COD')}</span>}
                    <span className="font-display text-sm font-bold text-foreground">
                      ₹{courier.rate}
                    </span>
                  </span>
                </button>
                {!selectable && (
                  <p className="px-3 pt-1 text-[11px] text-muted-foreground">
                    {t('Shipping runs in local mode, so no live courier rate is available.')}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function rowClass(active: boolean): string {
  return active
    ? 'flex w-full items-center justify-between gap-3 rounded-md border-2 border-primary bg-primary/5 px-3 py-2 text-left'
    : 'flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition hover:bg-muted/50 disabled:opacity-50'
}