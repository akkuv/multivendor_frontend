import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { PackageSearch, RotateCcw, Sparkles } from 'lucide-react'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PaginationBar } from '@/components/PaginationBar'
import { ProductCard } from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useProducts } from '@/hooks/useProducts'
import { cn } from '@/lib/utils'
import type { ProductQuery } from '@/services/product'
import { useTranslation } from 'react-i18next'

function buildQS(params: URLSearchParams, page: number): string {
  const next = new URLSearchParams(params)
  if (page === 1) next.delete('page')
  else next.set('page', String(page))
  return next.toString()
}

export function ProductCollectionPage({
  title,
  eyebrow,
  description,
  query,
  cardVariant = 'minimal',
}: {
  title: string
  eyebrow: string
  description: string
  query: ProductQuery
  cardVariant?: 'default' | 'minimal' | 'retail'
}) {
  const [searchParams] = useSearchParams()
  const { t } = useTranslation()
  const page = Number(searchParams.get('page') ?? '1')
  const [perPage, setPerPage] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches ? 15 : 12,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)')
    const update = () => setPerPage(mq.matches ? 15 : 12)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  const { data, isLoading, isFetching } = useProducts({ ...query, page, per_page: perPage })

  return (
    <div className="bg-ivory">
      <Breadcrumb items={[{ label: title }]} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="relative overflow-hidden rounded-[1.4rem] border border-line-warm bg-cream">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-mid/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-gold-deep/10 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-6 px-6 py-10 sm:px-10 sm:py-12 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.24em] text-gold-deep">
                <span className="h-px w-8 bg-gold-deep/60" />
                {eyebrow}
              </p>
              <h1 className="heading-serif mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-soft sm:text-base">{description}</p>
            </div>
            <div className="shrink-0 rounded-2xl border border-line-warm bg-ivory px-5 py-4 text-center shadow-[0_18px_40px_-30px_rgba(63,45,12,0.4)]">
              <Sparkles className="mx-auto h-4 w-4 text-gold-deep" />
              <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{data?.total ?? 0}</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-ink-soft/60">
                {data?.total === 1 ? t('Product') : t('Products')}
              </p>
            </div>
          </div>
        </section>

        <div className="mb-6 mt-8 flex items-end justify-between gap-4 px-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-deep">{t('Curated selection')}</p>
            <h2 className="heading-serif mt-1 text-2xl font-semibold tracking-tight text-ink">
              {t('Explore {{title}}', { title: title.toLowerCase() })}
            </h2>
          </div>
          <p className="text-xs text-ink-soft" aria-live="polite">
            {t('Page {{page}} of {{total}}', { page, total: data?.last_page ?? 1 })}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="overflow-hidden rounded-xl border border-line-warm bg-ivory">
                <Skeleton className="aspect-square w-full rounded-none bg-gold-soft/60" />
                <div className="space-y-3 p-3.5">
                  <Skeleton className="h-3 w-2/5 bg-gold-soft/60" />
                  <Skeleton className="h-4 w-4/5 bg-gold-soft/60" />
                  <Skeleton className="h-5 w-2/5 bg-gold-soft/60" />
                  <Skeleton className="h-9 w-full rounded-full bg-gold-soft/60" />
                </div>
              </div>
            ))}
          </div>
        ) : data && data.data.length > 0 ? (
          <>
            <div
              className={cn(
                'grid grid-cols-2 gap-3 transition-opacity duration-300 sm:gap-4 md:grid-cols-3 xl:grid-cols-4',
                isFetching && 'pointer-events-none opacity-45',
              )}
              aria-busy={isFetching}
            >
              {data.data.map((product) => (
                <ProductCard key={product.id} product={product} variant={cardVariant} />
              ))}
            </div>
            <div className="mt-10">
              <PaginationBar
                page={page}
                lastPage={data.last_page}
                buildPageHref={(targetPage) => `?${buildQS(searchParams, targetPage)}`}
              />
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-line-warm bg-ivory px-6 py-16 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-soft text-gold-deep ring-1 ring-gold-mid/30">
              <PackageSearch className="h-7 w-7" />
            </span>
            <h3 className="heading-serif mt-5 text-xl font-semibold tracking-tight text-ink">{t('Nothing here just yet')}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">
              {t('This curated collection is being refreshed. Explore the full marketplace in the meantime.')}
            </p>
            <Button
              asChild
              className="mt-6 rounded-full bg-ink px-6 text-sm font-bold uppercase tracking-[0.1em] text-[#e9c891] transition-colors hover:bg-[#2c2620]"
            >
              <Link to="/shop">
                <RotateCcw className="h-4 w-4" /> {t('Browse the full shop')}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}