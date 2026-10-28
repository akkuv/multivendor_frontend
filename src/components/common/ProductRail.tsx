import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Heart, Package, Sparkles, Star } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useToggleWishlist, useWishlistIds } from '@/hooks/useWishlist'
import { assetUrl } from '@/lib/assets'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/utils/format'
import { isRecentlyAdded } from '@/utils/product'
import { useTranslation } from 'react-i18next'
import type { Product } from '@/types'

/**
 * Attractive PDP rail card: image-forward, badges, wishlist, rating, price row.
 * The whole card is a link (variant products route to the PDP); the overlay
 * pill on hover keeps the "choose options" affordance without a fake quick-add.
 */
function RailProductCard({ product }: { product: Product }) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const isCustomer = !!token && user?.role === 'CUSTOMER'
  const wishlistIds = useWishlistIds(isCustomer)
  const isWishlisted = wishlistIds.has(product.id)
  const toggleWishlist = useToggleWishlist()

  const image = product.images?.[0]
  const hoverImage = product.images?.[1]
  const inStock = product.stock > 0
  const discount = product.discount_percent > 0 ? product.discount_percent : null
  const hasVariants = (product.variants ?? []).some((v) => v.status === 'ACTIVE')
  const brand = product.brand?.name ?? product.category?.name ?? product.vendor?.store_name
  const rating = product.rating

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line-warm bg-ivory transition-all duration-300 hover:-translate-y-1 hover:border-gold-mid/50 hover:shadow-[0_24px_50px_-26px_rgba(160,122,40,0.4)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-[#f3e9d4] via-[#faf5e9] to-[#ecdcb8]">
        {image ? (
          <>
            <img
              src={assetUrl(image)}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
            />
            {hoverImage && (
              <img
                src={assetUrl(hoverImage)}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#a08a5c]">
            <Package className="h-9 w-9" />
          </div>
        )}

        <div className="absolute left-2.5 top-2.5 flex max-w-[70%] flex-col items-start gap-1.5">
          {discount && (
            <span className="bg-[#F2D6C2] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#3A0B08]">
              {t('{{percent}}% off', { percent: discount })}
            </span>
          )}
          {product.best_seller && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-700">
              {t('Bestseller')}
            </span>
          )}
          {product.featured && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#e6c97e]/50 bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-gold-deep">
              <Sparkles className="h-3 w-3" /> {t('Featured')}
            </span>
          )}
        </div>

        {!inStock && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-[#0f0c08]/85 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white">
            {t('Sold out')}
          </span>
        )}

        <button
          type="button"
          aria-label={isWishlisted ? t('Remove from wishlist') : t('Add to wishlist')}
          disabled={toggleWishlist.isPending}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (isCustomer) toggleWishlist.mutate(product)
            else if (!token) window.location.href = '/login'
          }}
          className={cn(
            'absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full border border-line-warm bg-white/95 text-ink-soft shadow-md transition-all duration-300 hover:scale-105 hover:text-gold-deep',
            isWishlisted && 'bg-gold-soft text-gold-deep',
          )}
        >
          <Heart className={cn('h-4 w-4', isWishlisted && 'fill-gold-deep text-gold-deep')} />
        </button>

        <span className="pointer-events-none absolute inset-x-2 bottom-2 translate-y-2 rounded-full bg-white/95 py-2 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-ink opacity-0 shadow-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          {hasVariants ? t('View options') : t('View product')}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        {brand && (
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-gold-deep">{brand}</p>
        )}
        <h3 className="mt-1 line-clamp-2 text-[13px] font-medium leading-snug text-ink transition-colors group-hover:text-gold-deep">
          {product.name}
        </h3>

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
        ) : null}

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-2">
          <span className="text-[15px] font-bold tracking-tight text-ink">{formatCurrency(product.price)}</span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-xs text-ink-soft/60 line-through">{formatCurrency(product.mrp)}</span>
          )}
          {discount && <span className="text-xs font-bold text-claret">-{discount}%</span>}
        </div>
      </div>
    </Link>
  )
}

interface ProductRailProps {
  title: string
  products: Product[]
}

/** KALKI-style rail heading (24px/500 capitalize) with a snap slider + edge arrows. */
export function ProductRail({ title, products }: ProductRailProps) {
  const { t } = useTranslation()
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const sync = () => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 8)
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }

  useEffect(() => {
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length])

  const step = (direction: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-rail-card]')
    const width = card?.offsetWidth ?? 248
    el.scrollBy({ left: direction * (width + 16), behavior: 'smooth' })
  }

  return (
    <section className="mt-20">
      <h2 className="text-center text-2xl font-medium capitalize text-ink">{title}</h2>
      <div className="relative mt-6">
        {canPrev && (
          <button
            type="button"
            aria-label={t('Previous products')}
            onClick={() => step(-1)}
            className="absolute -left-4 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line-warm bg-white text-ink shadow-lg transition hover:border-gold-mid/60 hover:text-gold-deep"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div
          ref={trackRef}
          onScroll={sync}
          className="flex snap-x gap-4 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((p) => (
            <div key={p.id} data-rail-card className="w-[248px] shrink-0 snap-start">
              <RailProductCard product={p} />
            </div>
          ))}
        </div>
        {canNext && (
          <button
            type="button"
            aria-label={t('Next products')}
            onClick={() => step(1)}
            className="absolute -right-4 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line-warm bg-white text-ink shadow-lg transition hover:border-gold-mid/60 hover:text-gold-deep"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </section>
  )
}

export default ProductRail