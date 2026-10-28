import type { Notification } from '@/types'

/**
 * Where each panel's notification should take the user, plus the short action
 * label shown on the list rows and the realtime toast. The keys mirror the
 * backend `NotificationType` enum plus the two legacy custom types
 * (`order_placed`, `new_sale`). When the notification's `meta` payload carries
 * the entity that triggered it and the destination can open a specific entity,
 * the link deep-links there; otherwise it falls back to the origin list page.
 *
 * One resolver per panel: `adminNotificationTarget` (bell, list page, realtime
 * toast), `vendorNotificationTarget` (bell, list page) and
 * `customerNotificationTarget` (bell, list page).
 */
export interface NotificationTarget {
  to: string
  label: string
}

type Notifiable = Pick<Notification, 'type'> & Partial<Pick<Notification, 'meta'>>

function entityId(meta: Record<string, unknown>, key: string): number | null {
  const raw = meta[key]
  const parsed = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

/** `/path?param=<id>` when the payload carries the id, plain `/path` otherwise. */
function withIdParam(
  path: string,
  param: string,
  meta: Record<string, unknown>,
  key: string,
): string {
  const id = entityId(meta, key)
  return id == null ? path : `${path}?${param}=${id}`
}

/** `/path/<id>` when the payload carries the id, plain `/path` otherwise. */
function withPathId(path: string, meta: Record<string, unknown>, key: string): string {
  const id = entityId(meta, key)
  return id == null ? path : `${path}/${id}`
}

export function adminNotificationTarget(notification: Notifiable): NotificationTarget | null {
  const meta = notification.meta ?? {}
  switch (notification.type) {
    case 'new_vendor_registered':
      return { to: '/admin/vendors', label: 'Open vendor review' }
    case 'new_product_submitted':
      return { to: '/admin/products', label: 'Review product' }
    case 'admin_new_order':
      return { to: withIdParam('/admin/orders', 'order_id', meta, 'order_id'), label: 'Open orders' }
    case 'admin_return_request':
      return { to: '/admin/returns', label: 'Review return' }
    case 'admin_payout_request':
      return { to: '/admin/payouts', label: 'Review payout' }
    case 'admin_payment_failure':
      return { to: '/admin/payments', label: 'Open payments' }
    case 'admin_shipping_failure':
      return { to: '/admin/shipments', label: 'Open shipments' }
    case 'product_query_for_admin':
      return {
        to: withPathId('/admin/product-queries', meta, 'conversation_id'),
        label: 'Open product query',
      }
    case 'order_query_reply_for_admin':
      return {
        to: withPathId('/admin/order-queries', meta, 'conversation_id'),
        label: 'Open order query',
      }
    case 'new_support_query_for_admin':
      return meta.requester_type === 'VENDOR'
        ? { to: '/admin/support', label: 'Open support inbox' }
        : { to: '/admin/customer-support', label: 'Open support inbox' }
    default:
      return null
  }
}

export function vendorNotificationTarget(notification: Notifiable): NotificationTarget | null {
  const meta = notification.meta ?? {}
  switch (notification.type) {
    case 'new_sale':
    case 'new_order_for_vendor':
      return { to: '/vendor/orders', label: 'Open orders' }
    case 'return_request_for_vendor':
      return { to: '/vendor/returns', label: 'Review return' }
    case 'payout_approved':
      return { to: '/vendor/payouts', label: 'Open payouts' }
    case 'vendor_wallet_credited':
    case 'wallet_credited':
    case 'wallet_debited':
      return { to: '/vendor/wallet', label: 'Open wallet' }
    case 'product_approved':
    case 'product_rejected':
      return { to: '/vendor/products', label: 'Open products' }
    case 'vendor_approved':
      return { to: '/vendor/profile', label: 'Open store profile' }
    case 'order_query_for_vendor':
      return {
        to: withIdParam('/vendor/order-queries', 'open', meta, 'conversation_id'),
        label: 'Open order query',
      }
    case 'product_query_for_vendor':
      return {
        to: withIdParam('/vendor/product-queries', 'open', meta, 'conversation_id'),
        label: 'Open product query',
      }
    case 'support_reply_for_vendor':
      return { to: '/vendor/support', label: 'Open chat' }
    default:
      return null
  }
}

export function customerNotificationTarget(notification: Notifiable): NotificationTarget | null {
  const meta = notification.meta ?? {}
  switch (notification.type) {
    case 'order_placed':
    case 'order_created':
    case 'order_status':
    case 'order_confirmed':
    case 'order_packed':
    case 'order_shipped':
    case 'out_for_delivery':
    case 'order_delivered':
    case 'order_cancelled':
    case 'payment_success':
    case 'payment_failure':
      return { to: withPathId('/account/orders', meta, 'order_id'), label: 'Open order' }
    case 'return_requested':
      return { to: '/account/returns', label: 'Open returns' }
    case 'refund_completed':
    case 'wallet_credited':
    case 'wallet_debited':
      return { to: '/account/wallet', label: 'Open wallet' }
    case 'customer_registered':
    case 'customer_verified':
      return { to: '/account', label: 'Account' }
    case 'support_reply_for_customer':
      return { to: '/account/support', label: 'Open chat' }
    case 'product_query_reply_for_customer':
      return {
        to: withPathId('/account/product-queries', meta, 'conversation_id'),
        label: 'View product query',
      }
    default:
      return null
  }
}
