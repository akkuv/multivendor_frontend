import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  LockKeyhole,
  Minus,
  PackageCheck,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Stamp,
  Store,
  Trash2,
  Truck,
} from 'lucide-react'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useCart, useRemoveCartItem, useUpdateCartItem } from '@/hooks/useCart'
import { cn } from '@/lib/utils'
import { assetUrl } from '@/lib/assets'
import { useAuthStore } from '@/store/authStore'
import type { Cart, CartItem, CartVendorGroup } from '@/types'
import { formatCurrency } from '@/utils/format'

function VariantLabel({ item }: { item: CartItem }) {
  const { t } = useTranslation()
  const attrs = item.variant?.attributes
  if (!attrs || Object.keys(attrs).length === 0) return null
  const label = Object.entries(attrs)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' · ')
  return (
    <p className="mt-1.5 max-w-md truncate text-xs text-[#6b5d47]">
      <span className="font-semibold text-[#8a6a1f]">{t('Options')}:</span> {label}
    </p>
  )
}

function CartItemRow({
  item,
  onUpdate,
  onRemove,
  updating,
  removing,
}: {
  item: CartItem
  onUpdate: (quantity: number) => void
  onRemove: () => void
  updating: boolean
  removing: boolean
}) {
  const exceedsStock = item.quantity > item.available_stock
  const atMax = item.quantity >= item.available_stock
  const hasDiscount = item.discount > 0
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'grid grid-cols-[88px_minmax(0,1fr)] gap-4 py-6 transition-opacity sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-5',
        (updating || removing) && 'pointer-events-none opacity-60',
      )}
      aria-busy={updating || removing}
    >
      <Link
        to={`/product/${item.product?.slug ?? item.product_id}`}
        className="group relative h-24 w-24 overflow-hidden rounded-2xl border border-[#e6dcc4] bg-[#f7f0e1] shadow-sm sm:h-28 sm:w-28"
      >
        {item.product?.images?.[0] ? (
          <img
            src={assetUrl(item.product.images[0])}
            alt={item.product?.name ?? ''}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-medium text-[#a08a5c]">
            {t('No image')}
          </div>
        )}
        <span className="absolute -left-1 -top-1 z-10 flex h-7 min-w-7 items-center justify-center rounded-full bg-[#1c1812] px-2 text-xs font-bold text-white shadow-lg ring-2 ring-white">
          {item.quantity}
        </span>
      </Link>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={`/product/${item.product?.slug ?? item.product_id}`}
              className="line-clamp-2 font-display text-base font-semibold leading-snug text-[#1c1812] transition-colors hover:text-[#a07a28] sm:text-lg"
            >
              {item.product?.name ?? `Product #${item.product_id}`}
            </Link>
            <VariantLabel item={item} />
          </div>
          <button
            type="button"
            aria-label={t('Remove {{name}}', { name: item.product?.name ?? t('item') })}
            onClick={onRemove}
            disabled={removing}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-cream hover:text-claret focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-mid"
          >
            {removing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-[#1c1812] sm:text-base">
            {formatCurrency(item.unit_price)}
          </span>
          {item.mrp && item.mrp > item.unit_price && (
            <span className="text-xs text-[#9a927f] line-through">
              {formatCurrency(item.mrp)}
            </span>
          )}
          {hasDiscount && (
            <Badge variant="success" className="rounded-full px-2.5 py-0.5 text-[10px]">
              {t('Save {{amount}}', { amount: formatCurrency(item.discount) })}
            </Badge>
          )}
        </div>

        {(item.fees?.length ?? 0) > 0 && (
          <div className="mt-1.5 space-y-0.5">
            {item.fees.map((fee) => (
              <p
                key={fee.name}
                className="flex items-center justify-between gap-4 text-xs text-[#6b5d47]"
              >
                <span>{fee.name}</span>
                <span className="font-medium text-[#1c1812]">{formatCurrency(fee.amount)}</span>
              </p>
            ))}
          </div>
        )}

        {exceedsStock ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {t('Only {{count}} available — reduce the quantity to continue', { count: item.available_stock })}
          </p>
        ) : item.available_stock <= 5 ? (
          <p className="mt-2 text-xs font-medium text-amber-700">{t('Only {{count}} left in stock', { count: item.available_stock })}</p>
        ) : (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <Check className="h-3.5 w-3.5" /> {t('In stock and ready to order')}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex h-10 items-center overflow-hidden rounded-full border border-[#d9cfba] bg-white shadow-sm">
            <button
              type="button"
              className="flex h-full w-10 items-center justify-center text-[#6b5d47] transition hover:bg-[#f7f0e1] hover:text-[#8a6a1f] disabled:cursor-not-allowed disabled:opacity-30"
              aria-label={t('Decrease quantity')}
              disabled={item.quantity <= 1 || updating}
              onClick={() => onUpdate(item.quantity - 1)}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="flex h-full min-w-10 items-center justify-center border-x border-[#e8dfcd] px-2 text-sm font-bold text-[#1c1812]">
              {updating ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#a07a28]" /> : item.quantity}
            </span>
            <button
              type="button"
              className="flex h-full w-10 items-center justify-center text-[#6b5d47] transition hover:bg-[#f7f0e1] hover:text-[#8a6a1f] disabled:cursor-not-allowed disabled:opacity-30"
              aria-label={t('Increase quantity')}
              disabled={atMax || updating}
              onClick={() => onUpdate(item.quantity + 1)}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a927f]">{t('Line total')}</p>
            <p className="font-display text-lg font-semibold text-[#1c1812]">{formatCurrency(item.subtotal)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function VendorGroup({
  group,
  onUpdate,
  onRemove,
  updatingItemId,
  removingItemId,
}: {
  group: CartVendorGroup
  onUpdate: (item: CartItem, quantity: number) => void
  onRemove: (item: CartItem) => void
  updatingItemId?: number
  removingItemId?: number
}) {
  const { t } = useTranslation()

  return (
    <Card className="overflow-hidden rounded-[1.75rem] border-[#e6dcc4] bg-white/90 shadow-[0_18px_50px_-34px_rgba(63,45,12,0.35)] backdrop-blur">
      <div className="flex items-center justify-between gap-4 border-b border-[#eee6d5] bg-[#fbf7ee] px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-[#8a6a1f] ring-1 ring-[#c9a25a]/25">
            <Store className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a07a28]">{t('Fulfilled by')}</p>
            <p className="truncate font-display text-base font-semibold text-[#1c1812] sm:text-lg">
              {group.vendor?.store_name ?? `Vendor #${group.vendor_id}`}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-[#e6dcc4] bg-white px-3 py-1.5 text-xs font-semibold text-[#6b5d47] shadow-sm">
          {group.item_count} {group.item_count === 1 ? t('item') : t('items')}
        </span>
      </div>

      <CardContent className="divide-y divide-[#eee6d5] px-5 sm:px-6">
        {group.items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            onUpdate={(quantity) => onUpdate(item, quantity)}
            onRemove={() => onRemove(item)}
            updating={updatingItemId === item.id}
            removing={removingItemId === item.id}
          />
        ))}
      </CardContent>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eee6d5] bg-[#fcfaf5] px-5 py-4 sm:px-6">
        {group.discount > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" /> {t('You save {{amount}} with this vendor', { amount: formatCurrency(group.discount) })}
          </span>
        ) : (
          <span className="text-xs text-[#8b8170]">{t('Prices include available product discounts')}</span>
        )}
        <div className="text-right">
          <span className="mr-2 text-xs text-[#6b5d47]">{t('Vendor subtotal')}</span>
          <span className="font-display text-lg font-semibold text-[#1c1812]">{formatCurrency(group.subtotal)}</span>
        </div>
      </div>
    </Card>
  )
}

function OrderSummary({ cart, busy }: { cart: Cart; busy: boolean }) {
  const shipping = cart.shipping ?? 0
  const hasSavings = cart.discount > 0
  const { t } = useTranslation()

  return (
    <Card className="overflow-hidden rounded-[1.75rem] border-[#e6dcc4] bg-white/95 shadow-[0_24px_65px_-30px_rgba(63,45,12,0.45)] backdrop-blur">
      <div className="relative overflow-hidden bg-[#1c1812] px-6 py-6 text-white">
        <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[#c9a25a]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-8 h-32 w-32 rounded-full bg-[#e6c97e]/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
              <ShoppingBag className="h-4.5 w-4.5 text-[#e6c97e]" />
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#e6c97e]">
              <LockKeyhole className="h-3 w-3" /> {t('Secure checkout')}
            </span>
          </div>
          <h2 className="mt-4 font-display text-2xl font-semibold">{t('Order summary')}</h2>
          <p className="mt-1 text-sm text-white/60">{t('Everything looks good? Your total is ready.')}</p>
        </div>
      </div>

      <CardContent className="space-y-4 p-6">
        {hasSavings && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <Sparkles className="h-4 w-4" /> {t('Your savings')}
            </span>
            <span className="font-display text-base font-semibold text-emerald-700">
              -{formatCurrency(cart.discount)}
            </span>
          </div>
        )}

        <div className="space-y-3.5 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#6b5d47]">{t('Subtotal')}</span>
            <span className="font-semibold text-[#1c1812]">{formatCurrency(cart.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#6b5d47]">{t('Tax (inclusive)')}</span>
            <span className="font-semibold text-[#1c1812]">{formatCurrency(cart.tax)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-[#6b5d47]">
              <Truck className="h-4 w-4 text-[#a07a28]" /> {t('Shipping')}
            </span>
            {shipping > 0 ? (
              <span className="font-semibold text-[#1c1812]">{formatCurrency(shipping)}</span>
            ) : (
              <span className="font-semibold text-emerald-700">{t('Free')}</span>
            )}
          </div>
        {(cart.fees_total ?? 0) > 0 && (
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-[#6b5d47]">
                <Stamp className="h-4 w-4 text-[#a07a28]" /> {t('Product fees')}
              </span>
              <span className="font-semibold text-[#1c1812]">{formatCurrency(cart.fees_total)}</span>
            </div>
          )}
        </div>

        <Separator className="bg-[#e6dcc4]" />

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-display text-lg font-semibold text-[#1c1812]">{t('Total')}</p>
            <p className="text-[11px] text-[#8b8170]">{t('Including all taxes and fees')}</p>
          </div>
          <p className="font-display text-3xl font-semibold text-[#1c1812]">{formatCurrency(cart.total)}</p>
        </div>

        <Button
          asChild
          size="lg"
          disabled={busy}
          className="h-13 w-full rounded-full bg-gold text-[#1a1308] shadow-lg shadow-[#c9a25a]/30 transition hover:brightness-105"
        >
          <Link to="/checkout">
            {t('Proceed to checkout')} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-11 w-full rounded-full border-[#d9cfba] bg-white text-[#5f513a] hover:bg-[#f7f0e1] hover:text-[#8a6a1f]"
        >
          <Link to="/shop">{t('Continue shopping')}</Link>
        </Button>

        <div className="grid grid-cols-3 gap-2 border-t border-[#eee6d5] pt-5">
          <div className="text-center">
            <ShieldCheck className="mx-auto h-4 w-4 text-[#a07a28]" />
            <p className="mt-1.5 text-[10px] font-semibold leading-tight text-[#6b5d47]">{t('Secure payment')}</p>
          </div>
          <div className="text-center">
            <PackageCheck className="mx-auto h-4 w-4 text-[#a07a28]" />
            <p className="mt-1.5 text-[10px] font-semibold leading-tight text-[#6b5d47]">{t('Order tracking')}</p>
          </div>
          <div className="text-center">
            <RotateCcw className="mx-auto h-4 w-4 text-[#a07a28]" />
            <p className="mt-1.5 text-[10px] font-semibold leading-tight text-[#6b5d47]">{t('Easy returns')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CartEmptyState({ signedIn }: { signedIn: boolean }) {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="relative overflow-hidden rounded-[2rem] border border-[#e6dcc4] bg-[#fffdf8] px-6 py-14 text-center shadow-[0_30px_80px_-45px_rgba(91,65,19,0.4)] sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#e6c97e]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[#c9a25a]/15 blur-3xl" />
        <div className="relative mx-auto max-w-xl">
          <div className="animate-fade-up mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gold text-[#1a1308] shadow-xl shadow-[#c9a25a]/30 ring-1 ring-white/60">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <p className="mt-8 inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#a07a28]">
            <span className="h-px w-8 bg-[#c9a25a]/60" />
            {signedIn ? t('Your collection awaits') : t('A space for your favourites')}
            <span className="h-px w-8 bg-[#c9a25a]/60" />
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-[#1c1812] sm:text-5xl">
            {signedIn ? t('Your cart is empty') : t('Sign in to view your cart')}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#6b5d47] sm:text-base">
            {signedIn
              ? t('Discover thoughtful finds from independent sellers and fill your cart with something special.')
              : t('Sign in to keep your selections secure, synced across devices, and ready whenever you return.')}
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 h-12 rounded-full bg-gold px-8 text-[#1a1308] shadow-lg shadow-[#c9a25a]/30 hover:brightness-105"
          >
            <Link to={signedIn ? '/shop' : '/login'}>
              {signedIn ? t('Explore the collection') : t('Sign in to continue')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <div className="mt-10 grid gap-3 text-left sm:grid-cols-3">
            {[
              { icon: Sparkles, title: t('Curated finds'), copy: 'Distinctive products from trusted sellers' },
              { icon: Truck, title: t('Tracked delivery'), copy: 'Clear updates from cart to doorstep' },
              { icon: ShieldCheck, title: t('Secure checkout'), copy: 'Protected payments and easy returns' },
            ].map(({ icon: Icon, title, copy }) => (
              <div key={title} className="rounded-2xl border border-[#eee6d5] bg-white/75 p-4">
                <Icon className="h-4 w-4 text-[#a07a28]" />
                <p className="mt-2 text-sm font-semibold text-[#1c1812]">{title}</p>
                <p className="mt-1 text-xs leading-5 text-[#7a705f]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function CartPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const isCustomer = !!token && user?.role === 'CUSTOMER'
  const { data: cart, isLoading, isError, refetch } = useCart(isCustomer)
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()

  if (!token) {
    return (
      <div>
        <Breadcrumb items={[{ label: t('Shopping cart') }]} />
        <CartEmptyState signedIn={false} />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div>
        <Breadcrumb items={[{ label: t('Shopping cart') }]} />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <Skeleton className="h-48 rounded-[2rem]" />
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-5">
              <Skeleton className="h-80 rounded-[1.75rem]" />
              <Skeleton className="h-80 rounded-[1.75rem]" />
            </div>
            <Skeleton className="h-[520px] rounded-[1.75rem]" />
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div>
        <Breadcrumb items={[{ label: t('Shopping cart') }]} />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gold-soft text-gold-deep ring-1 ring-gold-mid/30">
            <AlertTriangle className="h-9 w-9" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-semibold text-[#1c1812]">{t('We could not load your cart')}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6b5d47]">
            {t('Something interrupted the request. Your cart is safe — please try once more.')}
          </p>
          <Button
            onClick={() => refetch()}
            className="mt-7 h-11 rounded-full bg-gold px-7 text-[#1a1308] hover:brightness-105"
          >
            <RefreshCw className="h-4 w-4" /> {t('Try again')}
          </Button>
        </div>
      </div>
    )
  }

  const groups = cart?.vendor_groups ?? []
  const items = cart?.items ?? []

  if (!cart || items.length === 0) {
    return (
      <div>
        <Breadcrumb items={[{ label: t('Shopping cart') }]} />
        <CartEmptyState signedIn />
      </div>
    )
  }

  const updatingItemId = updateItem.isPending ? updateItem.variables?.itemId : undefined
  const removingItemId = removeItem.isPending ? removeItem.variables : undefined
  const cartBusy = updateItem.isPending || removeItem.isPending

  return (
    <div>
      <Breadcrumb items={[{ label: t('Shopping cart') }]} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-[#3b2b12] bg-[#1c1812] px-6 py-8 text-white shadow-[0_28px_70px_-40px_rgba(63,45,12,0.65)] sm:px-9 sm:py-10">
          <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#c9a25a]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-[#e6c97e]/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-[#c9a25a]/[0.06] to-transparent" />
          <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
            <div>
              <p className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#e6c97e]">
                <span className="h-px w-8 bg-[#e6c97e]/60" />
                {t('Curated for you')}
                <span className="h-px w-8 bg-[#e6c97e]/60" />
              </p>
              <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-5xl">{t('Your shopping cart')}</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/65 sm:text-base">
                {t('Review your selections and enjoy a simple, secure checkout. Your finds are grouped by seller for you.')}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 backdrop-blur-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e6c97e]/15 text-[#e6c97e] ring-1 ring-[#e6c97e]/20">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-white">{cart.item_count}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                  {cart.item_count === 1 ? 'Item' : 'Items'} · {groups.length} {groups.length === 1 ? 'seller' : 'sellers'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {(cart.messages ?? []).map((message, i) => (
          <div
            key={i}
            className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        ))}

        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
          <div className="space-y-5">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="font-display text-xl font-semibold text-[#1c1812]">{t('Your selections')}</h2>
                <p className="mt-1 text-xs text-[#7a705f]">{t('Quantities and discounts update automatically')}</p>
              </div>
              <Link
                to="/shop"
                className="hidden items-center gap-1.5 text-sm font-semibold text-[#8a6a1f] transition hover:text-[#a07a28] sm:flex"
              >
                Add more <Plus className="h-3.5 w-3.5" />
              </Link>
            </div>
            {groups.map((group) => (
              <VendorGroup
                key={group.vendor_id}
                group={group}
                onUpdate={(item, quantity) => updateItem.mutate({ itemId: item.id, quantity })}
                onRemove={(item) => removeItem.mutate(item.id)}
                updatingItemId={updatingItemId}
                removingItemId={removingItemId}
              />
            ))}
          </div>

          <aside className="lg:sticky lg:top-28">
            <OrderSummary cart={cart} busy={cartBusy} />
          </aside>
        </div>
      </div>
    </div>
  )
}
