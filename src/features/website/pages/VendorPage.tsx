import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { assetUrl } from '@/lib/assets'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { MapPin, Store } from 'lucide-react'
import { getVendor } from '@/services/vendorReview'
import { getVendorProducts } from '@/services/product'
import { ProductCard } from '@/components/ProductCard'
import { PaginationBar } from '@/components/PaginationBar'
import { VendorReviewSection } from '@/components/common/VendorReviewSection'
import { RatingStars } from '@/components/common/RatingStars'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslation } from 'react-i18next'

const PER_PAGE = 12

export function VendorPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const vendorId = Number(id)
  const [searchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)
  const [perPage, setPerPage] = useState(PER_PAGE)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)')
    const update = () => setPerPage(mq.matches ? 15 : 12)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor', vendorId],
    queryFn: () => getVendor(vendorId),
    enabled: Number.isFinite(vendorId) && vendorId > 0,
  })

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['vendor-products', vendorId, page, perPage],
    queryFn: () => getVendorProducts(vendorId, { page, per_page: perPage }),
    enabled: Number.isFinite(vendorId) && vendorId > 0,
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-muted-foreground">{t('Vendor not found.')}</p>
        <Button asChild className="mt-4">
          <Link to="/shop">{t('Browse products')}</Link>
        </Button>
      </div>
    )
  }

  const productItems = products?.data ?? []
  const totalProducts = products?.total ?? productItems.length
  const lastPage = products?.last_page ?? 1
  const ratingCount = vendor.rating_count ?? 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="shrink-0">
          {vendor.logo ? (
            <img
              src={assetUrl(vendor.logo)}
              alt={vendor.store_name}
              className="h-24 w-24 rounded-xl border object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl border bg-muted">
              <Store className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{vendor.store_name}</h1>
          {ratingCount ? (
            <div className="mt-1 flex items-center gap-2">
              <RatingStars value={vendor.rating_avg ?? 0} readonly />
              <span className="text-sm text-muted-foreground">
                {vendor.rating_avg ?? 0} (
                {ratingCount > 1
                  ? t('{{count}} reviews', { count: ratingCount })
                  : t('{{count}} review', { count: ratingCount })}
                )
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('No ratings yet')}</p>
          )}
          {vendor.city && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {vendor.city}
              {vendor.state ? `, ${vendor.state}` : ''}
            </p>
          )}
          {vendor.description && <p className="mt-3 text-sm leading-relaxed">{vendor.description}</p>}
        </div>
      </div>

      <div className="mt-8">
        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">{t('Products ({{count}})', { count: totalProducts })}</TabsTrigger>
            <TabsTrigger value="reviews">{t('Reviews ({{count}})', { count: ratingCount })}</TabsTrigger>
          </TabsList>
          <TabsContent value="products" className="pt-4">
            {productsLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-xl" />
                ))}
              </div>
            ) : productItems.length ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {productItems.map((product) => (
                  <ProductCard key={product.id} product={product} variant="minimal" />
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                {t('This vendor has no products yet.')}
              </p>
            )}
            <div className="mt-8">
              <PaginationBar
                page={page}
                lastPage={lastPage}
                buildPageHref={(p) => (p > 1 ? `?page=${p}` : '?')}
              />
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="pt-4">
            <VendorReviewSection vendorId={vendorId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
