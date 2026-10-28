import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CheckCircle2,
  CircleDot,
  Clock,
  MapPin,
  Package,
  Search,
  Truck,
  XCircle,
} from 'lucide-react'
import { useMyOrders, useOrderTracking } from '@/hooks/useOrders'
import type { TrackingLeg } from '@/services/order'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { AccountSubPageHeader } from '@/components/common/AccountSubPageHeader'
import { formatDateTime } from '@/utils/format'
import type { ShipmentEvent } from '@/types'
import { useTranslation } from 'react-i18next'
import { tStatus } from '@/i18n/status'

const SHIPMENT_BADGE: Record<string, 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'> = {
  DELIVERED: 'success',
  PICKED_UP: 'success',
  IN_TRANSIT: 'warning',
  OUT_FOR_DELIVERY: 'warning',
  PICKUP_SCHEDULED: 'warning',
  AWB_GENERATED: 'secondary',
  CREATED: 'secondary',
  CANCELLED: 'destructive',
  FAILED: 'destructive',
  RTO_DELIVERED: 'destructive',
}

function badgeVariant(status: string): 'success' | 'warning' | 'destructive' | 'secondary' | 'outline' {
  return SHIPMENT_BADGE[status] ?? 'outline'
}

/** Either a stored shipment event or a leg straight from the courier's feed. */
type TimelineEntry = Pick<
  ShipmentEvent,
  'status' | 'status_label' | 'location' | 'description' | 'occurred_at'
> & { id?: number; key?: string }

/**
 * Combine our own webhook-recorded events with the courier's live scan feed.
 * Both sources usually overlap, so entries are keyed on status + timestamp and
 * the courier feed wins, since it is the fresher of the two.
 */
function mergeTrackingHistory(
  events: ShipmentEvent[],
  courierLegs: TrackingLeg[],
): TimelineEntry[] {
  const merged = new Map<string, TimelineEntry>()

  for (const event of events) {
    merged.set(`${event.status}|${event.occurred_at}`, {
      status: event.status,
      status_label: event.status_label,
      location: event.location,
      description: event.description,
      occurred_at: event.occurred_at,
      key: `event-${event.id}`,
    })
  }

  courierLegs.forEach((leg, index) => {
    const occurredAt = leg.status_date ?? leg.date ?? ''
    merged.set(`${leg.status ?? ''}|${occurredAt}`, {
      status: leg.status ?? '',
      status_label: null,
      location: leg.location ?? null,
      description: leg.remark ?? null,
      occurred_at: occurredAt,
      key: `courier-${occurredAt}-${index}`,
    })
  })

  return [...merged.values()].sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
  )
}

export function TrackOrderPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const { data: ordersData, isLoading: ordersLoading } = useMyOrders(true)
  const [pickedId, setPickedId] = useState<number | null>(
    params.get('order') ? Number(params.get('order')) : null,
  )
  const [search, setSearch] = useState('')

  const orders = useMemo(() => ordersData?.data ?? [], [ordersData])

  const candidates = useMemo(() => {
    const term = search.trim().toLowerCase()
    const pool = term
      ? orders.filter(
          (o) =>
            o.order_number?.toLowerCase().includes(term) ||
            String(o.id).includes(term) ||
            (o.shipment?.tracking_number ?? '').toLowerCase().includes(term),
        )
      : orders
    // Freshest parcels first — those are the ones people come here to check.
    return [...pool].sort((a, b) => {
      const rank = (o: (typeof orders)[number]) =>
        o.shipment?.tracking_number ? 0 : o.order_status === 'CANCELLED' ? 2 : 1
      return rank(a) - rank(b)
    })
  }, [orders, search])

  // Fall back to the first candidate so a panel is always populated, without
  // pushing that choice into state.
  const selectedId =
    pickedId != null && candidates.some((o) => o.id === pickedId)
      ? pickedId
      : (candidates[0]?.id ?? null)

  const select = (id: number) => {
    setPickedId(id)
    setParams({ order: String(id) }, { replace: true })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <AccountSubPageHeader
        icon={Truck}
        title={t('Track Your Order')}
        subtitle={t('Live courier status straight from the carrier, no Shiprocket account needed.')}
        actions={
          <Link
            to="/account/orders"
            className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs font-semibold text-primary shadow-sm transition hover:bg-primary/10"
          >
            <Package className="h-3.5 w-3.5" /> {t('All orders')}
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t('Search by order number or AWB')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {ordersLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Package className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">{t('No matching orders')}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {orders.length === 0
                    ? t('You have no orders yet.')
                    : t('Try a different order number or tracking number.')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-2">
              {candidates.map((order) => {
                const active = order.id === selectedId
                return (
                  <li key={order.id}>
                    <button
                      type="button"
                      onClick={() => select(order.id)}
                      className={
                        active
                          ? 'w-full rounded-xl border-2 border-primary bg-primary/5 p-3 text-left shadow-sm transition'
                          : 'w-full rounded-xl border bg-card p-3 text-left transition hover:border-primary/40 hover:bg-muted/40'
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-sm font-bold">{order.order_number}</span>
                        <Badge variant={badgeVariant(order.shipment?.status ?? order.order_status)}>
                          {order.shipment?.status_label ?? tStatus(t, order.order_status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t('Placed {{date}}', { date: formatDateTime(order.created_at) })}
                      </p>
                      {order.shipment?.tracking_number && (
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          AWB {order.shipment.tracking_number}
                        </p>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <TrackingPanel orderId={selectedId} />
      </div>
    </div>
  )
}

function TrackingPanel({ orderId }: { orderId: number | null }) {
  const { t } = useTranslation()
  const { data, isLoading, error } = useOrderTracking(orderId)

  if (orderId == null) {
    return (
      <Card>
        <CardContent className="flex min-h-[320px] flex-col items-center justify-center text-center">
          <Truck className="h-9 w-9 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">{t('Select an order to see its tracking')}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('We pull the latest status from the courier handling your parcel.')}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-3 py-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex min-h-[280px] flex-col items-center justify-center text-center">
          <XCircle className="h-9 w-9 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">{t('Tracking unavailable')}</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{(error as Error).message}</p>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  const { shipment, tracking, tracking_notice } = data
  const history = mergeTrackingHistory(shipment.events ?? [], tracking?.tracking_data ?? [])

  return (
    <div className="space-y-4">
      {tracking_notice ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800"
        >
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          {tracking_notice}
        </p>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {shipment.provider}
              </p>
              <p className="font-display text-xl font-bold">
                {shipment.courier_name ?? t('Courier not assigned')}
              </p>
              {shipment.tracking_number && (
                <p className="mt-0.5 font-mono text-sm text-muted-foreground">
                  AWB {shipment.tracking_number}
                </p>
              )}
            </div>
            <Badge variant={badgeVariant(shipment.status)} className="text-xs">
              {shipment.status_label ?? tStatus(t, shipment.status)}
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Fact label={t('Weight')} value={shipment.weight != null ? `${shipment.weight} kg` : '—'} />
            <Fact label={t('Charges')} value={shipment.charges ? `₹${shipment.charges}` : t('Free')} />
            <Fact
              label={t('Pickup location')}
              value={shipment.pickup_location ?? '—'}
              icon={<MapPin className="h-3 w-3" />}
            />
          </div>

          {shipment.tracking_url && (
            <a
              href={shipment.tracking_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              {t('Track on {{courier}}', { courier: shipment.courier_name ?? t('courier website') })}
            </a>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold">
            <Clock className="h-4 w-4 text-primary" /> {t('Tracking history')}
          </h2>

          {history.length > 0 ? (
            <Timeline events={history} />
          ) : (
            <p className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              {t('No tracking events recorded yet. They appear here as soon as the courier scans your parcel.')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Timeline({ events }: { events: TimelineEntry[] }) {
  const { t } = useTranslation()
  return (
    <ol className="relative space-y-5 border-l border-dashed pl-6">
      {events.map((event, index) => (
        <li key={event.key ?? event.id} className="relative">
          <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-background ring-4 ring-background">
            {index === 0 ? (
              <CheckCircle2 className="h-4 w-4 fill-primary text-primary" />
            ) : (
              <CircleDot className="h-3 w-3 text-muted-foreground" />
            )}
          </span>
          <p className="text-sm font-semibold capitalize">
            {event.status_label ?? tStatus(t, event.status)}
          </p>
          {event.location && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {event.location}
            </p>
          )}
          {event.description && event.description !== event.status_label && (
            <p className="mt-0.5 text-sm text-muted-foreground">{event.description}</p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(event.occurred_at)}</p>
        </li>
      ))}
    </ol>
  )
}

function Fact({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 flex items-center gap-1 truncate text-sm font-semibold">
        {icon}
        {value}
      </p>
    </div>
  )
}

export function TrackOrderButton() {
  const { t } = useTranslation()
  return (
    <Button asChild variant="outline" size="sm">
      <Link to="/account/track">
        <Truck className="mr-1 h-4 w-4" /> {t('Track order')}
      </Link>
    </Button>
  )
}