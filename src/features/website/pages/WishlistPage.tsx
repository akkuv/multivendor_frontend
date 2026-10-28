import { useState } from 'react'
import { assetUrl } from '@/lib/assets'
import { Link } from 'react-router-dom'
import { AlertTriangle, Heart, RefreshCw, ShoppingCart, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useWishlist,
  useMoveToCart,
  useRemoveFromWishlist,
  useClearWishlist,
  useUpdateWishlistNotifications,
} from '@/hooks/useWishlist'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/utils/format'
import type { WishlistItem } from '@/types'
import { useTranslation } from 'react-i18next'

function WishlistCard({ item, onMoved }: { item: WishlistItem; onMoved: () => void }) {
  const { t } = useTranslation()
  const { product } = item
  const variants = (product.variants ?? []).filter((v) => v.status === 'ACTIVE')
  const needsVariant = variants.length > 0
  const [variantId, setVariantId] = useState<string>(needsVariant ? '' : 'none')
  const [error, setError] = useState('')
  const moveToCart = useMoveToCart()
  const remove = useRemoveFromWishlist()
  const updateNotifications = useUpdateWishlistNotifications()

  const selectedVariant = variants.find((v) => String(v.id) === variantId)
  const displayPrice = selectedVariant?.price ?? product.price
  const displayMrp = selectedVariant?.mrp ?? product.mrp ?? null
  const stock = selectedVariant?.available_stock ?? product.available_stock
  const inStock = stock > 0

  const handleMove = () => {
    if (needsVariant && !variantId) {
      setError('Please choose an option to add to cart.')
      return
    }
    setError('')
    moveToCart.mutate(
      {
        product,
        payload: {
          variantId: needsVariant ? Number(variantId) : null,
          quantity: 1,
        },
      },
      {
        onSuccess: onMoved,
        onError: (e) => setError((e as Error).message),
      },
    )
  }

  const toggleNotification =
    (key: 'notifyPriceDrops' | 'notifyBackInStock') =>
    (checked: boolean) => {
      updateNotifications.mutate({
        productId: product.id,
        payload: {
          ...(key === 'notifyPriceDrops' ? { notifyPriceDrops: checked } : { notifyBackInStock: checked }),
          ...(key === 'notifyPriceDrops' ? { notifyBackInStock: item.notify_back_in_stock } : { notifyPriceDrops: item.notify_price_drops }),
        },
      })
    }

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex gap-4 p-4">
        <Link to={`/product/${product.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
          {product.images?.[0] ? (
            <img src={assetUrl(product.images[0])} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              {t('No image')}
            </div>
          )}
        </Link>

        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/product/${product.slug}`} className="font-medium hover:underline">
              {product.name}
            </Link>
            <button
              aria-label={t('Remove from wishlist')}
              disabled={remove.isPending}
              onClick={() => remove.mutate(product)}
              className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {product.vendor && (
            <p className="text-xs text-muted-foreground">{product.vendor.store_name}</p>
          )}

          <div className="flex items-baseline gap-2">
            <span className="font-semibold">{formatCurrency(displayPrice)}</span>
            {displayMrp && displayMrp > displayPrice && (
              <span className="text-sm text-muted-foreground line-through">{formatCurrency(displayMrp)}</span>
            )}
            {product.discount_percent > 0 && (
              <Badge variant="success" className="ml-auto">{product.discount_percent}% OFF</Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                disabled={updateNotifications.isPending}
                checked={item.notify_price_drops}
                onChange={(e) => toggleNotification('notifyPriceDrops')(e.target.checked)}
                className="accent-primary"
              />
              {t('Notify on price drop')}
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                disabled={updateNotifications.isPending}
                checked={item.notify_back_in_stock}
                onChange={(e) => toggleNotification('notifyBackInStock')(e.target.checked)}
                className="accent-primary"
              />
              {t('Notify when back in stock')}
            </label>
          </div>

          {needsVariant && (
            <div className="max-w-xs">
              <Select value={variantId} onValueChange={setVariantId}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder={selectedVariant ? undefined : 'Choose an option'} />
                </SelectTrigger>
                <SelectContent>
                  {variants.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {Object.entries(v.attributes ?? {})
                        .map(([k, val]) => `${k}: ${val}`)
                        .join(' · ')}
                      {' — '}
                      {formatCurrency(v.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3" /> {error}
            </p>
          )}

          <div className="mt-auto pt-1">
            <Button
              size="sm"
              className="w-full sm:w-auto"
              disabled={!inStock || moveToCart.isPending}
              onClick={handleMove}
            >
              <ShoppingCart className="mr-1 h-4 w-4" />
              {moveToCart.isPending ? 'Moving…' : inStock ? 'Move to Cart' : 'Out of Stock'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function WishlistPage() {
  const { t } = useTranslation()
  const token = useAuthStore((s) => s.token)
  const { data: items, isLoading, isError, refetch } = useWishlist(!!token)
  const clear = useClearWishlist()

  if (!token) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{t('Your wishlist is empty')}</h1>
        <p className="mt-2 text-muted-foreground">{t('Sign in to view your wishlist.')}</p>
        <Button asChild className="mt-6">
          <Link to="/login">{t('Sign In')}</Link>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Skeleton className="mb-4 h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-bold">{t('Could not load your wishlist')}</h1>
        <p className="mt-2 text-muted-foreground">{t('Something went wrong while fetching your wishlist.')}</p>
        <Button className="mt-6" onClick={() => refetch()}>
          <RefreshCw className="mr-1 h-4 w-4" /> {t('Try Again')}
        </Button>
      </div>
    )
  }

  const list = items ?? []

  if (list.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{t('Your wishlist is empty')}</h1>
        <p className="mt-2 text-muted-foreground">{t('Save products you love and move them to your cart anytime.')}</p>
        <Button asChild className="mt-6">
          <Link to="/shop">{t('Browse Products')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('My Wishlist')}</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/account/wishlist-notifications">{t('Notifications')}</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => clear.mutate()} disabled={clear.isPending}>
            <Trash2 className="mr-1 h-4 w-4" /> {t('Clear All')}
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        {list.map((item) => (
          <WishlistCard key={item.id} item={item} onMoved={() => refetch()} />
        ))}
      </div>
    </div>
  )
}