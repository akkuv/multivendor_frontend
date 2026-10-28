import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { SupportConversation } from '@/types'
import { assetUrl } from '@/lib/assets'
import { formatCurrency } from '@/utils/format'
import { tStatus } from '@/i18n/status'

/** Which panel is showing the thread, so purchase links target the right order page. */
export type ProductQueryContextRole = 'admin' | 'vendor' | 'customer'

interface ProductQueryContextProps {
  conversation: SupportConversation | null
  role: ProductQueryContextRole
}

/**
 * The product and purchase context bar above an open product-query thread:
 * the thumbnail, price and store with a link back to the live product page,
 * plus the asking customer's orders in which the product was bought. This
 * mirrors the "view full order" context an order-query thread shows, and it is
 * reusing existing strings only.
 */
export function ProductQueryContext({ conversation, role }: ProductQueryContextProps) {
  const { t } = useTranslation()
  const product = conversation?.product
  if (!product) return null

  const purchases = conversation.product_purchases ?? []

  const orderPath = (purchaseId: number, vendorOrderId?: number | null): string | null => {
    if (role === 'customer') return `/account/orders/${purchaseId}`
    if (vendorOrderId) {
      return role === 'admin' ? `/admin/vendor-orders/${vendorOrderId}` : `/vendor/orders/${vendorOrderId}`
    }
    return null
  }

  const image = product.images[0] ? assetUrl(product.images[0]) : ''

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#e6dcc4] bg-white p-3 shadow-[0_10px_30px_-24px_rgba(23,20,14,0.35)]">
      {image ? (
        <img
          src={image}
          alt={product.name}
          className="h-14 w-14 shrink-0 rounded-lg border border-[#e6dcc4] object-cover"
        />
      ) : null}

      <div className="min-w-0 flex-1">
        <Link
          to={`/product/${product.slug}`}
          title={t('View product details')}
          className="inline-flex max-w-full items-center gap-1.5 font-semibold text-primary hover:underline"
        >
          <span className="truncate">{product.name}</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </Link>
        <p className="truncate text-sm text-muted-foreground">
          {typeof product.price === 'number' ? (
            <span className="text-slate-700">
              {formatCurrency(product.price)}
              {typeof product.mrp === 'number' && product.mrp > product.price ? (
                <span className="ml-1.5 text-xs line-through">{formatCurrency(product.mrp)}</span>
              ) : null}
            </span>
          ) : null}
          {product.vendor ? (
            <span>
              {' · '}
              {t('Sold by {{store}}', { store: product.vendor.store_name })}
            </span>
          ) : null}
        </p>
      </div>

      {purchases.length > 0 ? (
        <div className="flex flex-col items-end gap-1">
          {purchases.map((purchase) => {
            const path = orderPath(purchase.id, purchase.vendor_order_id)
            return (
              <p key={purchase.id} className="text-xs text-muted-foreground">
                {path ? (
                  <Link
                    to={path}
                    title={t('View full order')}
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    #{purchase.order_number}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </Link>
                ) : (
                  <span className="font-medium">#{purchase.order_number}</span>
                )}
                {' · '}
                {tStatus(t, purchase.order_status)}
              </p>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export default ProductQueryContext