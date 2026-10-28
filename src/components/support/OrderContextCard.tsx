import { Link } from 'react-router-dom'
import { Package, ReceiptText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { SupportConversation } from '@/types'
import { Badge } from '@/components/ui/badge'
import { assetUrl } from '@/lib/assets'
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

function TotalsRow({
  label,
  value,
  negative = false,
  bold = false,
}: {
  label: string
  value: number
  negative?: boolean
  bold?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className={bold ? 'font-semibold' : 'text-slate-500'}>{label}</dt>
      <dd className={bold ? 'font-bold' : negative ? 'font-medium text-emerald-600' : 'font-medium'}>
        {negative && value > 0 ? '-' : ''}
        {formatCurrency(value)}
      </dd>
    </div>
  )
}

interface OrderContextCardProps {
  order: NonNullable<SupportConversation['order']>
  /** Where the "view full order" link should go; renders the number as plain text when absent. */
  orderHref?: string | null
}

/**
 * The order-details card pinned above the transcript of an order query. Both
 * the admin and the vendor read the same card, so either side can see the item
 * lines and totals they are being asked about without leaving the thread.
 */
export function OrderContextCard({ order, orderHref }: OrderContextCardProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-semibold text-slate-800">
            <ReceiptText className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            {orderHref ? (
              <Link
                to={orderHref}
                className="truncate text-primary hover:underline"
                title={t('View full order')}
              >
                {t('Order')} #{order.order_number}
              </Link>
            ) : (
              <span className="truncate">
                {t('Order')} #{order.order_number}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDateTime(order.created_at)}
            {order.customer?.name ? ` · ${order.customer.name}` : ''}
          </p>
        </div>
        <Badge variant={orderBadgeVariant(order.order_status)}>
          {tStatus(t, order.order_status)}
        </Badge>
      </div>

      {order.items && order.items.length > 0 && (
        <ul className="mt-2 space-y-1.5 border-t border-slate-200 pt-2">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded border bg-white">
                {item.product_image ? (
                  <img
                    src={assetUrl(item.product_image)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-4 w-4 text-slate-400" aria-hidden="true" />
                )}
              </div>
              <span className="min-w-0 flex-1 truncate">{item.product_name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {item.quantity}×
              </span>
              <span className="shrink-0 font-medium">{formatCurrency(item.total)}</span>
            </li>
          ))}
        </ul>
      )}

      <dl className="mt-2 space-y-1 border-t border-slate-200 pt-2 text-xs">
        <TotalsRow label={t('Subtotal')} value={Number(order.subtotal ?? 0)} />
        <TotalsRow label={t('Shipping')} value={Number(order.shipping_charge ?? 0)} />
        {Number(order.discount ?? 0) > 0 && (
          <TotalsRow label={t('Discount')} value={Number(order.discount)} negative />
        )}
        {Number(order.cod_charge ?? 0) > 0 && (
          <TotalsRow label={t('COD charge')} value={Number(order.cod_charge)} />
        )}
        {Number(order.fees_total ?? 0) > 0 && (
          <TotalsRow label={t('Product fees')} value={Number(order.fees_total)} />
        )}
        {Number(order.tax ?? 0) > 0 && <TotalsRow label={t('Tax')} value={Number(order.tax)} />}
        <TotalsRow
          label={t('Total')}
          value={Number(order.total ?? 0) + Number(order.wallet_amount ?? 0)}
          bold
        />
      </dl>
    </div>
  )
}

export default OrderContextCard