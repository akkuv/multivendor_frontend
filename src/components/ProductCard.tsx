import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Package, ShoppingCart, Sparkles, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAddToCart } from '@/hooks/useCart'
import { useToggleWishlist, useWishlistIds } from '@/hooks/useWishlist'
import { cn } from '@/lib/utils'
import { assetUrl } from '@/lib/assets'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/store/authStore'
import type { Product } from '@/types'
import { formatCurrency } from '@/utils/format'
import { isRecentlyAdded } from '@/utils/product'

interface ProductCardProps {
  product: Product
  variant?: 'default' | 'minimal' | 'retail'
}

export function ProductCard({
  product,
  variant = 'default',
}: ProductCardProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
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
  const collectionLabel =
    product.brand?.name ?? product.category?.name ?? product.vendor?.store_name ?? t('Curated collection')
  const isMinimal = variant === 'minimal'
  const rating = product.rating
  const hasRating = rating?.average != null && rating.count > 0
  const isNew = !hasRating && isRecentlyAdded(product)

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

  const actionLabel = !inStock
    ? t('Out of stock')
    : addToCart.isPending
      ? t('Adding…')
      : hasVariants
        ? t('Choose options')
        : t('Add to bag')

  return (
    <Card
      className={cn(
        'group h-full overflow-hidden border border-line-warm bg-ivory transition-all duration-300',
        isMinimal
          ? 'gap-0 rounded-2xl py-0 shadow-[0_16px_40px_-30px_rgba(63,45,12,0.55)] hover:-translate-y-1.5 hover:border-gold-mid/60 hover:shadow-[0_34px_64px_-34px_rgba(160,122,40,0.6)]'
          : 'rounded-[1.1rem] shadow-[0_14px_36px_-22px_rgba(63,45,12,0.3)] hover:-translate-y-1 hover:border-gold-mid/60 hover:shadow-[0_28px_60px_-26px_rgba(160,122,40,0.4)]',
      )}
    >
      <div className="relative">
        <Link
          to={`/product/${product.slug}`}
          className={cn(
            'relative block overflow-hidden bg-gradient-to-br from-[#f3e9d4] via-[#faf5e9] to-[#ecdcb8]',
            isMinimal ? 'aspect-[5/7]' : 'aspect-[4/5]',
          )}
        >
          {image ? (
            <>
              <img
                src={assetUrl(image)}
                alt={product.name}
                loading="lazy"
                className={cn(
                  'h-full w-full object-cover transition duration-700 ease-out',
                  isMinimal ? 'group-hover:scale-[1.06]' : 'group-hover:scale-105',
                )}
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
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#a08a5c]">
              <Package className="h-9 w-9" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em]">{t('No image')}</span>
            </div>
          )}

          {isMinimal && (
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          )}
          <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e6c97e]/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </Link>

        <div className="absolute left-3 top-3 flex max-w-[70%] flex-col items-start gap-1.5">
          {discount && (
            <span className="bg-[#F2D6C2] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#3A0B08] shadow-sm">
              {t('{{percent}}% OFF', { percent: discount })}
            </span>
          )}
          {product.featured && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#e6c97e]/50 bg-ivory/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-gold-deep backdrop-blur">
              <Sparkles className="h-3 w-3" /> {t('Featured')}
            </span>
          )}
          {product.best_seller && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50/95 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-700 shadow-sm backdrop-blur">
              {t('Bestseller')}
            </span>
          )}
        </div>

        {!inStock && (
          <span className="absolute bottom-3 left-3 z-10 rounded-full bg-[#0f0c08]/85 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
            {t('Sold out')}
          </span>
        )}
        {lowStock && (
          <span className="absolute bottom-3 left-3 z-10 rounded-full bg-amber-50/95 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-amber-800 shadow-sm backdrop-blur">
            {t('Only {{count}} left', { count: product.stock })}
          </span>
        )}

        <button
          type="button"
          aria-label={isWishlisted ? t('Remove from wishlist') : t('Add to wishlist')}
          disabled={toggleWishlist.isPending}
          onClick={() => {
            if (isCustomer) toggleWishlist.mutate(product)
            else if (!token) window.location.href = '/login'
          }}
          className={cn(
            'absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-line-warm bg-ivory/95 shadow-md transition-all duration-300 hover:scale-105 hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-mid disabled:opacity-60',
            isWishlisted ? 'bg-gold-soft text-gold-deep' : 'text-ink-soft',
          )}
        >
          <Heart className={cn('h-4 w-4', isWishlisted && 'fill-gold-deep text-gold-deep')} />
        </button>

        {isMinimal && inStock && !lowStock && (
          <span className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex translate-y-2 justify-center opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ivory/95 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink shadow-lg ring-1 ring-line-warm backdrop-blur">
              {hasVariants ? t('View options') : t('View product')}
            </span>
          </span>
        )}
      </div>

      <CardContent className={cn('flex flex-1 flex-col', isMinimal ? 'gap-0 p-4' : 'p-4 sm:p-5')}>
        <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-gold-deep">
          {collectionLabel}
        </p>
        <Link to={`/product/${product.slug}`} className="mt-1 min-w-0">
          <h3
            className={cn(
              'line-clamp-2 leading-snug transition-colors group-hover:text-gold-deep',
              isMinimal
                ? 'text-sm font-semibold text-ink'
                : 'font-display text-[15px] font-semibold text-ink sm:text-base',
            )}
          >
            {product.name}
          </h3>
        </Link>

        {rating?.average != null && rating.count > 0 ? (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-ink-soft">
            <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 font-bold text-white">
              <Star className="h-3 w-3 fill-current" /> {rating.average.toFixed(1)}
            </span>
            <span className="text-ink-soft/50">|</span>
            <span>
              {rating.count} {rating.count === 1 ? t('rating') : t('ratings')}
            </span>
          </div>
        ) : isNew ? (
          <p className="mt-2.5 text-[11px] font-semibold text-emerald-700">{t('New arrival')}</p>
        ) : (
          <div className="mt-2.5 h-[18px]" />
        )}

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-2">
          <span className={cn('font-bold tracking-tight text-ink', isMinimal ? 'text-[15px]' : 'text-lg')}>
            {formatCurrency(product.price)}
          </span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-xs text-ink-soft/55 line-through">{formatCurrency(product.mrp)}</span>
          )}
          {discount && <span className="text-xs font-bold text-claret">-{discount}%</span>}
        </div>

        <Button
          className={cn(
            'w-full rounded-full bg-ink text-[11px] font-bold uppercase tracking-[0.12em] text-[#e9c891] transition-all hover:bg-[#2c2620]',
            isMinimal ? 'mt-3 h-9' : 'mt-3 h-10 shadow-lg shadow-[#8a6a1f]/10',
          )}
          size="sm"
          disabled={!inStock || addToCart.isPending}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="mr-1 h-4 w-4" />
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  )
}
