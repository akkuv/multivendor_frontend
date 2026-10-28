import { useEffect } from 'react'
import { isAxiosError } from 'axios'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, PackageSearch, RotateCcw } from 'lucide-react'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCollection, useCollections } from '@/hooks/useCatalog'
import { assetUrl } from '@/lib/assets'
import { ProductListing } from './CategoryPage'
import type { Collection } from '@/types'
import { useTranslation } from 'react-i18next'

const genderStyleLine: Record<Collection['gender'], string> = {
  female: 'Womenswear edit',
  male: 'Menswear edit',
  kids: 'Kidswear edit',
  unisex: 'For everyone',
}

const genderLabel: Record<Collection['gender'], string> = {
  female: 'Women',
  male: 'Men',
  kids: 'Kids',
  unisex: 'Unisex',
}

function CollectionBanner({ collection }: { collection: Collection }) {
  const image = collection.banner_image ?? collection.image

  return (
    <section className="bg-ivory pt-4 sm:pt-5">
      <div className="container-store">
        <div className="relative overflow-hidden bg-[#241f18]">
          {image ? (
            <img src={assetUrl(image)} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#f3e9d4] via-[#faf5e9] to-[#ecdcb8]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
          <div className="relative flex min-h-[240px] items-end px-5 py-6 sm:min-h-[320px] sm:px-8 sm:py-8 lg:min-h-[380px]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/80">
                {genderLabel[collection.gender]}
              </p>
              <p className="mt-2 max-w-2xl font-serif text-2xl font-semibold leading-tight text-white drop-shadow sm:text-3xl">
                {collection.name}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function MoreCollections({ currentSlug }: { currentSlug: string }) {
  const { t } = useTranslation()
  const { data: collections = [] } = useCollections()
  const others = collections.filter((collection) => collection.slug !== currentSlug).slice(0, 6)

  if (others.length === 0) return null

  return (
    <section className="bg-ivory pb-14 pt-4 sm:pb-16">
      <div className="container-store">
        <h2 className="heading-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {t('Explore more collections')}
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {others.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.slug}`}
              className="group block"
            >
              <div className="relative aspect-square overflow-hidden bg-[#241f18]">
                {collection.image && (
                  <img
                    src={assetUrl(collection.image)}
                    alt={collection.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                )}
              </div>
              <p className="mt-2.5 text-sm font-semibold text-ink transition-colors group-hover:text-gold-deep">
                {collection.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function CollectionsPageLoading() {
  return (
    <div className="min-h-screen bg-ivory">
      <Skeleton className="h-12 w-full rounded-none bg-line-warm" />
      <div className="container-store pt-4 sm:pt-5">
        <Skeleton className="h-[240px] w-full rounded-none bg-gold-soft/40 sm:h-[320px] lg:h-[380px]" />
      </div>
      <div className="container-store pb-12 pt-8 sm:pt-10">
        <div className="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
          <div className="hidden space-y-1 lg:block">
            <Skeleton className="h-5 w-24 bg-gold-soft/50" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-none bg-gold-soft/30" />
            ))}
          </div>
          <div className="min-w-0">
            <div className="mb-6 space-y-3">
              <Skeleton className="h-3 w-28 bg-gold-soft/50" />
              <Skeleton className="h-8 w-80 max-w-full bg-gold-soft/50" />
              <Skeleton className="h-4 w-full max-w-xl bg-gold-soft/50" />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index}>
                  <Skeleton className="aspect-[5/7] w-full rounded-none bg-gold-soft/50" />
                  <div className="space-y-2.5 px-1 pt-3">
                    <Skeleton className="h-2.5 w-1/3 bg-gold-soft/50" />
                    <Skeleton className="h-4 w-4/5 bg-gold-soft/50" />
                    <Skeleton className="h-4 w-1/2 bg-gold-soft/50" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CollectionsPage() {
  const { t } = useTranslation()
  const { slug } = useParams()
  const { data: collection, error, isLoading, refetch } = useCollection(slug)
  const notFound = isAxiosError(error) && error.response?.status === 404

  useEffect(() => {
    if (!collection) return
    const title = collection.meta_title ?? collection.name
    document.title = `${title} | Waplia`

    const description = collection.meta_description ?? collection.description
    if (!description) return
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (meta) meta.content = description
  }, [collection])

  if (isLoading) return <CollectionsPageLoading />

  if (error || !collection) {
    return (
      <div className="flex min-h-[58vh] items-center justify-center bg-cream px-4 py-16">
        <div className="w-full max-w-lg rounded-3xl border border-line-warm bg-ivory px-6 py-12 text-center shadow-[0_24px_60px_-30px_rgba(63,45,12,0.45)] sm:px-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-soft text-gold-deep ring-1 ring-gold-mid/30">
            {notFound ? <PackageSearch className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
          </span>
          <h1 className="heading-serif mt-6 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {notFound ? t('Collection not found') : t('This page is temporarily unavailable')}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-soft">
            {notFound
              ? t('The collection may have moved or is no longer available.')
              : t('We could not load this collection. Please try again in a moment.')}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {!notFound && (
              <Button onClick={() => refetch()} className="rounded-full bg-ink px-6 font-bold text-[#e9c891] hover:bg-[#2c2620]">
                <RotateCcw className="h-4 w-4" /> {t('Try again')}
              </Button>
            )}
            <Button asChild variant="outline" className="rounded-full border-line-warm font-bold text-ink hover:bg-cream hover:text-gold-deep">
              <Link to="/collections">{t('Browse all collections')}</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ivory">
      <Breadcrumb
        className="border-line-warm bg-ivory"
        items={[
          { label: t('Home'), to: '/' },
          { label: t('Collections'), to: '/collections' },
          { label: collection.name },
        ]}
      />
      <CollectionBanner collection={collection} />
      <ProductListing
        title={collection.name}
        description={collection.description}
        styleLine={t(genderStyleLine[collection.gender])}
        scopeKey="collection_id"
        scopeValue={collection.id}
        entityName={collection.name}
      />
      <MoreCollections currentSlug={collection.slug} />
    </div>
  )
}
