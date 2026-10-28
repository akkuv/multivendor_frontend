import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarClock,
  CircleX,
  ExternalLink,
  Files,
  FileText,
  MapPin,
  PackageCheck,
  RefreshCcw,
  RotateCcw,
  Search,
  Store,
  Truck,
  User,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
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
import { ApiError, ConfirmDialog, EmptyState, PaginationFooter } from '@/components/common/admin'
import {
  useAdminShipment,
  useAdminShipmentLabel,
  useAdminShipments,
  useCancelAdminShipment,
  useGenerateAdminShipmentManifest,
  useRetryAdminShipment,
  useScheduleAdminShipmentPickup,
} from '@/hooks/useAdmin'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { ShipmentDetail } from '@/types'
import { useTranslation } from 'react-i18next'
import { tStatus } from '@/i18n/status'

const STATUS_FILTERS = [
  'PENDING',
  'CREATED',
  'AWB_GENERATED',
  'PICKUP_REQUESTED',
  'PICKUP_SCHEDULED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'REATTEMPTING',
  'CANCELLED',
  'RTO_DELIVERED',
  'FAILED',
]

type BadgeVariant = 'success' | 'warning' | 'destructive' | 'secondary'

const STATUS_BADGE: Record<string, BadgeVariant> = {
  DELIVERED: 'success',
  PICKED_UP: 'success',
  IN_TRANSIT: 'success',
  OUT_FOR_DELIVERY: 'success',
  PICKUP_REQUESTED: 'warning',
  PICKUP_SCHEDULED: 'secondary',
  CREATED: 'secondary',
  AWB_GENERATED: 'secondary',
  PENDING: 'warning',
  REATTEMPTING: 'warning',
  CANCELLED: 'destructive',
  FAILED: 'destructive',
  RTO_DELIVERED: 'secondary',
}

function errorMessage(err: unknown) {
  return typeof err === 'object' && err !== null && 'message' in err
    ? String((err as { message: unknown }).message)
    : null
}

function ShipmentRow({
  shipment,
  onSelect,
}: {
  shipment: ShipmentDetail
  onSelect: (id: number) => void
}) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={() => onSelect(shipment.id)}
      className="flex min-w-0 flex-1 flex-col gap-2 rounded-md text-left transition-colors hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:px-2"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold">{t('Shipment #{{id}}', { id: shipment.id })}</p>
        <Badge variant={STATUS_BADGE[shipment.status] ?? 'secondary'}>
          {shipment.status_label ?? tStatus(t, shipment.status)}
        </Badge>
        {shipment.pickup_status && shipment.pickup_status !== 'NONE' ? (
          <Badge variant="outline">
            {t('Pickup: {{status}}', {
              status: shipment.pickup_status_label ?? tStatus(t, shipment.pickup_status),
            })}
          </Badge>
        ) : null}
      </div>
      <p className="font-mono text-sm tracking-tight">{shipment.tracking_number ?? '—'}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Truck className="h-3 w-3" /> {shipment.provider}
          {shipment.courier_name ? ` (${shipment.courier_name})` : ''}
        </span>
        {shipment.vendor_order ? (
          <span className="inline-flex items-center gap-1">
            <Store className="h-3 w-3" /> {shipment.vendor_order.vendor_order_number}
          </span>
        ) : null}
        {shipment.order?.user?.name ? (
          <span className="inline-flex items-center gap-1">
            <User className="h-3 w-3" /> {shipment.order.user.name}
          </span>
        ) : null}
      </div>
    </button>
  )
}

function ShipmentDetailDialog({
  shipmentId,
  onClose,
  onOpenVendorOrder,
}: {
  shipmentId: number | null
  onClose: () => void
  onOpenVendorOrder: (vendorOrderId: number) => void
}) {
  const { t } = useTranslation()
  const { data: shipment, isLoading, refetch } = useAdminShipment(shipmentId)
  const pickupMutation = useScheduleAdminShipmentPickup()
  const retryMutation = useRetryAdminShipment()
  const cancelMutation = useCancelAdminShipment()
  const labelMutation = useAdminShipmentLabel()

  const [pickupOpen, setPickupOpen] = useState(false)
  const [retryOpen, setRetryOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [retryWeight, setRetryWeight] = useState('1')

  const handlePickup = (e: React.FormEvent) => {
    e.preventDefault()
    if (!shipment) return
    pickupMutation.mutate(
      {
        id: shipment.id,
        payload: {
          pickup_date: pickupDate || undefined,
          pickup_time: pickupTime || undefined,
        },
      },
      { onSuccess: () => setPickupOpen(false) },
    )
  }

  const handleRetry = (e: React.FormEvent) => {
    e.preventDefault()
    if (!shipment) return
    const weight = Number(retryWeight)
    retryMutation.mutate(
      { id: shipment.id, payload: { weight: Number.isFinite(weight) && weight > 0 ? weight : 1 } },
      { onSuccess: () => setRetryOpen(false) },
    )
  }

  const events = [...(shipment?.events ?? [])].sort((a, b) =>
    a.occurred_at < b.occurred_at ? -1 : 1,
  )

  return (
    <>
      <Dialog open={shipmentId != null} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        {isLoading || !shipment ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-80" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                {t('Shipment #{{id}}', { id: shipment.id })}
              </DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-2">
                <Badge variant={STATUS_BADGE[shipment.status] ?? 'secondary'}>
                  {shipment.status_label ?? tStatus(t, shipment.status)}
                </Badge>
                {shipment.pickup_status && shipment.pickup_status !== 'NONE' ? (
                  <span className="text-xs">
                    {t('Pickup: {{status}}', {
                      status: shipment.pickup_status_label ?? tStatus(t, shipment.pickup_status),
                    })}
                  </span>
                ) : null}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => refetch()}
                  title={t('Refresh')}
                >
                  <RefreshCcw className="h-3 w-3" />
                </Button>
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border p-4 text-sm">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('Tracking number')}</p>
                  <p className="font-mono font-medium">{shipment.tracking_number ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('Courier')}</p>
                  <p className="font-medium">{shipment.courier_name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('Weight')}</p>
                  <p className="font-medium">{shipment.weight != null ? `${shipment.weight} kg` : '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('Charges')}</p>
                  <p className="font-medium">{formatCurrency(shipment.charges)}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {shipment.tracking_url ? (
                  <Button asChild variant="outline" size="sm">
                    <a href={shipment.tracking_url} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-1 h-4 w-4" /> {t('Track online')}
                    </a>
                  </Button>
                ) : null}
                {shipment.label_url ? (
                  <Button asChild variant="outline" size="sm">
                    <a href={shipment.label_url} target="_blank" rel="noreferrer">
                      <FileText className="mr-1 h-4 w-4" /> {t('Shipping label')}
                    </a>
                  </Button>
                ) : shipment.shipment_id ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={labelMutation.isPending}
                    onClick={() =>
                      labelMutation.mutate(shipment.id, {
                        onSuccess: (url) => {
                          if (url) window.open(url, '_blank', 'noopener,noreferrer')
                        },
                      })
                    }
                  >
                    <FileText className="mr-1 h-4 w-4" />
                    {labelMutation.isPending ? 'Generating...' : 'Generate label'}
                  </Button>
                ) : null}
                {shipment.manifest_url ? (
                  <Button asChild variant="outline" size="sm">
                    <a href={shipment.manifest_url} target="_blank" rel="noreferrer">
                      <Files className="mr-1 h-4 w-4" /> {t('Manifest')}
                    </a>
                  </Button>
                ) : null}
              </div>

              {labelMutation.error ? (
                <p className="mt-2 text-sm text-destructive">
                  {(labelMutation.error as Error).message}
                </p>
              ) : null}

              {shipment.picker ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UserCheck className="h-3.5 w-3.5" /> Pickup agent: {shipment.picker}
                </p>
              ) : null}

              {shipment.error_message ? (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                  Error: {shipment.error_message}
                </p>
              ) : null}
            </div>

            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-5 w-5 text-primary" /> {t('Shipment Timeline')}
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-72 overflow-y-auto p-4">
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('No tracking events recorded yet.')}</p>
                ) : (
                  <ol className="relative space-y-4 border-l pl-6">
                    {events.map((event, i) => (
                      <li key={event.id} className="relative">
                        <span
                          className={`absolute -left-[26px] top-0 flex h-3 w-3 items-center justify-center rounded-full ${
                            i === events.length - 1 ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                          }`}
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium">
                            {event.status_label ?? tStatus(t, event.status)}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(event.occurred_at)}</p>
                        </div>
                        {event.location ? <p className="text-xs text-muted-foreground">{event.location}</p> : null}
                        {event.description ? <p className="text-xs text-muted-foreground">{event.description}</p> : null}
                        {event.is_webhook ? (
                          <Badge variant="secondary" className="mt-1 text-[10px]">
                            {t('webhook')}
                          </Badge>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="text-base">{t('Actions')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  {shipment.status === 'FAILED' ? (
                    <>
                      <Button className="w-full" variant="outline" onClick={() => setRetryOpen(true)}>
                        <RotateCcw className="mr-1 h-4 w-4" /> {t('Retry shipment')}
                      </Button>
                      {retryMutation.error ? (
                        <p className="text-sm text-destructive">{errorMessage(retryMutation.error)}</p>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <Button className="w-full" variant="outline" onClick={() => setPickupOpen(true)}>
                        <CalendarClock className="mr-1 h-4 w-4" /> {t('Request pickup')}
                      </Button>
                      {pickupMutation.error ? (
                        <p className="text-sm text-destructive">{errorMessage(pickupMutation.error)}</p>
                      ) : null}
                    </>
                  )}
                  {shipment.pickup_requested_at ? (
                    <p className="text-xs text-muted-foreground">
                      Pickup requested: {formatDateTime(shipment.pickup_requested_at)}
                    </p>
                  ) : null}
                  {!['DELIVERED', 'CANCELLED', 'RTO_DELIVERED'].includes(shipment.status) ? (
                    <>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => setCancelOpen(true)}
                      >
                        <CircleX className="mr-1 h-4 w-4" /> {t('Cancel shipment')}
                      </Button>
                      {cancelMutation.error ? (
                        <p className="text-sm text-destructive">
                          {errorMessage(cancelMutation.error)}
                        </p>
                      ) : null}
                    </>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="text-base">{t('Order')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-4 text-sm">
                  {shipment.vendor_order ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">{t('Vendor order')}</span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        onClick={() => onOpenVendorOrder(shipment.vendor_order!.id)}
                      >
                        <PackageCheck className="mr-1 h-3.5 w-3.5" /> {shipment.vendor_order.vendor_order_number}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('Vendor order')}</span>
                      <span>—</span>
                    </div>
                  )}
                  <Separator />
                  {shipment.order?.user ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">{t('Customer')}</span>
                      <span className="font-medium">{shipment.order.user.name}</span>
                    </div>
                  ) : null}
                  {shipment.order?.order_number ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">{t('Order')}</span>
                      <span className="font-medium">{shipment.order.order_number}</span>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </>
        )}
        </DialogContent>
      </Dialog>

      <Dialog open={pickupOpen} onOpenChange={(open) => !open && setPickupOpen(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('Request Pickup')}</DialogTitle>
              <DialogDescription>
                Schedule a courier pickup for shipment {shipmentId != null ? `#${shipmentId}` : ''}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePickup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium leading-none">{t('Pickup date')}</label>
                <Input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium leading-none">{t('Pickup time')}</label>
                <Input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPickupOpen(false)}
                  disabled={pickupMutation.isPending}
                >
                  {t('Cancel')}
                </Button>
                <Button type="submit" disabled={pickupMutation.isPending}>
                  {pickupMutation.isPending ? 'Requesting...' : 'Request pickup'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={retryOpen} onOpenChange={(open) => !open && setRetryOpen(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('Retry Shipment')}</DialogTitle>
              <DialogDescription>
                Retry shipment {shipmentId != null ? `#${shipmentId}` : ''} with a courier.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRetry} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium leading-none">{t('Package weight (kg)')}</label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={retryWeight}
                  onChange={(e) => setRetryWeight(e.target.value)}
                  placeholder={t('e.g. 1.0')}
                  required
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRetryOpen(false)}
                  disabled={retryMutation.isPending}
                >
                  {t('Cancel')}
                </Button>
                <Button type="submit" disabled={retryMutation.isPending}>
                  {retryMutation.isPending ? 'Retrying...' : 'Retry shipment'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={cancelOpen}
          onOpenChange={setCancelOpen}
          title={t('Cancel this shipment?')}
          description={t('The AWB will be voided with the courier. This cannot be undone.')}
          confirmLabel="Cancel shipment"
          loading={cancelMutation.isPending}
          error={cancelMutation.error ? errorMessage(cancelMutation.error) : null}
          onConfirm={() =>
            shipment && cancelMutation.mutate(shipment.id, { onSuccess: () => setCancelOpen(false) })
          }
        />
    </>
  )
}

export function AdminShipmentsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [status, setStatus] = useState('')
  const [selectedShipmentId, setSelectedShipmentId] = useState<number | null>(null)
  const manifestMutation = useGenerateAdminShipmentManifest()

  const { data, isLoading, isError, refetch } = useAdminShipments({
    page,
    per_page: 15,
    search: debounced || undefined,
    status: status || undefined,
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Truck className="h-6 w-6 text-primary" /> {t('Shipments')}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={manifestMutation.isPending || !data?.data.length}
            onClick={() =>
              manifestMutation.mutate(
                (data?.data ?? []).map((s) => s.id),
              )
            }
          >
            <Files className="mr-1 h-4 w-4" />
            {manifestMutation.isPending ? 'Building...' : 'Manifest for this page'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCcw className="mr-1 h-4 w-4" /> {t('Refresh')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('Search tracking, courier...')}
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
            {STATUS_FILTERS.map((s) => (
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
        <ApiError error={{ message: t('Could not load shipments.') }} onRetry={refetch} />
      ) : data && data.data.length === 0 ? (
        <EmptyState message="No shipments found." />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {data?.data.map((shipment) => (
                  <div
                    key={shipment.id}
                    className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <ShipmentRow shipment={shipment} onSelect={setSelectedShipmentId} />
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        <CalendarClock className="mr-1 inline h-3 w-3" />
                        {formatDateTime(shipment.created_at)}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => setSelectedShipmentId(shipment.id)}>
                        {t('View')}
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

      <ShipmentDetailDialog
        shipmentId={selectedShipmentId}
        onClose={() => setSelectedShipmentId(null)}
        onOpenVendorOrder={(vendorOrderId) => navigate(`/admin/vendor-orders/${vendorOrderId}`)}
      />
    </div>
  )
}