import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarClock,
  Check,
  CircleCheck,
  CircleX,
  ExternalLink,
  FileText,
  Files,
  MapPin,
  Package,
  PackageCheck,
  PackageSearch,
  RefreshCcw,
  RotateCcw,
  Truck,
  Undo2,
  UserCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import { FormField, ApiError, ConfirmDialog } from '@/components/common/admin'
import {
  useRequestVendorShipmentPickup,
  useRetryVendorShipment,
  useCancelVendorShipment,
  useVendorShipment,
  useVendorShipmentLabel,
} from '@/hooks/useVendor'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { ShipmentDetail, ShipmentEvent } from '@/types'
import { useTranslation } from 'react-i18next'
import { tStatus } from '@/i18n/status'

function errorMessage(err: unknown) {
  return typeof err === 'object' && err !== null && 'message' in err
    ? String((err as { message: unknown }).message)
    : null
}

function httpStatus(err: unknown): number | null {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    return (err as { response?: { status?: number } }).response?.status ?? null
  }
  return null
}

const PHASES = [
  { key: 'PICKED_UP', label: 'Picked up' },
  { key: 'IN_TRANSIT', label: 'In transit' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
]

const PHASE_ICONS = [Package, Truck, MapPin, PackageCheck]

function phaseIndex(status: string): number {
  if (['CANCELLED', 'FAILED', 'RTO_DELIVERED'].includes(status)) return -1
  if (status === 'PICKED_UP') return 1
  if (status === 'IN_TRANSIT') return 2
  if (status === 'OUT_FOR_DELIVERY' || status === 'REATTEMPTING') return 3
  if (status === 'DELIVERED') return 4
  return 0
}

type BadgeVariant = 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'

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

const GRADIENT: Record<string, string> = {
  DELIVERED: 'from-emerald-400 to-teal-600',
  PICKED_UP: 'from-yellow-400 to-amber-600',
  IN_TRANSIT: 'from-yellow-400 to-amber-600',
  OUT_FOR_DELIVERY: 'from-amber-400 to-orange-600',
  REATTEMPTING: 'from-amber-400 to-orange-600',
  PICKUP_REQUESTED: 'from-amber-400 to-orange-600',
  PICKUP_SCHEDULED: 'from-amber-400 to-yellow-600',
  PENDING: 'from-amber-400 to-yellow-600',
  CREATED: 'from-slate-400 to-slate-600',
  AWB_GENERATED: 'from-slate-400 to-slate-600',
  CANCELLED: 'from-rose-400 to-red-600',
  FAILED: 'from-rose-400 to-red-600',
  RTO_DELIVERED: 'from-slate-400 to-slate-600',
}

function EventMarker({ status }: { status: string }) {
  const style = eventStyle(status)
  const Icon = style.icon

  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${style.chip}`}
    >
      <Icon className="h-4 w-4" />
    </span>
  )
}

function eventStyle(status: string): { icon: LucideIcon; chip: string; dot: string } {
  switch (status) {
    case 'DELIVERED':
      return {
        icon: PackageCheck,
        chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
        dot: 'bg-emerald-400',
      }
    case 'PICKED_UP':
      return {
        icon: Package,
        chip: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
        dot: 'bg-yellow-400',
      }
    case 'IN_TRANSIT':
      return {
        icon: Truck,
        chip: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
        dot: 'bg-yellow-400',
      }
    case 'OUT_FOR_DELIVERY':
      return {
        icon: MapPin,
        chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
        dot: 'bg-amber-400',
      }
    case 'REATTEMPTING':
    case 'PICKUP_REQUESTED':
    case 'PICKUP_SCHEDULED':
      return {
        icon: Wrench,
        chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
        dot: 'bg-amber-400',
      }
    case 'CANCELLED':
    case 'FAILED':
      return {
        icon: CircleX,
        chip: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
        dot: 'bg-rose-400',
      }
    case 'RTO_DELIVERED':
      return {
        icon: Undo2,
        chip: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-400',
        dot: 'bg-slate-400',
      }
    default:
      return {
        icon: FileText,
        chip: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-400',
        dot: 'bg-slate-400',
      }
  }
}

function TimelineRow({ event, isLast }: { event: ShipmentEvent; isLast: boolean }) {
  const { t } = useTranslation()
  const style = eventStyle(event.status)

  return (
    <li className="relative">
      {!isLast && (
        <span
          className={`absolute left-[16px] top-10 h-[calc(100%-2rem)] w-px ${style.dot}`}
        />
      )}
      <div className="relative flex gap-4">
        <EventMarker status={event.status} />
        <div className="flex-1 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              {event.status_label ?? tStatus(t, event.status)}
            </p>
            <p className="text-xs text-muted-foreground">{formatDateTime(event.occurred_at)}</p>
          </div>
          {event.description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{event.description}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {event.location ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {event.location}
              </span>
            ) : null}
            {event.is_webhook ? (
              <Badge variant="secondary" className="text-[10px]">
                {t('webhook')}
              </Badge>
            ) : null}
            <Badge variant="outline" className={`text-[10px] ${style.chip}`}>
              {event.status ? tStatus(t, event.status) : '—'}
            </Badge>
          </div>
        </div>
      </div>
    </li>
  )
}

function ProgressStepper({ shipment, onRetry }: { shipment: ShipmentDetail; onRetry?: () => void }) {
  const { t } = useTranslation()
  const step = phaseIndex(shipment.status)
  const isTerminal = step === -1

  if (isTerminal) {
    const isFailed = shipment.status === 'FAILED'
    return (
      <div
        className={`rounded-2xl p-6 text-white shadow-lg ${
          isFailed ? 'bg-gradient-to-r from-rose-600 via-red-600 to-orange-600' : 'bg-gradient-to-r from-slate-600 to-slate-800'
        }`}
      >
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
            <CircleX className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold">
              {isFailed ? t('Shipment needs attention') : t('Shipment ended')}
            </h2>
            <p className="text-sm text-white/85">
              {isFailed
                ? shipment.error_message ?? t('The courier could not fulfil this shipment.')
                : t('This shipment was {{status}}.', {
                    status: shipment.status_label?.toLowerCase() ?? tStatus(t, shipment.status),
                  })}
            </p>
          </div>
          {isFailed ? (
            <Button
              variant="secondary"
              className="border-0 bg-white/15 text-white hover:bg-white/25 hover:text-white"
              onClick={onRetry}
            >
              <RotateCcw className="mr-1 h-4 w-4" /> {t('Retry shipment')}
            </Button>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border bg-background p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r ${GRADIENT[shipment.status] ?? 'from-slate-400 to-slate-600'} text-white`}>
            <Truck className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">{t('Delivery progress')}</h2>
            <p className="text-xs text-muted-foreground">
              {shipment.status_label ?? tStatus(t, shipment.status)}
            </p>
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {t('Stage {{current}} of {{total}}', { current: Math.max(step, 0), total: PHASES.length })}
        </span>
      </div>

      <div className="flex items-center">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r ${GRADIENT[shipment.status] ?? 'from-slate-400 to-slate-600'} text-white`}
        >
          <Check className="h-4 w-4" />
        </span>
        {PHASES.map((phase, i) => {
          const idx = i + 1
          const reached = step >= idx
          const isCurrent = step === idx
          const Icon = PHASE_ICONS[i]
          return (
            <div key={phase.key} className="flex flex-1 items-center">
              <span className={`h-0.5 flex-1 ${step > i ? 'bg-primary' : 'bg-border'}`} />
              <div className="flex flex-col items-center">
                <span
                  title={phase.label}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${
                    reached
                      ? isCurrent
                        ? `border-transparent bg-gradient-to-r ${GRADIENT[shipment.status] ?? 'from-slate-400 to-slate-600'} text-white`
                        : 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  {reached ? <Icon className="h-4 w-4" /> : <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />}
                </span>
                <span className="mt-1.5 hidden text-[10px] font-medium text-muted-foreground sm:block">
                  {phase.label}
                </span>
              </div>
            </div>
          )
        })}
        <span className="ml-1 h-9 w-9 rounded-full border-2 border-border bg-background" />
      </div>

      {shipment.pickup_requested_at && (
        <p className="mt-4 text-xs text-muted-foreground">
          Pickup requested {formatDateTime(shipment.pickup_requested_at)}
        </p>
      )}
    </div>
  )
}

function StatTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur">
      <Icon className="h-4 w-4 text-white/80" />
      <p className="mt-1.5 truncate text-sm font-bold text-white">{value}</p>
      <p className="text-[11px] text-white/75">{label}</p>
    </div>
  )
}

export function VendorShipmentDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const shipmentId = id ? Number(id) : null

  const { data: shipment, isLoading, isError, error, refetch } = useVendorShipment(shipmentId)
  const pickupMutation = useRequestVendorShipmentPickup()
  const retryMutation = useRetryVendorShipment()
  const cancelMutation = useCancelVendorShipment()
  const labelMutation = useVendorShipmentLabel()

  const [pickupOpen, setPickupOpen] = useState(false)
  const [retryOpen, setRetryOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [retryWeight, setRetryWeight] = useState('1')

  const canRequestLabel = !!shipment && !shipment.label_url && shipment.shipment_id != null
  const canCancel = !!shipment && !['DELIVERED', 'CANCELLED', 'RTO_DELIVERED'].includes(shipment.status)

  const onGenerateLabel = () => {
    if (shipmentId == null) return
    labelMutation.mutate(shipmentId, {
      onSuccess: (labelUrl) => {
        if (labelUrl) {
          window.open(labelUrl, '_blank', 'noopener,noreferrer')
        }
      },
    })
  }

  const onCancelShipment = () => {
    if (shipmentId == null) return
    cancelMutation.mutate(shipmentId, {
      onSuccess: () => setCancelOpen(false),
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (isError) {
    if (httpStatus(error) === 404) {
      return (
        <div className="mx-auto max-w-lg py-16 text-center">
          <PackageSearch className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-lg font-semibold">{t('Shipment not found')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('This shipment does not exist or is not available in your store.')}
          </p>
          <Button asChild variant="outline" size="sm" className="mt-6">
            <Link to="/vendor/shipments">
              <ArrowLeft className="h-4 w-4" /> {t('Back to shipments')}
            </Link>
          </Button>
        </div>
      )
    }

    return <ApiError error={{ message: t('Could not load shipment.') }} onRetry={refetch} />
  }

  if (!shipment) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    )
  }

  const handlePickup = (e: React.FormEvent) => {
    e.preventDefault()
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
    const weight = Number(retryWeight)
    retryMutation.mutate(
      { id: shipment.id, payload: { weight: Number.isFinite(weight) && weight > 0 ? weight : 1 } },
      { onSuccess: () => setRetryOpen(false) },
    )
  }

  const events = shipment.events ?? []
  const sortedEvents = [...events].sort((a, b) => (a.occurred_at < b.occurred_at ? -1 : 1))
  const hasPickup = Boolean(shipment.pickup_status && shipment.pickup_status !== 'NONE')

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 via-amber-600 to-yellow-600 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="secondary" size="sm" className="border-0 bg-white/15 text-white hover:bg-white/25 hover:text-white">
              <Link to="/vendor/shipments">
                <ArrowLeft className="h-4 w-4" /> {t('Shipments')}
              </Link>
            </Button>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
              <Truck className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold">{t('Shipment #{{id}}', { id: shipment.id })}</h1>
              <p className="text-sm text-white/80">
                {shipment.vendor_order?.vendor_order_number ?? '—'} · {shipment.provider}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-white/30 bg-white/15 text-white backdrop-blur">
              {shipment.status_label ?? tStatus(t, shipment.status)}
            </Badge>
            {hasPickup && (
              <Badge className="border-white/30 bg-white/15 text-white backdrop-blur">
                {t('Pickup: {{status}}', {
                  status: shipment.pickup_status_label ?? tStatus(t, shipment.pickup_status ?? ''),
                })}
              </Badge>
            )}
            <Button
              variant="secondary"
              size="icon"
              onClick={() => refetch()}
              title={t('Refresh')}
              className="border-0 bg-white/15 text-white hover:bg-white/25 hover:text-white"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile icon={FileText} label={t('Tracking number')} value={shipment.tracking_number ?? '—'} />
          <StatTile icon={Truck} label={t('Courier')} value={shipment.courier_name ?? '—'} />
          <StatTile icon={Package} label={t('Weight')} value={shipment.weight != null ? `${shipment.weight} kg` : '—'} />
          <StatTile icon={CircleCheck} label={t('Charges')} value={formatCurrency(shipment.charges)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          <ProgressStepper shipment={shipment} onRetry={() => setRetryOpen(true)} />

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-5 w-5 text-primary" /> {t('Tracking timeline')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed py-10 text-center">
                  <Truck className="mx-auto h-8 w-8 text-muted-foreground/60" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('No tracking events recorded yet.')}
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                    <RefreshCcw className="mr-1 h-4 w-4" /> {t('Refresh')}
                  </Button>
                </div>
              ) : (
                <ol className="relative">
                  {sortedEvents.map((event, i) => (
                    <TimelineRow key={event.id} event={event} isLast={i === sortedEvents.length - 1} />
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-primary" /> {t('Shipment details')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {shipment.error_message ? (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                  <CircleX className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{shipment.error_message}</span>
                </div>
              ) : null}

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
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('Shipped')}</p>
                  <p className="font-medium">{shipment.shipped_at ? formatDateTime(shipment.shipped_at) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('Delivered')}</p>
                  <p className="font-medium">{shipment.delivered_at ? formatDateTime(shipment.delivered_at) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('Retries')}</p>
                  <p className="font-medium">{shipment.retry_count ?? 0}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
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
                ) : canRequestLabel ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={labelMutation.isPending}
                    onClick={onGenerateLabel}
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
                <p className="text-sm text-destructive">{errorMessage(labelMutation.error)}</p>
              ) : null}
              {shipment.picker ? (
                <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                  <UserCheck className="h-3.5 w-3.5" /> Pickup agent: {shipment.picker}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card className="border-border/60 bg-white/70 shadow-sm backdrop-blur dark:bg-card/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <RotateCcw className="h-5 w-5 text-primary" /> {t('Actions')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {shipment.status === 'FAILED' ? (
                <>
                  <Button className="w-full" onClick={() => setRetryOpen(true)}>
                    <RotateCcw className="mr-1 h-4 w-4" /> {t('Retry shipment')}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Retries so far: {shipment.retry_count ?? 0}. Retrying creates a new courier pickup.
                  </p>
                  {retryMutation.error ? (
                    <p className="text-sm text-destructive">{errorMessage(retryMutation.error)}</p>
                  ) : null}
                </>
              ) : (
                <>
                  <Button className="w-full" onClick={() => setPickupOpen(true)}>
                    <CalendarClock className="mr-1 h-4 w-4" /> {t('Request pickup')}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {t('Schedule a courier to collect this package from your store.')}
                  </p>
                  {pickupMutation.error ? (
                    <p className="text-sm text-destructive">{errorMessage(pickupMutation.error)}</p>
                  ) : null}
                </>
              )}

              {canCancel ? (
                <>
                  <Separator />
                  <Button variant="outline" className="w-full text-destructive" onClick={() => setCancelOpen(true)}>
                    <CircleX className="mr-1 h-4 w-4" /> {t('Cancel shipment')}
                  </Button>
                  {cancelMutation.error ? (
                    <p className="text-sm text-destructive">{errorMessage(cancelMutation.error)}</p>
                  ) : null}
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-white/70 shadow-sm backdrop-blur dark:bg-card/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-5 w-5 text-primary" /> {t('Pickup')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">{t('Status')}</p>
                {hasPickup ? (
                  <Badge variant={STATUS_BADGE[shipment.pickup_status ?? ''] ?? 'secondary'}>
                    {shipment.pickup_status_label ?? tStatus(t, shipment.pickup_status ?? '')}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">{t('Not requested')}</span>
                )}
              </div>
              {shipment.pickup_requested_at ? (
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">{t('Requested')}</p>
                  <p className="font-medium">{formatDateTime(shipment.pickup_requested_at)}</p>
                </div>
              ) : null}
              {shipment.pickup_location ? (
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">{t('Location')}</p>
                  <p className="max-w-[60%] truncate text-right font-medium">{shipment.pickup_location}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-white/70 shadow-sm backdrop-blur dark:bg-card/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5 text-primary" /> {t('Order')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="text-muted-foreground">{t('Vendor order')}</p>
                {shipment.vendor_order ? (
                  <Button asChild variant="link" size="sm" className="h-auto p-0">
                    <Link to={`/vendor/orders/${shipment.vendor_order.id}`}>
                      {shipment.vendor_order.vendor_order_number}
                    </Link>
                  </Button>
                ) : (
                  <span>—</span>
                )}
              </div>
              <Separator className="my-1" />
              {shipment.order?.user ? (
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">{t('Customer')}</p>
                  <p className="font-medium">{shipment.order.user.name}</p>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">{t('Order total')}</p>
                <p className="font-medium">{shipment.order?.total != null ? formatCurrency(Number(shipment.order.total)) : '—'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pickup dialog */}
      <Dialog open={pickupOpen} onOpenChange={(open) => !open && setPickupOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Request Pickup')}</DialogTitle>
            <DialogDescription>
              Schedule a courier pickup for shipment #{shipment.id}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePickup} className="space-y-4">
            <FormField label={t('Pickup date')}>
              <Input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
              />
            </FormField>
            <FormField label={t('Pickup time')}>
              <Input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
              />
            </FormField>
            {pickupMutation.error ? (
              <p className="text-sm text-destructive">{errorMessage(pickupMutation.error)}</p>
            ) : null}
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

      {/* Retry dialog */}
      <Dialog open={retryOpen} onOpenChange={(open) => !open && setRetryOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Retry Shipment')}</DialogTitle>
            <DialogDescription>
              Create a new courier pickup for shipment #{shipment.id}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRetry} className="space-y-4">
            <FormField label={t('Package weight (kg)')}>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={retryWeight}
                onChange={(e) => setRetryWeight(e.target.value)}
                placeholder="e.g. 1.0"
                required
              />
            </FormField>
            {retryMutation.error ? (
              <p className="text-sm text-destructive">{errorMessage(retryMutation.error)}</p>
            ) : null}
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
        onConfirm={onCancelShipment}
      />
    </div>
  )
}