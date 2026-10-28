import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, RotateCcw, Truck, Wallet, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useOrder, useCancelOrder } from '@/hooks/useOrders'
import { useCreateReturnRequest } from '@/hooks/useReturns'
import { useAddresses } from '@/hooks/useAddresses'
import type { OrderItem } from '@/types'
import { formatCurrency, formatDateTime } from '@/utils/format'

const RETURN_REASONS = [
  'Damaged or defective',
  'Not as described',
  'Wrong item delivered',
  'Wrong size',
  'Quality issue',
  'Changed mind',
  'Other',
]

const CANCELLABLE_ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING']

function canCancelOrder(orderStatus: string): boolean {
  return CANCELLABLE_ORDER_STATUSES.includes(orderStatus.toUpperCase())
}

function ReturnRequestDialog({
  item,
  orderNumber,
  onClose,
  onSuccess,
}: {
  item: OrderItem
  orderNumber: string
  onClose: () => void
  onSuccess: () => void
}) {
  const { data: addresses, isLoading: addressesLoading } = useAddresses()
  const createReturn = useCreateReturnRequest()
  const [quantity, setQuantity] = useState(String(item.quantity))
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [pickupAddressId, setPickupAddressId] = useState('')
  const { t } = useTranslation()

  const policy = item.return_policy
  const message =
    createReturn.error && 'message' in createReturn.error
      ? String((createReturn.error as { message: unknown }).message)
      : null

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const qty = Number(quantity)
    if (!reason || !Number.isInteger(qty) || qty < 1 || qty > item.quantity) return
    createReturn.mutate(
      {
        order_item_id: item.id,
        quantity: qty,
        reason,
        description: description.trim() || null,
        pickup_address_id: pickupAddressId ? Number(pickupAddressId) : undefined,
      },
      { onSuccess },
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('Request return')}</DialogTitle>
          <DialogDescription>
            <span className="line-clamp-1">{item.product_name}</span> · {t('Order')} {orderNumber}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {policy && policy.return_days ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              {t('This item can be returned within {{days}} days of delivery.', { days: policy.return_days })}
            </p>
          ) : null}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('Quantity')}</label>
            <Input
              type="number"
              min="1"
              max={item.quantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t('You ordered {{count}} of this item.', { count: item.quantity })}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('Reason')}</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select a reason…')} />
              </SelectTrigger>
              <SelectContent>
                {RETURN_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('Details')} <span className="font-normal text-muted-foreground">({t('optional')})</span>
            </label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('Tell us what went wrong…')}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('Pickup address')}{' '}
              <span className="font-normal text-muted-foreground">({t('optional — default')})</span>
            </label>
            <Select
              value={pickupAddressId}
              onValueChange={setPickupAddressId}
              disabled={addressesLoading || !addresses?.length}
            >
              <SelectTrigger>
                <SelectValue placeholder={addresses?.length ? t('Choose an address') : t('No saved addresses')} />
              </SelectTrigger>
              <SelectContent>
                {(addresses ?? []).map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.name} · {a.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {message ? <p className="text-sm text-destructive">{message}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={createReturn.isPending}>
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={createReturn.isPending || !reason}>
              {createReturn.isPending ? t('Submitting…') : t('Submit return request')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function canReturn(orderStatus: string, item: OrderItem): boolean {
  const returnable = item.return_policy === undefined || item.return_policy === null || item.return_policy.is_returnable
  return orderStatus.toUpperCase() === 'DELIVERED' && returnable && !item.has_active_return
}

function CancelOrderDialog({
  orderId,
  orderNumber,
  onClose,
  onSuccess,
}: {
  orderId: number
  orderNumber: string
  onClose: () => void
  onSuccess: () => void
}) {
  const cancelOrder = useCancelOrder()
  const [reason, setReason] = useState('')
  const { t } = useTranslation()

  const message =
    cancelOrder.error && 'message' in cancelOrder.error
      ? String((cancelOrder.error as { message: unknown }).message)
      : null

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    cancelOrder.mutate({ id: orderId, reason: reason.trim() || undefined }, { onSuccess })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('Cancel order')}</DialogTitle>
          <DialogDescription>
            {t('Order {{number}} will be cancelled. Any amount already paid will be refunded to your wallet.', { number: orderNumber })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('Reason')} <span className="font-normal text-muted-foreground">({t('optional')})</span>
            </label>
            <Textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('Let us know why you are cancelling')}
            />
          </div>

          {message ? <p className="text-sm text-destructive">{message}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={cancelOrder.isPending}>
              {t('Keep order')}
            </Button>
            <Button type="submit" variant="destructive" disabled={cancelOrder.isPending}>
              {cancelOrder.isPending ? t('Cancelling…') : t('Cancel order')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ReturnBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      {children}
    </div>
  )
}

export function OrderDetailPage() {
  const { id } = useParams()
  const { data: order, isLoading } = useOrder(Number(id))
  const [returnItem, setReturnItem] = useState<OrderItem | null>(null)
  const [justReturned, setJustReturned] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [justCancelled, setJustCancelled] = useState(false)
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Skeleton className="h-72 rounded-xl" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-lg font-medium">{t('Order not found')}</p>
        <Button asChild className="mt-4">
          <Link to="/account">{t('Back to Account')}</Link>
        </Button>
      </div>
    )
  }

  const walletAmount = order.wallet_amount ?? 0
  const grandTotal = Math.round((order.total + walletAmount) * 100) / 100
  // Tax is included in the subtotal already, so it is not subtracted back out.
  const listSubtotal =
    Math.round(
      (grandTotal +
        order.discount -
        (order.shipping_charge ?? 0) -
        (order.cod_charge ?? 0) -
        (order.fees_total ?? 0)) *
        100,
    ) / 100

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/account">
          <ArrowLeft className="mr-1 h-4 w-4" /> {t('Back to account')}
        </Link>
      </Button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{order.order_number}</h1>
          <p className="text-muted-foreground">{formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={order.order_status === 'DELIVERED' ? 'success' : 'secondary'}>
            {order.order_status}
          </Badge>
          <Badge variant={order.payment_status === 'PAID' ? 'success' : 'warning'}>
            {order.payment_status}
          </Badge>
          {canCancelOrder(order.order_status) ? (
            <Button size="sm" variant="outline" onClick={() => setCancelling(true)}>
              <XCircle className="mr-1 h-4 w-4" /> {t('Cancel order')}
            </Button>
          ) : null}
        </div>
      </div>

      {justCancelled ? (
        <div className="mb-4">
          <ReturnBanner>
            {t('Your order has been cancelled. Any refund will appear in your')}{' '}
            <Link to="/account/wallet" className="font-semibold underline">
              {t('wallet')}
            </Link>
            .
          </ReturnBanner>
        </div>
      ) : null}

      {justReturned ? (
        <div className="mb-4">
          <ReturnBanner>
            {t('Your return request has been submitted. Track it in')}{' '}
            <Link to="/account/returns" className="font-semibold underline">
              {t('My Returns')}
            </Link>
            .
          </ReturnBanner>
        </div>
      ) : null}

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Items')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.items.map((item) => {
              const canReturnThis = canReturn(order.order_status, item)
              const policy = item.return_policy
              return (
                <div
                  key={item.id}
                  className="rounded-lg border p-3 sm:flex sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-muted-foreground">
                      {formatCurrency(item.unit_price)} × {item.quantity}
                      {item.vendor && <span className="ml-2">{t('by')} {item.vendor.store_name}</span>}
                    </p>
                    {canReturnThis && policy ? (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700">
                        <RotateCcw className="h-3 w-3" />
                        {policy.return_days
                          ? t('{{days}}-day return window', { days: policy.return_days })
                          : t('Returnable')}
                      </p>
                    ) : null}
                    {item.status === 'RETURN_REQUESTED' || item.has_active_return ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t('Return requested — awaiting confirmation by the seller.')}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-3 flex shrink-0 items-center gap-3 sm:mt-0">
                    <span className="font-medium">{formatCurrency(item.total)}</span>
                    {canReturnThis ? (
                      <Button size="sm" variant="outline" onClick={() => setReturnItem(item)}>
                        <RotateCcw className="mr-1 h-3.5 w-3.5" /> {t('Request return')}
                      </Button>
                    ) : null}
                    {!canReturnThis &&
                      order.order_status.toUpperCase() === 'DELIVERED' &&
                      policy &&
                      policy.is_returnable === false ? (
                      <span className="text-xs text-muted-foreground">{t('Not returnable')}</span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {order.shipping_address && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-primary" /> {t('Shipping Address')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">{order.shipping_address.name}</p>
              <p className="text-muted-foreground">
                {order.shipping_address.address_line1}, {order.shipping_address.city},{' '}
                {order.shipping_address.state} - {order.shipping_address.pincode}
              </p>
            </CardContent>
          </Card>
        )}

        {order.shipment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4 text-primary" /> {t('Shipment')}
              </CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link to={`/account/track?order=${order.id}`}>
                  {t('Track live')} <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="text-sm">
              <p>
                {t('Provider')}: <span className="font-medium">{order.shipment.provider}</span>
              </p>
              {order.shipment.tracking_number && (
                <p className="text-muted-foreground">
                  {t('Tracking')}: {order.shipment.tracking_number}
                </p>
              )}
              <p className="text-muted-foreground">{t('Status')}: {order.shipment.status}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="space-y-2 p-6 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('Subtotal')}</span>
              <span>{formatCurrency(listSubtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('Discount')}</span>
                <span className="text-emerald-600">-{formatCurrency(order.discount)}</span>
              </div>
            )}
            {(order.tax ?? 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('Tax (inclusive)')}</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('Shipping')}</span>
              <span>{formatCurrency(order.shipping_charge ?? 0)}</span>
            </div>
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
                <div className="flex justify-between text-emerald-700">
                  <span className="flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5" /> {t('Paid from wallet')}
                  </span>
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
          </CardContent>
        </Card>
      </div>

      {returnItem ? (
        <ReturnRequestDialog
          item={returnItem}
          orderNumber={order.order_number}
          onClose={() => setReturnItem(null)}
          onSuccess={() => {
            setReturnItem(null)
            setJustReturned(true)
          }}
        />
      ) : null}

      {cancelling ? (
        <CancelOrderDialog
          orderId={order.id}
          orderNumber={order.order_number}
          onClose={() => setCancelling(false)}
          onSuccess={() => {
            setCancelling(false)
            setJustCancelled(true)
          }}
        />
      ) : null}
    </div>
  )
}
