import { useMemo, useState } from 'react'
import {
  Banknote,
  BarChart3,
  CalendarDays,
  Download,
  IndianRupee,
  Package,
  Percent,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ApiError, EmptyState } from '@/components/common/admin'
import { useVendorReport } from '@/hooks/useVendor'
import { getVendorReportExportUrl } from '@/services/vendor'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { VendorReportType } from '@/types'
import { useTranslation } from 'react-i18next'

type StatFormat = 'currency' | 'count'

interface StatMeta {
  key: string
  label: string
  format: StatFormat
}

interface ReportMeta {
  label: string
  icon: LucideIcon
  gradient: string
  description: string
  stats: StatMeta[]
}

const REPORT_META: Record<VendorReportType, ReportMeta> = {
  sales: {
    label: 'Sales',
    icon: IndianRupee,
    gradient: 'from-emerald-400 to-teal-600',
    description: 'Revenue generated from your orders',
    stats: [
      { key: 'total_orders', label: 'Orders', format: 'count' },
      { key: 'total_revenue', label: 'Revenue', format: 'currency' },
      { key: 'total_items', label: 'Items sold', format: 'count' },
    ],
  },
  orders: {
    label: 'Orders',
    icon: ShoppingBag,
    gradient: 'from-amber-400 to-amber-600',
    description: 'Every line item across your orders',
    stats: [
      { key: 'total_items', label: 'Items sold', format: 'count' },
      { key: 'gross', label: 'Gross sales', format: 'currency' },
    ],
  },
  products: {
    label: 'Products',
    icon: Package,
    gradient: 'from-orange-400 to-orange-600',
    description: 'How your products are performing',
    stats: [
      { key: 'total_items', label: 'Units sold', format: 'count' },
      { key: 'gross', label: 'Gross sales', format: 'currency' },
    ],
  },
  commission: {
    label: 'Commission',
    icon: Percent,
    gradient: 'from-amber-400 to-orange-600',
    description: 'Platform commission you earned',
    stats: [{ key: 'total_commission', label: 'Commission earned', format: 'currency' }],
  },
  wallet: {
    label: 'Wallet',
    icon: Wallet,
    gradient: 'from-yellow-400 to-orange-600',
    description: 'Money flowing through your wallet',
    stats: [{ key: 'total_volume', label: 'Wallet volume', format: 'currency' }],
  },
  payouts: {
    label: 'Payouts',
    icon: Banknote,
    gradient: 'from-rose-400 to-red-600',
    description: 'Payouts made to your bank account',
    stats: [{ key: 'total_payouts', label: 'Payout total', format: 'currency' }],
  },
  returns: {
    label: 'Returns',
    icon: RotateCcw,
    gradient: 'from-teal-400 to-emerald-600',
    description: 'Return requests against your items',
    stats: [{ key: 'total_returns', label: 'Returns count', format: 'count' }],
  },
}

const COLUMN_LABELS: Record<string, string> = {
  id: 'ID',
  order_id: 'Order ID',
  order_number: 'Order number',
  vendor_order_number: 'Vendor order',
  product_id: 'Product ID',
  product_name: 'Product',
  quantity: 'Qty',
  unit_price: 'Unit price',
  total: 'Total',
  subtotal: 'Subtotal',
  amount: 'Amount',
  status: 'Status',
  order_status: 'Order status',
  payment_status: 'Payment',
  created_at: 'Date',
  customer_name: 'Customer',
  customer_email: 'Email',
  commission: 'Commission',
  reason: 'Reason',
}

const DATE_FIELDS = ['created_at', 'updated_at', 'requested_at', 'paid_at']
const MONEY_FIELDS = ['total', 'subtotal', 'unit_price', 'amount', 'commission', 'shipping_charge', 'tax', 'discount', 'gross']
const STATUS_FIELDS = ['status', 'order_status', 'payment_status']

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  DELIVERED: 'success',
  COMPLETED: 'success',
  PAID: 'success',
  REFUNDED: 'success',
  PENDING: 'warning',
  PROCESSING: 'warning',
  RETURN_REQUESTED: 'warning',
  FAILED: 'destructive',
  CANCELLED: 'destructive',
  REJECTED: 'destructive',
}

function formatCell(key: string, value: unknown) {
  if (value == null || value === '') return '—'
  if (DATE_FIELDS.includes(key)) return formatDateTime(String(value))
  if (MONEY_FIELDS.includes(key)) {
    const num = Number(value)
    if (Number.isFinite(num)) return formatCurrency(num)
  }
  return String(value)
}

function formatStat(value: unknown, format: StatFormat): string {
  const num = Number(value)
  if (!Number.isFinite(num)) return String(value ?? '—')
  return format === 'currency' ? formatCurrency(num) : num.toLocaleString('en-IN')
}

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function KpiTile({
  meta,
  summary,
}: {
  meta: ReportMeta
  summary: Record<string, number>
}) {
  const present = meta.stats.filter((s) => summary[s.key] != null)

  if (present.length === 0) {
    return (
      <div className="rounded-2xl border bg-background p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r ${meta.gradient} text-white shadow`}
          >
            <meta.icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {meta.label}
            </p>
            <p className="text-2xl font-extrabold tracking-tight">—</p>
          </div>
        </div>
      </div>
    )
  }

  if (present.length === 1) {
    return (
      <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
        <div className={`h-1 bg-gradient-to-r ${meta.gradient}`} />
        <div className="p-5">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r ${meta.gradient} text-white shadow`}
            >
              <meta.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {present[0].label}
              </p>
              <p className="truncate text-2xl font-extrabold tracking-tight">
                {formatStat(summary[present[0].key], present[0].format)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            {meta.description}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
      <div className={`h-1 bg-gradient-to-r ${meta.gradient}`} />
      <div className="p-5">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r ${meta.gradient} text-white shadow`}
          >
            <meta.icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {meta.label}
            </p>
            <p className="truncate text-lg font-semibold text-muted-foreground">
              {formatStat(summary[present[0].key], present[0].format)}
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {present[1] ? (
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {present[1].label}
              </span>
              <span className="text-sm font-bold">
                {formatStat(summary[present[1].key], present[1].format)}
              </span>
            </div>
          ) : null}
          {present[2] ? (
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {present[2].label}
              </span>
              <span className="text-sm font-bold">
                {formatStat(summary[present[2].key], present[2].format)}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function DailyChart({ data }: { data: Record<string, number> }) {
  const { t } = useTranslation()
  const entries = useMemo<[string, number][]>(
    () => Object.entries(data).sort(([a], [b]) => (a < b ? -1 : 1)),
    [data],
  )

  if (entries.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        {t('No daily data in this range.')}
      </div>
    )
  }

  const max = Math.max(...entries.map(([, v]) => v), 1)

  return (
    <div className="flex h-44 items-end gap-1.5">
      {entries.map(([day, value]) => (
        <div
          key={day}
          title={`${day}: ${value.toLocaleString('en-IN')}`}
          className="group flex min-w-0 flex-1 flex-col items-center gap-1"
        >
          <span className="text-[10px] font-medium text-muted-foreground opacity-0 transition group-hover:opacity-100">
            {value.toLocaleString('en-IN')}
          </span>
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-primary/70 to-primary transition group-hover:from-primary group-hover:to-primary/70"
            style={{
              height: `${Math.max((value / max) * 100, 6)}%`,
              minHeight: 4,
            }}
          />
          <span className="max-w-full truncate text-[10px] text-muted-foreground">
            {day.slice(5)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function VendorReportsPage() {
  const { t } = useTranslation()
  const [type, setType] = useState<VendorReportType>('sales')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [limit, setLimit] = useState('500')

  const filters = {
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    limit: Number(limit) || 500,
    by_day: true,
  }

  const { data, isLoading, isError, refetch } = useVendorReport(type, filters)
  const meta = REPORT_META[type]

  const exportUrl = getVendorReportExportUrl(type, {
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  })

  const summary = (data?.summary ?? {}) as Record<string, number> & { by_day?: Record<string, number> }
  const hasFilters = Boolean(from || to)

  const applyPreset = (days: number) => {
    setFrom(isoDaysAgo(days))
    setTo(isoDaysAgo(0))
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-amber-600 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
              <BarChart3 className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold">{t('Reports')}</h1>
              <p className="text-sm text-white/80">{t('Analyze your sales, orders, commission, and payouts.')}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="secondary" size="sm" className="border-0 bg-white/15 text-white hover:bg-white/25 hover:text-white">
              <a href={exportUrl} target="_blank" rel="noreferrer" download>
                <Download className="mr-1 h-4 w-4" /> {t('Export CSV')}
              </a>
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => refetch()}
              title={t('Refresh')}
              className="border-0 bg-white/15 text-white hover:bg-white/25 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: `${meta.label} report`, value: data?.total ?? 0, sub: 'records' },
            { label: t('Orders'), value: summary.total_orders ?? 0, sub: 'placed' },
            { label: t('Items'), value: summary.total_items ?? 0, sub: 'sold' },
            { label: t('Snapshot'), value: hasFilters ? 'Filtered' : 'All time', sub: meta.label.toLowerCase() },
          ].map((s, i) => (
            <div key={i} className="rounded-xl bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur">
              <p className="text-xl font-bold">{typeof s.value === 'number' ? s.value.toLocaleString('en-IN') : s.value}</p>
              <p className="text-xs text-white/75">
                {s.label} · {s.sub}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-background p-3 shadow-sm">
        <Select value={type} onValueChange={(v) => setType(v as VendorReportType)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(REPORT_META).map(([value, r]) => (
              <SelectItem key={value} value={value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <CalendarDays className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-44 pl-8"
            aria-label={t('From date')}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground">{t('to')}</span>
        <div className="relative">
          <CalendarDays className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-44 pl-8"
            aria-label={t('To date')}
          />
        </div>

        <div className="flex items-center gap-1">
          {[
            { label: '7d', days: 7 },
            { label: '30d', days: 30 },
            { label: '90d', days: 90 },
          ].map((p) => (
            <Button key={p.days} variant="ghost" size="sm" onClick={() => applyPreset(p.days)}>
              {p.label}
            </Button>
          ))}
        </div>

        <Select value={limit} onValueChange={setLimit}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="100">{t('100 rows')}</SelectItem>
            <SelectItem value="500">{t('500 rows')}</SelectItem>
            <SelectItem value="1000">{t('1000 rows')}</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setFrom('')
              setTo('')
            }}
          >
            <X className="mr-1 h-4 w-4" /> {t('Clear')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <ApiError error={{ message: t('Could not load report.') }} onRetry={refetch} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <KpiTile meta={meta} summary={summary as Record<string, number>} />
            <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
              <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-600" />
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-400 to-teal-600 text-white shadow">
                    <BarChart3 className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t('Records')}
                    </p>
                    <p className="truncate text-2xl font-extrabold tracking-tight">
                      {(data?.total ?? 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {meta.description} · limited to {Number(limit).toLocaleString('en-IN')} rows
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
              <div className="h-1 bg-gradient-to-r from-yellow-400 to-orange-600" />
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-yellow-400 to-orange-600 text-white shadow">
                    <CalendarDays className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t('Date range')}
                    </p>
                    <p className="truncate text-lg font-semibold">
                      {hasFilters ? `${from} → ${to}` : 'All time'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {t('Tip: use presets to compare recent performance')}
                </div>
              </div>
            </div>
          </div>

          {meta.label !== 'Products' && summary.by_day ? (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5 text-primary" /> {t('Daily trend')}
                </CardTitle>
                <Badge variant="outline">{Object.keys(summary.by_day).length} days</Badge>
              </CardHeader>
              <CardContent>
                <DailyChart data={summary.by_day} />
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingBag className="h-5 w-5 text-primary" /> {meta.label} records
              </CardTitle>
              <Badge variant="secondary">{(data?.total ?? 0).toLocaleString('en-IN')}</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {!data || data.items.length === 0 ? (
                <EmptyState message="No records in this report." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        {Object.keys(data.items[0]).map((key) => (
                          <th key={key} className="whitespace-nowrap px-4 py-3 font-semibold">
                            {COLUMN_LABELS[key] ?? key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((item, i) => (
                        <tr
                          key={i}
                          className="border-b transition-colors hover:bg-muted/40 last:border-0"
                        >
                          {Object.entries(item).map(([key, value]) => (
                            <td
                              key={key}
                              className={`max-w-[240px] truncate px-4 py-2.5 ${
                                key === 'product_name' || key === 'customer_name' || key === 'order_number'
                                  ? 'font-medium text-foreground'
                                  : 'text-muted-foreground'
                              }`}
                              title={String(value ?? '')}
                            >
                              {STATUS_FIELDS.includes(key) && typeof value === 'string' ? (
                                <Badge variant={STATUS_BADGE[value] ?? 'secondary'} className="whitespace-nowrap">
                                  {formatCell(key, value)}
                                </Badge>
                              ) : (
                                formatCell(key, value)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}