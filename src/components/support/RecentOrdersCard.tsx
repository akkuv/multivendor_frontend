import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { SupportConversation } from '@/types'
import { Badge } from '@/components/ui/badge'
import { tStatus } from '@/i18n/status'
import { formatCurrency, formatDateTime } from '@/utils/format'

const ORDER_BADGE_VARIANTS: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  DELIVERED: 'success',
  SHIPPED: 'success',
  PLACED: 'secondary',
  CONFIRMED: 'secondary',
  PROCESSING: 'warning',
  PACKED: 'warning',
  CANCELLED: 'destructive',
  RETURNED: 'destructive',
  REFUNDED: 'warning',
}

function orderBadgeVariant(status: string) {
  return ORDER_BADGE_VARIANTS[status] ?? 'secondary'
}

type RecentOrder = NonNullable<SupportConversation['recent_orders']>[number]

interface RecentOrdersCardProps {
  orders: NonNullable<SupportConversation['recent_orders']>
  /** Resolves an order to its detail page; renders the number as plain text when null. */
  orderHref?: (order: RecentOrder) => string | null
}

/**
 * The customer's recent orders, shown above the first message of their support
 * chat so both the customer and the admin can see which orders the question is
 * about. The same card renders on both sides of the conversation.
 */
export function RecentOrdersCard({ orders, orderHref }: RecentOrdersCardProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
        {t('Recent orders')}
      </p>

      <ul className="mt-2 space-y-2">
        {orders.map((order) => {
          const href = orderHref?.(order) ?? null

          return (
            <li key={order.id} className="rounded-lg border bg-white p-2.5">
              <div className="flex items-center justify-between gap-2">
                {href ? (
                  <Link
                    to={href}
                    className="truncate font-medium text-primary hover:underline"
                    title={t('View full order')}
                  >
                    #{order.order_number}
                  </Link>
                ) : (
                  <span className="truncate font-medium">#{order.order_number}</span>
                )}
                <Badge variant={orderBadgeVariant(order.order_status)}>
                  {tStatus(t, order.order_status)}
                </Badge>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateTime(order.created_at)} · {formatCurrency(Number(order.total ?? 0))}
              </p>

              {order.items && order.items.length > 0 && (
                <p className="mt-1 truncate text-xs text-slate-500">
                  {order.items.map((item) => `${item.quantity}× ${item.product_name}`).join(', ')}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default RecentOrdersCard