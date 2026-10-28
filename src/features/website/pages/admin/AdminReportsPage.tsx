import { useState } from 'react'
import { BarChart3, Download, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ApiError, EmptyState } from '@/components/common/admin'
import { getAdminReportExportUrl, type AdminReportType } from '@/services/admin'
import { useAdminReport } from '@/hooks/useAdmin'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { useTranslation } from 'react-i18next'

const REPORT_TYPES: { value: AdminReportType; label: string; summaryLabel: string }[] = [
  { value: 'sales', label: 'Sales', summaryLabel: 'Revenue' },
  { value: 'orders', label: 'Orders', summaryLabel: 'Gross' },
  { value: 'products', label: 'Products', summaryLabel: 'Gross' },
  { value: 'vendors', label: 'Vendors', summaryLabel: 'Vendors count' },
  { value: 'customers', label: 'Customers', summaryLabel: 'Customers count' },
  { value: 'commission', label: 'Commission', summaryLabel: 'Commission earned' },
  { value: 'payments', label: 'Payments', summaryLabel: 'Payment volume' },
  { value: 'refunds', label: 'Refunds', summaryLabel: 'Refund total' },
  { value: 'returns', label: 'Returns', summaryLabel: 'Returns count' },
  { value: 'shipping', label: 'Shipping', summaryLabel: 'Shipping volume' },
  { value: 'wallet', label: 'Wallet', summaryLabel: 'Wallet volume' },
  { value: 'payouts', label: 'Payouts', summaryLabel: 'Payout total' },
]

const COLUMN_LABELS: Record<string, string> = {
  id: 'ID',
  order_id: 'Order ID',
  order_number: 'Order number',
  vendor_order_number: 'Vendor order',
  vendor_id: 'Vendor ID',
  store_name: 'Store',
  user_id: 'User ID',
  customer_id: 'Customer ID',
  customer_name: 'Customer',
  customer_email: 'Email',
  product_id: 'Product ID',
  product_name: 'Product',
  quantity: 'Qty',
  unit_price: 'Unit price',
  total: 'Total',
  subtotal: 'Subtotal',
  amount: 'Amount',
  commission: 'Commission',
  status: 'Status',
  payment_status: 'Payment',
  shipping_charge: 'Shipping',
  created_at: 'Date',
  reason: 'Reason',
}

function formatCell(key: string, value: unknown) {
  if (value == null || value === '') return '—'
  if (key === 'created_at' || key === 'updated_at' || key === 'requested_at' || key === 'paid_at') {
    return formatDateTime(String(value))
  }
  if (
    ['total', 'subtotal', 'unit_price', 'amount', 'commission', 'shipping_charge', 'tax', 'discount', 'net_amount'].includes(
      key,
    )
  ) {
    const num = Number(value)
    if (Number.isFinite(num)) return formatCurrency(num)
  }
  return String(value)
}

function summaryLabel(key: string): string {
  return (
    {
      total_orders: 'Total orders',
      total_items: 'Total items',
      total_revenue: 'Revenue',
      gross: 'Gross',
      total_commission: 'Commission',
      total_volume: 'Volume',
      total_payouts: 'Payouts',
      total_returns: 'Returns',
      total_refunds: 'Refunds',
      total_shipping: 'Shipping',
      total_vendors: 'Vendors',
      total_customers: 'Customers',
      total_cancelled: 'Cancelled',
      total_units: 'Units',
    }[key] ?? 'Total'
  )
}

function isCountKey(key: string): boolean {
  return ['total_orders', 'total_items', 'total_returns', 'total_refunds', 'total_vendors', 'total_customers', 'total_cancelled', 'total_units'].includes(key)
}

export function AdminReportsPage() {
  const { t } = useTranslation()
  const [type, setType] = useState<AdminReportType>('sales')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [vendorId, setVendorId] = useState('')

  const filters = {
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(vendorId ? { vendor_id: Number(vendorId) } : {}),
  }

  const { data, isLoading, isError, refetch } = useAdminReport(type, filters)
  const current = REPORT_TYPES.find((r) => r.value === type)

  const exportUrl = getAdminReportExportUrl(type, filters)

  const summaryEntries = data && data.summary ? Object.entries(data.summary) : []
  const hasFilters = Boolean(from || to || vendorId)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <BarChart3 className="h-6 w-6 text-primary" /> {t('Reports')}
          </h1>
          <p className="text-muted-foreground">
            {t('Analyze sales, orders, vendors, customers, commissions, and more.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={exportUrl} target="_blank" rel="noreferrer" download>
              <Download className="mr-1 h-4 w-4" /> {t('Export CSV')}
            </a>
          </Button>
          <Button variant="outline" size="icon" onClick={() => refetch()} title={t('Refresh')}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={type} onValueChange={(v) => setType(v as AdminReportType)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REPORT_TYPES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {t(r.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-40"
          aria-label={t('From date')}
        />
        <span className="text-xs text-muted-foreground">{t('to')}</span>
        <Input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-40"
          aria-label={t('To date')}
        />
        <Input
          type="number"
          min="1"
          value={vendorId}
          onChange={(e) => setVendorId(e.target.value)}
          className="w-32"
          placeholder={t('Vendor ID')}
          aria-label={t('Vendor ID')}
        />
        {hasFilters && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setFrom('')
              setTo('')
              setVendorId('')
            }}
          >
            <X className="mr-1 h-4 w-4" /> {t('Clear')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <ApiError error={{ message: t('Could not load report.') }} onRetry={refetch} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summaryEntries.length > 0 ? (
              summaryEntries.filter(([k]) => k !== 'by_day').map(([key, value]) => (
                <Card key={key}>
                  <CardContent className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t(summaryLabel(key))}
                    </p>
                    <p className="mt-1 text-2xl font-extrabold tracking-tight">
                      {typeof value === 'number' && !isCountKey(key)
                        ? formatCurrency(value)
                        : typeof value === 'number' && Number.isFinite(value)
                          ? value.toLocaleString()
                          : String(value)}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {current?.summaryLabel ? t(current.summaryLabel) : t('Summary')}
                  </p>
                  <p className="mt-1 text-2xl font-extrabold tracking-tight">—</p>
                </CardContent>
              </Card>
            )}
          </div>

          {data && data.summary && data.summary.by_day && typeof data.summary.by_day === 'object' ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('Daily breakdown')}</CardTitle>
              </CardHeader>
              <CardContent className="max-h-64 space-y-1 overflow-y-auto text-sm">
                {Object.entries(data.summary.by_day as Record<string, number>)
                  .sort(([a], [b]) => (a < b ? -1 : 1))
                  .map(([day, count]) => (
                    <div key={day} className="flex justify-between border-b py-1 last:border-0">
                      <span className="text-muted-foreground">{day}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">
                {current?.label ? t(current.label) : ''} — {t('{{count}} records', { count: data?.total ?? 0 })}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!data || data.items.length === 0 ? (
                <EmptyState message={t('No records in this report.')} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        {Object.keys(data.items[0]).map((key) => (
                          <th key={key} className="px-4 py-3 font-medium">
                            {COLUMN_LABELS[key] ? t(COLUMN_LABELS[key]) : key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((item, i) => (
                        <tr key={i} className="border-b last:border-0">
                          {Object.entries(item).map(([key, value]) => (
                            <td
                              key={key}
                              className="max-w-[240px] truncate px-4 py-2.5 text-muted-foreground"
                              title={String(value ?? '')}
                            >
                              {formatCell(key, value)}
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