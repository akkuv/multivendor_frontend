import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarClock,
  Check,
  CircleCheck,
  CircleX,
  Files,
  MapPin,
  PackageCheck,
  RefreshCcw,
  Search,

  Truck,
  Wrench,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ApiError, PaginationFooter } from '@/components/common/admin'
import { useGenerateVendorShipmentManifest, useVendorShipments } from '@/hooks/useVendor'
import type { ShipmentDetail } from '@/types'
import { formatDateTime } from '@/utils/format'
import { useTranslation } from 'react-i18next'
import { tStatus } from '@/i18n/status'

const STATUS_FILTERS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CREATED', label: 'Created' },
  { value: 'AWB_GENERATED', label: 'AWB generated' },
  { value: 'PICKUP_REQUESTED', label: 'Pickup requested' },
  { value: 'PICKUP_SCHEDULED', label: 'Pickup scheduled' },
  { value: 'PICKED_UP', label: 'Picked up' },
  { value: 'IN_TRANSIT', label: 'In transit' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'REATTEMPTING', label: 'Reattempting' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'RTO_DELIVERED', label: 'RTO delivered' },
  { value: 'FAILED', label: 'Failed' },
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

const ICON_BG: Record<string, string> = {
  DELIVERED: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  PICKED_UP: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-400',
  IN_TRANSIT: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-400',
  OUT_FOR_DELIVERY: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  REATTEMPTING: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  PICKUP_REQUESTED: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  PICKUP_SCHEDULED: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  PENDING: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  CREATED: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400',
  AWB_GENERATED: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400',
  CANCELLED: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
  FAILED: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
  RTO_DELIVERED: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400',
}

const PHASES = [
  { key: 'PICKED_UP', label: 'Picked up' },
  { key: 'IN_TRANSIT', label: 'In transit' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
]

function phaseIndex(status: string): number {
  if (['CANCELLED', 'FAILED', 'RTO_DELIVERED'].includes(status)) return -1
  if (status === 'PICKED_UP') return 1
  if (status === 'IN_TRANSIT') return 2
  if (status === 'OUT_FOR_DELIVERY' || status === 'REATTEMPTING') return 3
  if (status === 'DELIVERED') return 4
  return 0
}

type ShipmentCardData = Pick<ShipmentDetail, 'id' | 'status'> & {
  order_id?: number
  tracking_number: string | null
  provider: string
  courier_name: string | null
  status_label?: string | null
  shipped_at?: string | null
  delivered_at?: string | null
  vendor_order?: { vendor_order_number?: string } | null
  order?: { user?: { name?: string } | null } | null
  created_at?: string
}





function ShipmentCard({
  shipment,
  selected,
  onToggleSelect,
}: {
  shipment: ShipmentCardData
  selected?: boolean
  onToggleSelect?: (id: number) => void
}) {
  const { t } = useTranslation()
  const step = phaseIndex(shipment.status)
  const terminal = step === -1

  return (
    <div
      className={
        selected
          ? 'group relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-primary bg-white/80 shadow-lg backdrop-blur dark:bg-card/80'
          : 'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-transparent bg-white/70 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl dark:bg-card/70'
      }
    >
      {onToggleSelect ? (
        <label className="absolute right-3 top-3 z-10 flex cursor-pointer items-center">
          <span className="sr-only">Select shipment {shipment.id}</span>
          <input
            type="checkbox"
            checked={!!selected}
            onChange={() => onToggleSelect(shipment.id)}
            className="h-4 w-4 cursor-pointer rounded border-muted-foreground/40 accent-primary"
          />
        </label>
      ) : null}
      <Link
        to={`/vendor/shipments/${shipment.id}`}
        className="flex flex-1 flex-col overflow-hidden"
      >
      <div className={`h-1.5 bg-gradient-to-r ${GRADIENT[shipment.status] ?? 'from-slate-400 to-slate-600'}`} />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${ICON_BG[shipment.status] ?? 'bg-muted text-muted-foreground'}`}
            >
              {shipment.status === 'DELIVERED' ? (
                <PackageCheck className="h-5 w-5" />
              ) : terminal ? (
                <CircleX className="h-5 w-5" />
              ) : (
                <Truck className="h-5 w-5" />
              )}
            </span>
            <div>
              <p className="font-semibold">
                Shipment <span className="text-muted-foreground">#{shipment.id}</span>
              </p>
              <p className="text-xs text-muted-foreground">{shipment.provider}</p>
            </div>
          </div>
          <Badge variant={STATUS_BADGE[shipment.status] ?? 'secondary'}>
            {shipment.status_label ?? tStatus(t, shipment.status)}
          </Badge>
        </div>

        <div className="rounded-xl border border-dashed bg-muted/30 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {t('Tracking number')}
          </p>
          <p className="font-mono text-sm font-medium tracking-tight">{shipment.tracking_number}</p>
        </div>

        {terminal ? (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
            <Wrench className="h-4 w-4" />
            {t('{{status}} — no active tracking timeline', { status: tStatus(t, shipment.status) })}
          </div>
        ) : (
          <div>
            <div className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {t('Journey')}
              </span>
              <span>
                {t('Stage {{current}} of {{total}}', { current: step, total: PHASES.length })}
              </span>
            </div>
            <div className="flex items-center">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition ${
                  step >= 0
                    ? 'border-transparent bg-gradient-to-r text-white dark:text-white'
                    : ''
                } ${step >= 0 ? (GRADIENT[shipment.status] ?? 'from-slate-400 to-slate-600') : ''}`}
              >
                <Check className="h-3.5 w-3.5" />
              </span>
              {PHASES.map((phase, i) => {
                const idx = i + 1
                const reached = step >= idx
                const isLast = idx === PHASES.length
                const isCurrent = step === idx
                return (
                  <div key={phase.key} className="flex flex-1 items-center">
                    <span
                      className={`h-0.5 flex-1 ${reached ? 'bg-primary' : 'bg-border'}`}
                    />
                    <span
                      title={phase.label}
                      className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition ${
                        reached
                          ? isCurrent
                            ? `${GRADIENT[shipment.status] ?? 'from-slate-400 to-slate-600'} border-transparent text-white`
                            : 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-muted-foreground'
                      }`}
                    >
                      {reached ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />}
                    </span>
                    {!isLast && <span className="h-0.5 w-full" />}
                  </div>
                )
              })}
              <span className="ml-1 text-[10px] text-muted-foreground">{PHASES[PHASES.length - 1].label}</span>
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-muted-foreground">
              {shipment.vendor_order?.vendor_order_number ?? `#${shipment.id}`} ·{' '}
              {shipment.order?.user?.name ?? 'Customer'}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarClock className="h-3 w-3" /> {formatDateTime(shipment.created_at)}
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <span>{t('Track')}</span>
          </Button>
        </div>
      </div>
      </Link>
    </div>
  )
}

function downloadLocalManifest(shipments: ShipmentCardData[]) {
  const rows = shipments
    .map(
      (s) =>
        `<tr>
          <td>${s.id}</td>
          <td>${s.vendor_order?.vendor_order_number ?? '—'}</td>
          <td>${s.order?.user?.name ?? '—'}</td>
          <td>${s.tracking_number ?? '—'}</td>
          <td>${s.provider}</td>
          <td>${s.courier_name ?? '—'}</td>
          <td>${s.status}</td>
          <td>${s.created_at ? new Date(s.created_at).toLocaleString() : '—'}</td>
        </tr>`,
    )
    .join('')

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Pickup Manifest</title>
<style>
  body { font-family: Arial, sans-serif; padding: 24px; color: #1a1a1a; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  p { color: #555; font-size: 13px; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
  th { background: #f5f5f5; font-weight: 600; }
  @media print { body { padding: 0; } }
</style></head><body>
  <h1>Pickup Manifest</h1>
  <p>Generated ${new Date().toLocaleString()} · ${shipments.length} shipment${shipments.length === 1 ? '' : 's'}</p>
  <table>
    <thead><tr>
      <th>ID</th><th>Vendor Order</th><th>Customer</th><th>Tracking</th>
      <th>Provider</th><th>Courier</th><th>Status</th><th>Created</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <script>window.onload = () => window.print();</script>
</body></html>`

  // Open the manifest in a new window and trigger the print dialog so the user
  // can save it as a PDF (no .html file is left behind).
  const printWindow = window.open('', '_blank', 'noopener,noreferrer')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.onload = () => {
      printWindow.print()
    }
    // Some browsers don't fire onload for document.write; fall back to a timeout.
    setTimeout(() => {
      try {
        printWindow.print()
      } catch {
        /* ignore */
      }
    }, 250)
    return
  }

  // Popup blocked: fall back to downloading the file.
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `pickup-manifest-${Date.now()}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function VendorShipmentsPage() {
  const { t } = useTranslation()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<number[]>([])

  const { data, isLoading, error, refetch } = useVendorShipments({
    page,
    per_page: 15,
    status: status || undefined,
    search: search || undefined,
  })
  const manifestMutation = useGenerateVendorShipmentManifest()

  const shipments = useMemo(() => {
    const base: ShipmentCardData[] = data?.data ?? []
    const term = status.toLowerCase().replace(/_/g, ' ')
    const q = search.toLowerCase()
    return base.filter((s) => {
      const matchesStatus =
        !status || s.status === status || (s.status_label ?? s.status.replace(/_/g, ' ')).toLowerCase() === term
      const matchesSearch =
        !q ||
        `${s.tracking_number} ${s.provider} ${s.courier_name ?? ''} ${s.vendor_order?.vendor_order_number ?? ''} ${s.order?.user?.name ?? ''}`
          .toLowerCase()
          .includes(q)
      return matchesStatus && matchesSearch
    })
  }, [data, search, status])

  const stats = useMemo(() => {
    return {
      total: shipments.length,
      inTransit: shipments.filter((s) => ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'PICKUP_SCHEDULED', 'PICKUP_REQUESTED'].includes(s.status)).length,
      delivered: shipments.filter((s) => s.status === 'DELIVERED').length,
      issues: shipments.filter((s) => ['CANCELLED', 'FAILED', 'REATTEMPTING'].includes(s.status)).length,
    }
  }, [shipments])

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-transparent bg-gradient-to-r from-amber-600 via-amber-600 to-yellow-600 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
              <Truck className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-2xl font-bold">{t('Shipments')}</h1>
              <p className="text-sm text-white/80">{t('Track every order from your store in one place.')}</p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            className="border-0 bg-white/15 text-white hover:bg-white/25 hover:text-white"
          >
            <RefreshCcw className="mr-1 h-4 w-4" /> {t('Refresh')}
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: t('Shipments'), value: stats.total, icon: Truck },
            { label: t('In transit'), value: stats.inTransit, icon: Wrench },
            { label: t('Delivered'), value: stats.delivered, icon: CircleCheck },
            { label: t('Needs attention'), value: stats.issues, icon: CircleX },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur">
              <s.icon className="h-4 w-4 text-white/80" />
              <p className="mt-1.5 text-xl font-bold">{s.value}</p>
              <p className="text-xs text-white/75">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Search tracking, courier, order...')}
            className="w-72 pl-8"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-48">
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
        {(status || search) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setStatus('')
              setSearch('')
              setPage(1)
            }}
          >
            <X className="mr-1 h-4 w-4" /> {t('Clear')}
          </Button>
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-primary bg-primary/5 px-4 py-3">
          <p className="text-sm font-medium">
            {selected.length} shipment{selected.length === 1 ? '' : 's'} selected
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              disabled={manifestMutation.isPending}
              onClick={() => {
                const selectedShipments = shipments.filter((s) => selected.includes(s.id))
                manifestMutation.mutate(selected, {
                  onSuccess: () => setSelected([]),
                  onError: (err) => {
                    const message = (err as Error)?.message ?? ''
                    // In local/dev mode Shiprocket isn't available, so generate a
                    // downloadable manifest client-side instead of failing silently.
                    if (/local mode/i.test(message)) {
                      downloadLocalManifest(selectedShipments)
                      setSelected([])
                      manifestMutation.reset()
                    }
                  },
                })
              }}
            >
              <Files className="mr-1 h-4 w-4" />
              {manifestMutation.isPending ? 'Generating...' : 'Download pickup manifest'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelected([])
                manifestMutation.reset()
              }}
            >
              {t('Clear')}
            </Button>
          </div>
        </div>
      )}
      {manifestMutation.error ? (
        <p className="text-sm text-destructive">
          {(manifestMutation.error as Error).message}
        </p>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <ApiError error={error} onRetry={refetch} />
      ) : shipments.length === 0 ? (
        <div className="rounded-2xl border bg-background py-16 text-center">
          <Truck className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">{t('No shipments found.')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('Try adjusting your search or filters.')}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setStatus('')
              setSearch('')
            }}
          >
            {t('Clear filters')}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shipments.map((shipment) => (
              <ShipmentCard
                key={shipment.id}
                shipment={shipment}
                selected={selected.includes(shipment.id)}
                onToggleSelect={(id) =>
                  setSelected((prev) =>
                    prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
                  )
                }
              />
            ))}
          </div>
          {data && data.data && data.data.length > 0 && (
            <div className="px-4 py-2">
              <PaginationFooter data={data} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  )
}