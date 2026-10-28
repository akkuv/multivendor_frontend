import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Banknote,
  ClipboardList,
  Package,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { assetUrl } from '@/lib/assets'
import { useAdminDashboard } from '@/hooks/useAdmin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ApiError } from '@/components/common/admin'
import { formatCurrency } from '@/utils/format'

import { useTranslation } from 'react-i18next'

const COLORS = ['#22c55e', '#d4af37', '#eab308', '#a855f7', '#f97316']

type SeriesMetric = 'sales' | 'orders'

/** Sums one numeric key across a chart series, for the card's footer total. */
function seriesTotal<T extends object>(rows: readonly T[], key: keyof T): number {
  return rows.reduce((sum, row) => sum + Number(row[key] ?? 0), 0)
}

interface Stat {
  label: string
  value: string
  icon: typeof Users
  to: string
}

function StatCard({ stat }: { stat: Stat }) {
  const { t } = useTranslation()
  const Icon = stat.icon
  return (
    <Link to={stat.to} className="block">
      <Card className="transition-colors hover:border-primary/50 hover:bg-muted/40">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{t(stat.label)}</p>
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-bold">{stat.value}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === 'PAID'
      ? 'success'
      : status === 'DELIVERED'
        ? 'success'
        : status === 'CANCELLED'
          ? 'destructive'
          : 'warning'
  return <Badge variant={variant as 'success' | 'destructive' | 'warning'}>{status}</Badge>
}

export function AdminDashboardPage() {
  const { t } = useTranslation()
  const [days, setDays] = useState(30)
  const [seriesMetric, setSeriesMetric] = useState<SeriesMetric>('sales')
  const { data, isLoading, isError, refetch } = useAdminDashboard(days)

  const navigate = useNavigate()

  // Every card links into the list that produced the number, carrying the same
  // filters the stat was counted under, so clicking a card shows exactly those rows.
  const q = (params: Record<string, string | number>) => {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      search.set(key, String(value))
    }
    return `?${search.toString()}`
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    )
  }

  if (isError || !data) {
    return <ApiError error={{ message: t('Could not load dashboard.') }} onRetry={refetch} />
  }

  const range = { created_days: days }

  const stats: Stat[] = [
    { label: t('New Customers'), value: String(data.customer_count), icon: Users, to: `/admin/users${q({ ...range, role: 'CUSTOMER' })}` },
    { label: t('New Vendors'), value: String(data.vendor_count), icon: Store, to: `/admin/vendors${q(range)}` },
    { label: t('Active Vendors'), value: String(data.active_vendors), icon: Store, to: `/admin/vendors${q({ status: 'APPROVED' })}` },
    { label: t('Pending Vendors'), value: String(data.pending_vendors), icon: Store, to: `/admin/vendors${q({ status: 'PENDING' })}` },
    { label: t('New Products'), value: String(data.product_count), icon: Package, to: `/admin/products${q(range)}` },
    { label: t('Pending Products'), value: String(data.pending_products), icon: Package, to: `/admin/products${q({ approval_status: 'PENDING_APPROVAL' })}` },
    { label: t('Orders'), value: String(data.order_count), icon: ClipboardList, to: `/admin/orders${q(range)}` },
    { label: "Today's Orders", value: String(data.today_orders), icon: ClipboardList, to: `/admin/orders${q({ created_days: 1 })}` },
    { label: t('Revenue'), value: formatCurrency(data.revenue), icon: TrendingUp, to: `/admin/orders${q({ ...range, payment_status: 'PAID' })}` },
    { label: "Today's Sales", value: formatCurrency(data.today_sales), icon: TrendingUp, to: `/admin/orders${q({ created_days: 1, payment_status: 'PAID' })}` },
    { label: t('Commission Earned'), value: formatCurrency(data.total_commission), icon: Banknote, to: `/admin/payouts${q({ tab: 'commissions', ...range })}` },
    { label: t('Vendor Payable'), value: formatCurrency(data.vendor_payable), icon: Banknote, to: `/admin/payouts${q({ tab: 'commissions', commission_status: 'SETTLED' })}` },
    { label: t('Refunds'), value: formatCurrency(data.refunds), icon: Wallet, to: `/admin/returns${q({ tab: 'refunds', ...range })}` },
    { label: t('Returns'), value: String(data.returns), icon: Package, to: `/admin/returns${q({ tab: 'returns', ...range })}` },

    { label: t('Payout Requests'), value: String(data.payout_requests), icon: Banknote, to: `/admin/payouts${q({ payout_status: 'PENDING' })}` },
  ]



  return (
    <div className="space-y-6">
      {/* Admin Stats Section */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t('Admin Dashboard')}</h1>
            <p className="text-sm text-muted-foreground">{t('Showing the last {{days}} days.', { days })}</p>
          </div>
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder={t('Range')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t('Last 7 days')}</SelectItem>
              <SelectItem value="30">{t('Last 30 days')}</SelectItem>
              <SelectItem value="90">{t('Last 90 days')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((s) => (
            <StatCard key={s.label} stat={s} />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base">{t('Sales & Orders Over Time')}</CardTitle>
                <div className="flex rounded-md border bg-background/80 p-0.5 backdrop-blur">
                  <button
                    type="button"
                    onClick={() => setSeriesMetric('sales')}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                      seriesMetric === 'sales' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t('Sales')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeriesMetric('orders')}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                      seriesMetric === 'orders' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t('Orders')}
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.sales_series}>
                  <defs>
                    <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="orders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip
                    formatter={(value, name) =>
                      name === 'sales' ? [formatCurrency(Number(value)), t('Sales')] : [Number(value), t('Orders')]
                    }
                    labelFormatter={(label) => String(label)}
                  />
                  {seriesMetric === 'sales' ? (
                    <Area type="monotone" dataKey="sales" stroke="#22c55e" fill="url(#sales)" />
                  ) : (
                    <Area type="monotone" dataKey="orders" stroke="#3b82f6" fill="url(#orders)" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {seriesMetric === 'sales'
                  ? t('Total {{amount}} in the last {{days}} days', {
                      amount: formatCurrency(seriesTotal(data.sales_series, 'sales')),
                      days,
                    })
                  : t('Total {{count}} orders in the last {{days}} days', {
                      count: seriesTotal(data.sales_series, 'orders'),
                      days,
                    })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('Commission Over Time')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.commission_series}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    formatter={(v) => [formatCurrency(Number(v)), t('Commission')]}
                    labelFormatter={(label) => String(label)}
                  />
                  <Bar
                    dataKey="commission"
                    fill="#d4af37"
                    radius={[4, 4, 0, 0]}
                    onClick={(data: any) => {
                      const label = data?.activeLabel
                      if (typeof label === 'string' || typeof label === 'number') {
                        navigate(`/admin/payouts${q({ tab: 'commissions', created_from: String(label) })}`)
                      }
                    }}
                    className="cursor-pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {t('{{amount}} commission in the last {{days}} days', {
                  amount: formatCurrency(seriesTotal(data.commission_series, 'commission')),
                  days,
                })}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('Top Vendors')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {data.top_vendors.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('No sales yet.')}</p>
              ) : (
                data.top_vendors.map((v, i) => (
                  <Link
                    key={v.vendor_id}
                    to={`/admin/vendors${q({ search: v.name })}`}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/60"
                  >
                    <span className="truncate">
                      <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                      {v.name}
                    </span>
                    <span className="font-medium">{formatCurrency(v.sales)}</span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('Top Categories')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={data.top_categories} dataKey="sales" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {data.top_categories.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-0.5">
                {data.top_categories.map((c, i) => (
                  <Link
                    key={c.category_id}
                    to={`/admin/products${q({ category_id: c.category_id, created_days: days })}`}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-xs transition-colors hover:bg-muted/60"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="truncate">{c.name}</span>
                    </span>
                    <span className="font-medium">{formatCurrency(c.sales)}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('Recent Orders')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recent_orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('No orders yet.')}</p>
              ) : (
                data.recent_orders.map((o) => (
                  <div key={o.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/orders?order_id=${o.id}`, { state: { orderId: o.id } })}
                        className="font-medium text-left hover:underline"
                      >
                        {o.order_number}
                      </button>
                      <span className="font-semibold">{formatCurrency(o.total)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{o.customer_name}</span>
                      <StatusBadge status={o.order_status} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Top Products')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.top_products.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('No sales yet.')}</p>
            ) : (
              data.top_products.map((p, i) => (
                <Link
                  key={p.product_id}
                  to={`/admin/products${q({ search: p.name })}`}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/60"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="w-4 shrink-0 text-muted-foreground">{i + 1}.</span>
                    {p.image ? (
                      <img src={assetUrl(p.image)} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover" />
                    ) : (
                      <span className="h-8 w-8 shrink-0 rounded-md bg-muted" />
                    )}
                    <span className="truncate">{p.name ?? t('Product #{{id}}', { id: p.product_id })}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-muted-foreground">{t('{{count}} sold', { count: p.units_sold })}</span>
                    <span className="font-medium">{formatCurrency(p.sales)}</span>
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
