import { useState } from 'react'
import { assetUrl } from '@/lib/assets'
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Eye,
  FileQuestion,
  PackageX,
  RefreshCw,
  RotateCcw,
  Search,
  Truck,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ApiError } from '@/components/common/admin'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useVendorReturn, useVendorReturns, useUpdateVendorReturnStatus } from '@/hooks/useVendor'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { VendorReturn, VendorReturnStatusValue } from '@/types'
import { useTranslation } from 'react-i18next'

const RETURN_STATUS_LABELS: Record<VendorReturnStatusValue, string> = {
  REQUESTED: 'Requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PICKUP_SCHEDULED: 'Pickup Scheduled',
  PICKED_UP: 'Picked Up',
  RECEIVED: 'Received',
  INSPECTING: 'Inspecting',
  APPROVED_FOR_REFUND: 'Approved for Refund',
  REFUNDED: 'Refunded',
  CLOSED: 'Closed',
}

const RETURN_STATUS_TONE: Record<VendorReturnStatusValue, string> = {
  REQUESTED: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400',
  APPROVED: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400',
  REJECTED: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400',
  PICKUP_SCHEDULED: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400',
  PICKED_UP: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400',
  RECEIVED: 'bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-400',
  INSPECTING: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400',
  APPROVED_FOR_REFUND: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/20 dark:bg-fuchsia-500/10 dark:text-fuchsia-400',
  REFUNDED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400',
  CLOSED: 'bg-slate-100 text-slate-600 ring-slate-600/20 dark:bg-slate-500/15 dark:text-slate-400',
}

const RETURN_STATUS_DOT: Record<VendorReturnStatusValue, string> = {
  REQUESTED: 'bg-amber-500',
  APPROVED: 'bg-amber-500',
  REJECTED: 'bg-rose-500',
  PICKUP_SCHEDULED: 'bg-yellow-500',
  PICKED_UP: 'bg-orange-500',
  RECEIVED: 'bg-teal-500',
  INSPECTING: 'bg-orange-500',
  APPROVED_FOR_REFUND: 'bg-fuchsia-500',
  REFUNDED: 'bg-emerald-500',
  CLOSED: 'bg-slate-500',
}

const ALL_RETURN_STATUSES = Object.keys(RETURN_STATUS_LABELS) as VendorReturnStatusValue[]

const RETURN_AMOUNT_TEXT: Record<VendorReturnStatusValue, string> = {
  REQUESTED: 'text-amber-600',
  APPROVED: 'text-amber-600',
  REJECTED: 'text-rose-600',
  PICKUP_SCHEDULED: 'text-yellow-600',
  PICKED_UP: 'text-orange-600',
  RECEIVED: 'text-teal-600',
  INSPECTING: 'text-orange-600',
  APPROVED_FOR_REFUND: 'text-fuchsia-600',
  REFUNDED: 'text-emerald-600',
  CLOSED: 'text-slate-600',
}

const ALLOWED_TRANSITIONS: Record<VendorReturnStatusValue, VendorReturnStatusValue[]> = {
  REQUESTED: ['APPROVED', 'REJECTED', 'CLOSED'],
  APPROVED: ['CLOSED'],
  REJECTED: ['CLOSED'],
  PICKUP_SCHEDULED: ['REJECTED', 'CLOSED'],
  PICKED_UP: ['CLOSED'],
  RECEIVED: ['CLOSED'],
  INSPECTING: ['REJECTED', 'CLOSED'],
  APPROVED_FOR_REFUND: ['CLOSED'],
  REFUNDED: ['CLOSED'],
  CLOSED: [],
}

function initials(name: string | undefined) {
  if (!name) return 'U'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('')
}

function StatusChip({ label, tone, dot }: { label: string; tone: string; dot?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      {label}
    </span>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  iconClass,
}: {
  label: string
  value: string
  icon: typeof Clock
  gradient: string
  iconClass: string
}) {
  return (
    <Card className="group relative overflow-hidden border-transparent bg-white/70 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:bg-card/70">
      <div className={`absolute inset-x-0 top-0 h-1 ${gradient}`} />
      <div className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClass} transition duration-300 group-hover:scale-110`}
          >
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-2.5 text-2xl font-extrabold tracking-tight">{value}</p>
      </div>
    </Card>
  )
}

function ReturnsTab() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<VendorReturnStatusValue | ''>('')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [view, setView] = useState<number | null>(null)
  const [transition, setTransition] = useState<VendorReturn | null>(null)
  const [nextStatus, setNextStatus] = useState<VendorReturnStatusValue | ''>('')
  const [notes, setNotes] = useState('')

  const { data, isLoading, isError, refetch } = useVendorReturns({
    page,
    per_page: 12,
    status: status || undefined,
    search: debounced || undefined,
  })

  const updateStatus = useUpdateVendorReturnStatus()

  const runTransition = () => {
    if (!transition || !nextStatus) return
    updateStatus.mutate(
      { id: transition.id, status: nextStatus, notes: notes || undefined },
      {
        onSuccess: () => {
          setTransition(null)
          setNextStatus('')
          setNotes('')
        },
      },
    )
  }

  const rows = data?.data ?? []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label={t('Requested')}
          value={String(rows.filter((r) => r.status === 'REQUESTED').length)}
          icon={FileQuestion}
          gradient="from-amber-400 to-orange-500"
          iconClass="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
        />
        <StatCard
          label={t('In Progress')}
          value={String(
            rows.filter((r) =>
              ['APPROVED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'RECEIVED', 'INSPECTING'].includes(
                r.status,
              ),
            ).length,
          )}
          icon={Truck}
          gradient="from-yellow-400 to-amber-600"
          iconClass="bg-yellow-100 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-400"
        />
        <StatCard
          label={t('Refunded')}
          value={String(rows.filter((r) => r.status === 'REFUNDED').length)}
          icon={CircleDollarSign}
          gradient="from-emerald-400 to-teal-600"
          iconClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
        />
        <StatCard
          label={t('Rejected / Closed')}
          value={String(rows.filter((r) => ['REJECTED', 'CLOSED'].includes(r.status)).length)}
          icon={XCircle}
          gradient="from-rose-400 to-rose-600"
          iconClass="bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t('Search by product, order or reason...')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
                window.setTimeout(() => setDebounced(e.target.value), 300)
              }}
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v === 'ALL' ? '' : (v as VendorReturnStatusValue))
              setPage(1)
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t('All statuses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('All statuses')}</SelectItem>
              {ALL_RETURN_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {RETURN_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-1 h-4 w-4" /> {t('Refresh')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <ApiError error={{ message: t('Could not load returns.') }} onRetry={refetch} />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60">
            <PackageX className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-medium">{t('No returns found')}</p>
          <p className="text-sm text-muted-foreground">
            {status || debounced ? 'Try adjusting your search or filter.' : 'Return requests will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const tone = RETURN_STATUS_TONE[r.status]
            const dot = RETURN_STATUS_DOT[r.status]
            const allowed = ALLOWED_TRANSITIONS[r.status] ?? []
            return (
              <Card
                key={r.id}
                className="group overflow-hidden border-transparent bg-white/80 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-lg dark:bg-card/70 dark:hover:border-amber-500/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                      <PackageX className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold">
                          {r.order?.order_number ? `Order #${r.order.order_number}` : `Return #${r.id}`}
                        </p>
                        <StatusChip label={RETURN_STATUS_LABELS[r.status]} tone={tone} dot={dot} />
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {r.user?.name ?? 'Customer'}
                        {r.user?.email ? ` · ${r.user.email}` : ''}
                      </p>
                      <p className="truncate text-xs text-muted-foreground/80">
                        {r.order_item?.product_name ?? 'Product'} · Qty {r.quantity} ·{' '}
                        {formatDateTime(r.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <p className={`text-lg font-extrabold tracking-tight ${RETURN_AMOUNT_TEXT[r.status]}`}>
                      {r.order_item ? formatCurrency(Number(r.order_item.total)) : formatCurrency(0)}
                    </p>
                    <Button size="sm" variant="outline" onClick={() => setView(r.id)}>
                      <Eye className="mr-1.5 h-4 w-4" /> {t('Details')}
                    </Button>
                    {allowed.length > 0 && (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm hover:from-amber-700 hover:to-orange-700"
                        onClick={() => {
                          setTransition(r)
                          setNextStatus(allowed[0])
                          setNotes('')
                        }}
                      >
                        <ArrowUpRight className="mr-1.5 h-4 w-4" /> {t('Update Status')}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
          <span>
            Page {data.current_page} of {data.last_page} ({data.total} total)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> {t('Previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.last_page}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ReturnDetailsDialog returnId={view} onClose={() => setView(null)} />

      <Dialog open={!!transition} onOpenChange={(open) => { if (!open) setTransition(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Update Return Status')}</DialogTitle>
            <DialogDescription>
              {transition ? `${RETURN_STATUS_LABELS[transition.status]} → next step` : ''}
            </DialogDescription>
          </DialogHeader>
          {transition && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('Move to status')}</label>
                <Select value={nextStatus} onValueChange={(v) => setNextStatus(v as VendorReturnStatusValue)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select next status')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(ALLOWED_TRANSITIONS[transition.status] ?? []).map((s) => (
                      <SelectItem key={s} value={s}>
                        {RETURN_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('Notes (optional)')}</label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('Internal note about this transition...')}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setTransition(null)} disabled={updateStatus.isPending}>
                  {t('Cancel')}
                </Button>
                <Button onClick={runTransition} disabled={updateStatus.isPending || !nextStatus}>
                  {updateStatus.isPending ? 'Saving...' : 'Confirm'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ReturnDetailsDialog({ returnId, onClose }: { returnId: number | null; onClose: () => void }) {
  const { t } = useTranslation()
  const { data: r, isLoading } = useVendorReturn(returnId)

  return (
    <Dialog open={returnId != null} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('Return Details')}</DialogTitle>
          <DialogDescription>{r ? RETURN_STATUS_LABELS[r.status] : ''}</DialogDescription>
        </DialogHeader>
        {isLoading || !r ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 rounded-xl ring-1 ring-border">
                <AvatarImage src={r.order_item?.product_image ?? ''} alt={r.order_item?.product_name} />
                <AvatarFallback className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-sm font-bold text-white">
                  {initials(r.order_item?.product_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-semibold">{r.order_item?.product_name ?? 'Product'}</p>
                <p className="text-sm text-muted-foreground">
                  Qty {r.quantity} · {formatCurrency(Number(r.order_item?.total ?? 0))}
                </p>
                <p className="text-xs text-muted-foreground">
                  Order #{r.order?.order_number} · {formatDateTime(r.created_at)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/40 p-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">{t('Customer')}</p>
                <p className="font-medium">{r.user?.name ?? '—'}</p>
                <p className="text-xs text-muted-foreground">{r.user?.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('Status')}</p>
                <StatusChip
                  label={RETURN_STATUS_LABELS[r.status]}
                  tone={RETURN_STATUS_TONE[r.status]}
                  dot={RETURN_STATUS_DOT[r.status]}
                />
              </div>
            </div>

            {r.reason && (
              <div className="rounded-xl border bg-muted/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('Reason')}</p>
                <p className="mt-1 text-sm">{r.reason}</p>
              </div>
            )}
            {r.description && (
              <div className="rounded-xl border bg-muted/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('Description')}</p>
                <p className="mt-1 text-sm">{r.description}</p>
              </div>
            )}
            {r.status_notes && (
              <div className="rounded-xl border bg-muted/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('Status Notes')}</p>
                <p className="mt-1 text-sm">{r.status_notes}</p>
              </div>
            )}

            {r.images && r.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {r.images.map((img, i) => (
                  <img
                    key={i}
                    src={assetUrl(img)}
                    alt={`return-${i}`}
                    className="aspect-square w-full rounded-lg border object-cover"
                  />
                ))}
              </div>
            )}

            {(() => {
              const refunds = r.refunds ?? []
              if (refunds.length === 0) return null
              return (
                <div className="rounded-xl border p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('Refunds')}
                  </p>
                  <div className="space-y-2">
                    {refunds.map((ref) => (
                      <div key={ref.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {ref.status} {ref.method ? `· ${ref.method}` : ''}
                        </span>
                        <span className="font-semibold">{formatCurrency(Number(ref.amount))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function VendorReturnsPage() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-amber-600 to-amber-700 p-6 text-white shadow-xl sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-amber-400/30 blur-2xl" />
        <div className="relative max-w-md">
          <span className="flex h-6 w-fit items-center gap-1.5 rounded-full bg-white/20 px-3 text-xs font-semibold backdrop-blur">
            <RotateCcw className="h-3.5 w-3.5" />
            {t('Returns')}
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{t('Returns Management')}</h1>
          <p className="mt-1.5 text-sm text-white/80">
            {t('Confirm, reject and track return requests on your products.')}
          </p>
        </div>
      </div>

      <ReturnsTab />
    </div>
  )
}