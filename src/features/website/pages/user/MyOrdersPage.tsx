import { Link } from 'react-router-dom'
import {
  ChevronRight,
  Package,
} from 'lucide-react'
import { useMyOrders } from '@/hooks/useOrders'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AccountSubPageHeader } from '@/components/common/AccountSubPageHeader'
import { formatCurrency, formatDateTime, orderGrandTotal } from '@/utils/format'
import type { Order } from '@/types'
import { useTranslation } from 'react-i18next'
import { tStatus } from '@/i18n/status'

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'> = {
  DELIVERED: 'success',
  SHIPPED: 'success',
  CANCELLED: 'destructive',
  REFUNDED: 'secondary',
  RETURNED: 'secondary',
  PLACED: 'secondary',
  CONFIRMED: 'warning',
  PROCESSING: 'warning',
  PACKED: 'warning',
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export function MyOrdersPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useMyOrders(true)

  const orders = data?.data ?? []
  const deliveredCount = orders.filter((o) => o.order_status === 'DELIVERED').length
  const cancelledCount = orders.filter((o) => o.order_status === 'CANCELLED').length
  const totalReturns = orders.filter((o) => o.order_status === 'RETURNED' || o.order_status === 'REFUNDED').length

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <AccountSubPageHeader
        icon={Package}
        title={t('My Orders')}
        subtitle={t('Track and manage all of your orders in one place.')}
        actions={
          orders.length > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {t('{{count}} orders', { count: orders.length })}
            </span>
          ) : undefined
        }
      />

      {orders.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label={t('Total orders')} value={orders.length} />
          <StatCard label={t('Delivered')} value={deliveredCount} />
          <StatCard label={t('Cancelled')} value={cancelledCount} />
          <StatCard label={t('Total Returns')} value={totalReturns} />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order: Order) => (
            <Card key={order.id} className="overflow-hidden transition-all hover:shadow-md">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link
                      to={`/account/orders/${order.id}`}
                      className="font-semibold transition-colors hover:text-primary hover:underline"
                    >
                      {order.order_number}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(order.created_at)} · {t('{{count}} items', { count: order.items.length })}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold">{formatCurrency(orderGrandTotal(order))}</span>
                    <Badge variant={STATUS_BADGE[order.order_status] ?? 'secondary'}>
                      {tStatus(t, order.order_status)}
                    </Badge>
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/account/orders/${order.id}`}>
                        {t('View')} <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Package className="h-8 w-8" />
            </div>
            <p className="font-display text-xl font-bold">{t('No orders yet')}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {t('Start browsing and your orders will show up here.')}
            </p>
            <Button asChild className="mt-5">
              <Link to="/shop">{t('Start Shopping')}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}