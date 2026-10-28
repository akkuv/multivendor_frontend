import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  ChevronDown,
  PackageSearch,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Store,
  Tag,
  Truck,
  X,
} from 'lucide-react'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PaginationBar } from '@/components/PaginationBar'
import { ProductCard } from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useBrands } from '@/hooks/useCatalog'
import { useCategories } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'
import { cn } from '@/lib/utils'
import { assetUrl } from '@/lib/assets'
import type { Category, Product } from '@/types'
import { formatCurrency } from '@/utils/format'
import { useTranslation } from 'react-i18next'

const sortOptions = [
  { value: 'latest', label: 'Newest first' },
  { value: 'best_selling', label: 'Best selling' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'discount', label: 'Biggest discount' },
]

function FilterSelect({
  label,
  icon,
  value,
  onChange,
  children,
}: {
  label: string
  icon: ReactNode
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft">
        {icon}
        {label}
      </span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full appearance-none rounded-full border border-ink/15 bg-ivory px-4 pr-9 text-sm font-medium text-ink shadow-sm outline-none transition focus:border-gold-deep focus:ring-4 focus:ring-gold-deep/15"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/60" />
      </span>
    </label>
  )
}

function ShowcaseCard({ product }: { product?: Product }) {
  const image = product?.images?.[0]
  const discount = product && product.discount_percent > 0 ? product.discount_percent : null
  if (!product) return null
  return (
    <div className="group relative block m-0 w-full">
      <div className="relative overflow-hidden rounded-2xl ring-1 ring-line-warm">
        <Link
          to={`/product/${product.slug}`}
          className="block aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-[#f3e9d4] via-[#faf5e9] to-[#ecdcb8]"
        >
          {image ? (
            <img
              src={assetUrl(image)}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[#a08a5c]">
              <PackageSearch className="h-12 w-12" />
            </span>
          )}
        </Link>
        {discount && (
          <span className="absolute left-3 top-3 bg-[#F2D6C2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#3A0B08] shadow-sm">
            {discount}% OFF
          </span>
        )}
        <Link
          to={`/product/${product.slug}`}
          className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-xl bg-ivory/95 p-3 shadow-md ring-1 ring-line-warm backdrop-blur transition-all group-hover:shadow-lg"
        >
          <span className="min-w-0">
            <span className="block truncate text-xs font-semibold text-ink">{product.name}</span>
            <span className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-ink">{formatCurrency(product.price)}</span>
              {product.mrp && product.mrp > product.price && (
                <span className="text-[10px] text-ink-soft/60 line-through">{formatCurrency(product.mrp)}</span>
              )}
            </span>
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[#e9c891] transition-colors group-hover:bg-[#2c2620]">
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </div>
  )
}

function CategoryTile({ category, active, onClick, count }: {
  category: Category
  active: boolean
  onClick: () => void
  count?: number
}) {
  const { t } = useTranslation()

  return (
    // <button
    //   type="button"
    //   onClick={onClick}
    //   className={cn(
    //     'group relative aspect-[4/5] w-[46%] shrink-0 snap-start overflow-hidden rounded-2xl text-left transition-all duration-300 sm:w-[30%] md:w-[calc((100%-112px)/8)]',
    //     active
    //       ? 'ring-2 ring-gold-deep ring-offset-2 ring-offset-ivory'
    //       : 'ring-1 ring-line-warm hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-24px_rgba(160,122,40,0.5)] hover:ring-gold-mid/60',
    //   )}
    // >
    <button
  type="button"
  onClick={onClick}
  className={cn(
    'group relative aspect-[4/5] w-[42%] min-w-0 shrink-0 snap-start overflow-hidden rounded-2xl text-left transition-all duration-300 sm:w-[20%] md:w-[18%] lg:w-[16%] xl:w-[13%] 2xl:w-[13%]',
    active
      ? 'ring-2 ring-gold-deep ring-offset-2 ring-offset-ivory'
      : 'ring-1 ring-line-warm hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-24px_rgba(160,122,40,0.5)] hover:ring-gold-mid/60',
  )}
>
      {category.image ? (
        <img
          src={assetUrl(category.image)}
          alt={category.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center bg-gold-soft text-gold-deep">
          <Tag className="h-8 w-8" />
        </span>
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <span className="absolute inset-x-3 bottom-3">
        <span className="block text-xs font-semibold leading-tight text-white drop-shadow">{category.name}</span>
        {count != null && (
          <span className="mt-1 inline-flex rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/85 backdrop-blur">
            {count === 1 ? t('{{count}} item', { count }) : t('{{count}} items', { count })}
          </span>
        )}
      </span>
    </button>
  )
}

export function ShopPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')
  const search = searchParams.get('search') ?? ''
  const categoryId = searchParams.get('category_id') ?? searchParams.get('category') ?? ''
  const categoryScopeId = searchParams.get('category_scope_id') ?? ''
  const activeCategoryId = categoryScopeId || categoryId
  const brandId = searchParams.get('brand_id') ?? ''
  const sort = searchParams.get('sort') ?? 'latest'

  const { data: categories } = useCategories()
  const { data: brands } = useBrands()
  const categoryTrackRef = useRef<HTMLDivElement>(null)

  // Responsive page size: 15 products per page on xl screens, 12 otherwise.
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

  const scrollCategories = (direction: 1 | -1) => {
    const track = categoryTrackRef.current
    if (!track) return
    const firstItem = track.firstElementChild as HTMLElement | null
    if (!firstItem) return
    const gap = Number.parseFloat(getComputedStyle(track).gap || '12')
    track.scrollBy({ left: direction * (firstItem.offsetWidth + gap), behavior: 'smooth' })
  }

  const query = useMemo(
    () => ({
      page,
      search: search || undefined,
      category_id: categoryId ? Number(categoryId) : undefined,
      category_scope_id: categoryScopeId ? Number(categoryScopeId) : undefined,
      brand_id: brandId ? Number(brandId) : undefined,
      sort: sort !== 'latest' ? sort : undefined,
      per_page: perPage,
    }),
    [page, search, categoryId, categoryScopeId, brandId, sort, perPage],
  )

  const { data, isLoading, isFetching } = useProducts(query)

  const allCategories = useMemo(
    () => [...(categories ?? []), ...(categories ?? []).flatMap((category) => category.children ?? [])],
    [categories],
  )
  const parentCategories = useMemo(
    () => (categories ?? []).filter((category) => !category.parent_id),
    [categories],
  )
  const topCategories = parentCategories
  const heroProduct = data?.data?.[0]
  const selectedCategory = allCategories.find((category) => String(category.id) === activeCategoryId)
  const selectedBrand = brands?.find((brand) => String(brand.id) === brandId)
  const hasFilters = !!(search || categoryId || categoryScopeId || brandId || (sort && sort !== 'latest'))

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (key === 'category_id') next.delete('category_scope_id')
    if (!value || value === 'latest') next.delete(key)
    else next.set(key, value)
    next.delete('page')
    setSearchParams(next)
  }

  function clearFilters() {
    setSearchParams({})
  }

  const resultLabel = search
    ? t('Results for “{{search}}”', { search })
    : selectedCategory
      ? selectedCategory.name
      : selectedBrand
        ? selectedBrand.name
        : t('All products')

  return (
    <div className="bg-ivory">
      <Breadcrumb
        items={[
          ...(selectedCategory ? [{ label: selectedCategory.name, to: `/category/${selectedCategory.slug}` }] : []),
          { label: search ? t('Search: {{search}}', { search }) : t('Shop') },
        ]}
      />

      <div className="container-store py-8 sm:py-10">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-line-warm bg-gradient-to-br from-cream via-ivory to-cream">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-mid/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-gold-deep/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-gold-mid/60 to-transparent" />
          {/* <div className="relative grid items-center gap-10 px-6 py-10 sm:px-10 sm:py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-14"> */}
          <div className="relative grid grid-cols-1 items-center gap-10 px-6 py-10 sm:px-10 sm:py-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] lg:py-14">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.24em] text-gold-deep">
                <span className="h-px w-8 bg-gold-deep/60" />
                {t('New season · curated for you')}
              </p>
              <h1 className="heading-serif mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">
                {t('Find something')}{' '}
                <span className="italic text-gold-deep">{t('remarkable.')}</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-ink-soft sm:text-base">
                {t('A considered edit of everyday staples and standout pieces from the independent sellers we trust.')}
              </p>

              {/* <div className="mt-7 flex flex-wrap items-center gap-4">
                <Button
                  asChild
                  className="h-12 rounded-full bg-ink px-7 text-sm font-bold uppercase tracking-[0.1em] text-[#e9c891] shadow-lg shadow-[#8a6a1f]/15 transition-colors hover:bg-[#2c2620]"
                >
                  <a href="#shop-results">
                    {t('Shop now')} <ArrowRight className="ml-1 h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="link"
                  className="h-auto gap-2 p-0 text-sm font-semibold text-ink hover:text-gold-deep"
                >
                  <a href="#shop-results">
                    <ShieldCheck className="h-4 w-4 text-gold-deep" /> {t('Buyer protection')}
                  </a>
                </Button>
              </div> */}

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-ink-soft">
                <span className="inline-flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-gold-deep" /> {t('Fast tracked delivery')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BadgePercent className="h-4 w-4 text-gold-deep" /> {t('Weekly drops & offers')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <RotateCcw className="h-4 w-4 text-gold-deep" /> {t('Easy returns')}
                </span>
              </div>

              <div className="mt-8 flex items-center gap-8 border-t border-line-warm pt-6">
                {[
                  { value: data?.total ?? 0, label: t('Products') },
                  { value: allCategories.length, label: t('Categories') },
                  { value: brands?.length ?? 0, label: t('Brands') },
                ].map((stat, index) => (
                  <div key={stat.label} className={cn(index > 0 && 'border-l border-line-warm pl-8')}>
                    <p className="heading-serif text-2xl font-semibold tracking-tight text-ink">{stat.value}</p>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-soft/60">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-w-0">
              {isLoading ? (
                <Skeleton className="aspect-[4/5] w-full rounded-2xl bg-gold-soft/60" />
              ) : (
                <ShowcaseCard product={heroProduct} />
              )}
              {/* <span className="pointer-events-none absolute -right-3 -top-3 hidden rounded-full bg-ink px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#e6c97e] shadow-lg shadow-[#8a6a1f]/30 sm:inline-flex sm:items-center">
                <Sparkles className="mr-1 inline h-3 w-3" /> {t('Featured')}
              </span> */}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              {/* <p className="eyebrow text-gold-deep">{t('Categories')}</p> */}
              <h2 className="heading-serif mt-1 text-2xl font-semibold tracking-tight text-ink">{t('Shop by category')}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollCategories(-1)}
                aria-label={t('Scroll categories left')}
                className="grid h-9 w-9 place-items-center rounded-full border border-line-warm bg-ivory text-ink-soft transition-all hover:border-gold-mid/60 hover:bg-cream hover:text-gold-deep"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollCategories(1)}
                aria-label={t('Scroll categories right')}
                className="grid h-9 w-9 place-items-center rounded-full border border-line-warm bg-ivory text-ink-soft transition-all hover:border-gold-mid/60 hover:bg-cream hover:text-gold-deep"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div
            ref={categoryTrackRef}
            className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4"
          >
            {topCategories.map((category) => (
              <CategoryTile
                key={category.id}
                category={category}
                count={category.products_count ?? undefined}
                active={String(category.id) === activeCategoryId}
                onClick={() => updateParam('category_id', String(category.id))}
              />
            ))}
          </div>
        </section>

        <div id="shop-results" className="mt-12 scroll-mt-28">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              {/* <p className="eyebrow text-gold-deep">{t('Marketplace')}</p> */}
              <h2 className="heading-serif mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{resultLabel}</h2>
              {/* <p className="mt-1 text-sm text-ink-soft" aria-live="polite">
                {data?.total === 1
                  ? t('{{count}} product found', { count: data?.total ?? 0 })
                  : t('{{count}} products found', { count: data?.total ?? 0 })}
              </p> */}
            </div>
            <div className=" items-center gap-2 text-sm font-semibold text-ink-soft sm:flex">
              {/* <SlidersHorizontal className="h-4 w-4 text-ink-soft/60" /> {t('Filters')} */}
              <p className="mt-1 text-sm text-ink-soft" aria-live="polite">
                {data?.total === 1
                  ? t('{{count}} product found', { count: data?.total ?? 0 })
                  : t('{{count}} products found', { count: data?.total ?? 0 })}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-line-warm bg-gradient-to-br from-ivory to-cream p-4 shadow-[0_18px_45px_-32px_rgba(63,45,12,0.45)] sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
              <div>
                <FilterSelect
                  label={t('Category')}
                  icon={<Tag className="h-3.5 w-3.5" />}
                  value={activeCategoryId}
                  onChange={(value) => updateParam('category_id', value)}
                >
                  <option value="">{t('All categories')}</option>
                  {parentCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </FilterSelect>
              </div>
              <div>
                <FilterSelect
                  label={t('Brand')}
                  icon={<Store className="h-3.5 w-3.5" />}
                  value={brandId}
                  onChange={(value) => updateParam('brand_id', value)}
                >
                  <option value="">{t('All brands')}</option>
                  {(brands ?? []).map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </FilterSelect>
              </div>
              <div>
                <FilterSelect
                  label={t('Sort by')}
                  icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
                  value={sort}
                  onChange={(value) => updateParam('sort', value)}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.label)}
                    </option>
                  ))}
                </FilterSelect>
              </div>
              <Button
                variant="ghost"
                onClick={clearFilters}
                disabled={!hasFilters}
                className="h-11 rounded-full border border-line-warm px-4 text-sm font-bold text-gold-deep hover:border-gold-mid/60 hover:bg-cream hover:text-[#8a6a1f] disabled:opacity-40"
              >
                <RotateCcw className="h-4 w-4" /> {t('Reset')}
              </Button>
            </div>

            {hasFilters && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line-warm pt-4">
                <span className="mr-1 text-xs font-semibold text-ink-soft">{t('Active:')}</span>
                {search && (
                  <button
                    type="button"
                    onClick={() => updateParam('search', '')}
                    className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-gold-deep ring-1 ring-gold-mid/40 transition hover:bg-gold-soft"
                  >
                    <Search className="h-3 w-3" /> “{search}” <X className="h-3 w-3" />
                  </button>
                )}
                {selectedCategory && (
                  <button
                    type="button"
                    onClick={() => updateParam('category_id', '')}
                    className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-gold-deep ring-1 ring-gold-mid/40 transition hover:bg-gold-soft"
                  >
                    {selectedCategory.name} <X className="h-3 w-3" />
                  </button>
                )}
                {selectedBrand && (
                  <button
                    type="button"
                    onClick={() => updateParam('brand_id', '')}
                    className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-gold-deep ring-1 ring-gold-mid/40 transition hover:bg-gold-soft"
                  >
                    {selectedBrand.name} <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 8 }, (_, index) => (
                  <div key={index} className="overflow-hidden rounded-2xl border border-line-warm bg-ivory shadow-sm">
                    <Skeleton className="aspect-[5/7] w-full rounded-none bg-gold-soft/60" />
                    <div className="space-y-3 p-4">
                      <Skeleton className="h-3 w-2/5 bg-gold-soft/60" />
                      <Skeleton className="h-4 w-4/5 bg-gold-soft/60" />
                      <Skeleton className="h-5 w-2/5 bg-gold-soft/60" />
                      <Skeleton className="h-9 w-full rounded-full bg-gold-soft/60" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data && data.data.length > 0 ? (
              <div
                className={cn(
                  'grid grid-cols-2 gap-3 transition-opacity duration-300 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 lg:gap-5',
                  isFetching && 'pointer-events-none opacity-45',
                )}
                aria-busy={isFetching}
              >
                {data.data.map((product) => (
                  <ProductCard key={product.id} product={product} variant="minimal" />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-line-warm bg-ivory px-6 py-16 text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-soft text-gold-deep ring-1 ring-gold-mid/30">
                  <PackageSearch className="h-7 w-7" />
                </span>
                <h3 className="heading-serif mt-5 text-xl font-semibold tracking-tight text-ink">{t('No products found')}</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">
                  {t('Try broadening your search or clearing a filter to discover more of the collection.')}
                </p>
                {hasFilters && (
                  <Button
                    onClick={clearFilters}
                    className="mt-6 rounded-full bg-ink px-6 text-sm font-bold uppercase tracking-[0.1em] text-[#e9c891] transition-colors hover:bg-[#2c2620]"
                  >
                    <RotateCcw className="h-4 w-4" /> {t('Clear all filters')}
                  </Button>
                )}
              </div>
            )}
          </div>

          {data && data.data.length > 0 && (
            <div className="mt-8 flex justify-center">
              <PaginationBar
                page={page}
                lastPage={data.last_page}
                buildPageHref={(targetPage) => `?${buildQS(searchParams, targetPage)}`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function buildQS(searchParams: URLSearchParams, page: number) {
  const next = new URLSearchParams(searchParams)
  if (page === 1) next.delete('page')
  else next.set('page', String(page))
  return next.toString()
}
