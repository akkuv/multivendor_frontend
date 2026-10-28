import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Package, ShoppingCart, Sparkles, Star } from 'lucide-react'
import { useAddToCart } from '@/hooks/useCart'
import { useToggleWishlist, useWishlistIds } from '@/hooks/useWishlist'
import { cn } from '@/lib/utils'
import { assetUrl } from '@/lib/assets'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/store/authStore'
import type { Product } from '@/types'
import { formatCurrency } from '@/utils/format'
import { isRecentlyAdded } from '@/utils/product'

/**
 * KALKI-style collection grid card: clean 5:7 portrait image (hover crossfade +
 * quick-add bar), copper %OFF chip, wishlist heart, then label / title / rating /
 * price below. The whole card behaviourally matches the rest of the storefront
 * (real add-to-cart, variant products route to the PDP, wishlist auth gating).
 */
export function CollectionCard({ product }: { product: Product }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const isCustomer = !!token && user?.role === 'CUSTOMER'
  const addToCart = useAddToCart()
  const wishlistIds = useWishlistIds(isCustomer)
  const isWishlisted = wishlistIds.has(product.id)
  const toggleWishlist = useToggleWishlist()

  const image = product.images?.[0]
  const inStock = product.stock > 0
  const lowStock = inStock && product.stock <= 5
  const discount = product.discount_percent > 0 ? product.discount_percent : null
  const hasVariants = (product.variants ?? []).some((variant) => variant.status === 'ACTIVE')
  const label =
    product.brand?.name ?? product.category?.name ?? product.vendor?.store_name ?? t('Curated collection')
  const rating = product.rating

  function handleAddToCart() {
    if (!token) {
      window.location.href = '/login'
      return
    }
    if (!isCustomer) return
    if (hasVariants) {
      navigate(`/product/${product.slug}`)
      return
    }
    addToCart.mutate(
      { productId: product.id, quantity: 1 },
      {
        onSuccess: () => {
          toast({
            title: t('Added to your cart'),
            description: product.name,
            variant: 'success',
          })
        },
      },
    )
  }

  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-[5/7] overflow-hidden bg-gradient-to-br from-[#f3e9d4] via-[#faf5e9] to-[#ecdcb8] shadow-[0_10px_30px_-22px_rgba(63,45,12,0.4)] transition-shadow duration-300 group-hover:shadow-[0_30px_56px_-24px_rgba(63,45,12,0.5)]">
        <Link to={`/product/${product.slug}`} className="absolute inset-0 block" aria-label={product.name}>
          {image ? (
            <>
              <img
                src={assetUrl(image)}
                alt={product.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              {product.images?.[1] && (
                <img
                  src={assetUrl(product.images[1])}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#a08a5c]">
              <Package className="h-10 w-10" />
            </div>
          )}
        </Link>

        {/* ── badges ── */}
        <div className="absolute left-3 top-3 z-10 flex max-w-[70%] flex-col items-start gap-1.5">
          {discount && (
            <span className="bg-[#F2D6C2] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#3A0B08] shadow-sm">
              {t('{{percent}}% OFF', { percent: discount })}
            </span>
          )}
          {product.featured && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#e6c97e]/50 bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-gold-deep backdrop-blur">
              <Sparkles className="h-3 w-3" /> {t('Featured')}
            </span>
          )}
          {product.best_seller && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-700 shadow-sm backdrop-blur">
              {t('Bestseller')}
            </span>
          )}
        </div>

        {/* ── stock status ── */}
        {!inStock ? (
          <span className="absolute bottom-3 left-3 z-10 rounded-full bg-[#0f0c08]/85 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
            {t('Sold out')}
          </span>
        ) : (
          lowStock && (
            <span className="absolute bottom-3 left-3 z-10 rounded-full bg-amber-50/95 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-800 shadow-sm backdrop-blur">
              {t('Only {{count}} left', { count: product.stock })}
            </span>
          )
        )}

        {/* ── wishlist ── */}
        <button
          type="button"
          aria-label={isWishlisted ? t('Remove from wishlist') : t('Add to wishlist')}
          disabled={toggleWishlist.isPending}
          onClick={() => {
            if (isCustomer) toggleWishlist.mutate(product)
            else if (!token) window.location.href = '/login'
          }}
          className={cn(
            'absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-line-warm bg-white/95 text-ink-soft shadow-md transition-all duration-300 hover:scale-105 hover:text-gold-deep',
            isWishlisted && 'bg-gold-soft text-gold-deep',
          )}
        >
          <Heart className={cn('h-4 w-4', isWishlisted && 'fill-gold-deep text-gold-deep')} />
        </button>

        {/* ── hover quick-add bar (real add-to-cart / option chooser) ── */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-16 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute inset-x-0 bottom-0 z-10 translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock || addToCart.isPending}
            className="flex h-11 w-full items-center justify-center gap-2 bg-ink/95 text-[11px] font-bold uppercase tracking-[0.14em] text-[#e9c891] backdrop-blur transition-colors hover:bg-ink disabled:cursor-not-allowed"
          >
            <ShoppingCart className="h-4 w-4" />
            {!inStock
              ? t('Out of stock')
              : addToCart.isPending
                ? t('Adding…')
                : hasVariants
                  ? t('Choose options')
                  : t('Add to bag')}
          </button>
        </div>
      </div>

      {/* ── card meta below image ── */}
      <div className="flex flex-1 flex-col px-1 pt-3">
        <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-gold-deep">{label}</p>
        <Link to={`/product/${product.slug}`} className="mt-1 min-w-0">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-ink transition-colors group-hover:text-[#AA6437]">
            {product.name}
          </h3>
        </Link>

        {rating?.average != null && rating.count > 0 ? (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-soft">
            <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 font-bold text-white">
              <Star className="h-3 w-3 fill-current" /> {rating.average.toFixed(1)}
            </span>
            <span className="text-ink-soft/60">|</span>
            <span>
              {rating.count} {rating.count === 1 ? t('rating') : t('ratings')}
            </span>
          </div>
        ) : isRecentlyAdded(product) ? (
          <p className="mt-2 text-[11px] font-semibold text-emerald-700">{t('New arrival')}</p>
        ) : (
          <div className="mt-2 h-[18px]" />
        )}

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-2">
          <span className="text-base font-bold tracking-tight text-ink">{formatCurrency(product.price)}</span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-xs text-ink-soft/55 line-through">{formatCurrency(product.mrp)}</span>
          )}
          {discount && <span className="text-xs font-bold text-claret">-{discount}%</span>}
        </div>
      </div>
    </article>
  )
}

export default CollectionCard