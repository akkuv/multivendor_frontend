import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { isAxiosError } from 'axios'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  Check,
  ChevronDown,
  PackageSearch,
  Quote,
  RotateCcw,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react'
import { Breadcrumb } from '@/components/Breadcrumb'
import { HomeSections } from '@/components/home/HomeSections'
import { PaginationBar } from '@/components/PaginationBar'
import { CollectionCard } from '@/components/common/CollectionCard'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategoryPage } from '@/hooks/useCategoryPages'
import { useCategories } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'
import { cn } from '@/lib/utils'
import { assetUrl } from '@/lib/assets'
import type { Category, CategoryPage, HomeBanner, Testimonial } from '@/types'
import { useTranslation } from 'react-i18next'

const sortOptions = [
  { value: 'latest', label: 'New' },
  { value: 'best_selling', label: 'Best selling' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'discount', label: 'Biggest discount' },
]

const priceOptions = [
  { value: 'under-1000', label: 'Under ₹1,000' },
  { value: '1000-3000', label: '₹1,000 to ₹3,000' },
  { value: '3000-7000', label: '₹3,000 to ₹7,000' },
  { value: 'over-7000', label: 'Above ₹7,000' },
]

const discountOptions = [
  { value: '10', label: '10% and above' },
  { value: '25', label: '25% and above' },
  { value: '40', label: '40% and above' },
  { value: '50', label: '50% and above' },
]

const ratingOptions = [
  { value: '4', label: '4 stars and above' },
  { value: '3', label: '3 stars and above' },
]

type FilterKey = 'productCategory' | 'subCategory' | 'color' | 'size' | 'brand' | 'price' | 'discount' | 'rating' | 'stock'
type FilterValues = Record<FilterKey, string>

const filterParam: Record<FilterKey, string> = {
  productCategory: 'product_category',
  subCategory: 'sub_category',
  color: 'color',
  size: 'size',
  brand: 'brand',
  price: 'price',
  discount: 'discount',
  rating: 'rating',
  stock: 'stock',
}

function getValidPage(value: string | null) {
  const page = Number(value ?? '1')
  return Number.isInteger(page) && page > 0 ? page : 1
}

function getValidSort(value: string | null) {
  return sortOptions.some((option) => option.value === value) ? (value as string) : 'latest'
}

function getPositiveNumber(value: string | null) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : undefined
}

function getPriceBounds(value: string): [number | undefined, number | undefined] {
  if (value === 'under-1000') return [undefined, 1000]
  if (value === '1000-3000') return [1000, 3000]
  if (value === '3000-7000') return [3000, 7000]
  if (value === 'over-7000') return [7000, undefined]
  return [undefined, undefined]
}

function buildPageHref(searchParams: URLSearchParams, page: number) {
  const next = new URLSearchParams(searchParams)
  if (page === 1) next.delete('page')
  else next.set('page', String(page))
  const query = next.toString()
  return query ? `?${query}` : ''
}

/**
 * Collection heading copy, sourced only from what the admin saved on the
 * category page. Nothing is generated or pattern-matched from the category
 * name, so a blank field stays blank instead of being filled with invented
 * text: the storefront shows exactly what the admin typed. Falls back to the
 * category's own description, which is itself admin-managed.
 */
function resolveCategoryCopy(page: CategoryPage) {
  const styleLine = page.subtitle?.trim() || null
  const description =
    page.description?.trim() || page.category.description?.trim() || null
  return { styleLine, description }
}

/**
 * KALKI-mirrored collection header: a clean full-bleed banner image on top,
 * followed by the collection title block on ivory. The H1 lives in
 * `CategoryIntro` (below the banner) exactly like the reference page, so the
 * banner stays a pure image and the title is never duplicated on top of it.
 */
function CategoryBanner({ banner, category }: { banner?: HomeBanner; category: Category }) {
  const image = banner?.image ?? banner?.mobile_image ?? category.image
  const genericSubtitle = `${category.name} category`.toLowerCase()
  const caption =
    banner?.subtitle && banner.subtitle.trim().toLowerCase() !== genericSubtitle ? banner.subtitle : null

  return (
    <section className="px-3 pt-3 sm:px-5 sm:pt-5 lg:px-8">
      <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[1.4rem] bg-[#241f18] shadow-[0_18px_55px_-28px_rgba(20,12,28,0.55)] sm:rounded-[1.75rem]">
        {image ? (
          <img src={assetUrl(image)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#f3e9d4] via-[#faf5e9] to-[#ecdcb8]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
        <div className="relative flex min-h-[240px] items-end px-5 py-6 sm:min-h-[320px] sm:px-8 sm:py-8 lg:min-h-[400px]">
          {caption && (
            <p className="max-w-2xl font-serif text-xl font-semibold leading-tight text-white drop-shadow sm:text-2xl">
              {caption}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

/** Title block placed in the grid column of the listing (KALKI puts the H1
 *  level with the filter sidebar, not as a separate full-width hero). Shared by
 *  category pages and KALKI-style collection pages. */
export function ProductTitleBlock({
  title,
  styleLine,
  description,
}: {
  title: string
  styleLine: string | null
  description: string | null
}) {
  return (
    <div className="mb-6 w-full">
      <h1 className="heading-serif w-full text-2xl font-semibold tracking-tight text-ink sm:text-3xl lg:text-[2rem] lg:leading-[1.15]">
        {title}
      </h1>
      {styleLine && <p className="mt-2 w-full font-serif text-lg italic text-gold-deep sm:text-xl">{styleLine}</p>}
      {description && <p className="mt-3 w-full text-sm leading-7 text-ink-soft">{description}</p>}
    </div>
  )
}

interface FacetOption {
  key: string
  label: string
  count: number
  slug?: string
}

const colorSwatches: Record<string, string> = {
  black: '#1c1c1c',
  white: '#ffffff',
  rose: '#d98a9a',
  teal: '#2f8f8a',
  burgundy: '#6d1f2e',
  forest: '#2f5233',
  mustard: '#d4a72c',
  navy: '#1f2a44',
  blue: '#2f6fb0',
  red: '#c0392b',
  green: '#3f8f4f',
  yellow: '#e8c547',
  pink: '#e8a6bf',
  grey: '#9aa0a6',
  gray: '#9aa0a6',
  beige: '#d8c7a8',
  brown: '#7b5231',
  purple: '#6a4c93',
  orange: '#e08a3c',
  maroon: '#7b2f3a',
  olive: '#6b7a3a',
  cream: '#f4ecd8',
  gold: '#c9a227',
  silver: '#c0c4c8',
}

function colorToHex(name: string): string {
  return colorSwatches[name.trim().toLowerCase()] ?? '#e5ddcd'
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group border-b border-line-warm [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 text-sm font-semibold text-ink transition-colors hover:text-gold-deep">
        {title}
        <ChevronDown className="h-4 w-4 text-ink-soft/60 transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-4 pt-1">{children}</div>
    </details>
  )
}

function RadioRow({
  name,
  checked,
  label,
  count,
  swatch,
  onChange,
}: {
  name: string
  checked: boolean
  label: string
  count?: number
  swatch?: string
  onChange: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5 text-sm text-ink-soft transition-colors hover:text-ink">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      {swatch ? (
        <span
          className={cn(
            'h-5 w-5 shrink-0 rounded-full ring-1 ring-black/10 transition',
            checked && 'ring-2 ring-ink ring-offset-2',
          )}
          style={{ backgroundColor: swatch }}
        />
      ) : (
        <span
          className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition',
            checked ? 'border-ink bg-ink' : 'border-ink/25',
          )}
        >
          {checked && <span className="h-1.5 w-1.5 rounded-full bg-[#e9c891]" />}
        </span>
      )}
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && <span className="text-xs tabular-nums text-ink-soft/50">{count}</span>}
    </label>
  )
}

function FilterPanel({
  idPrefix,
  categories,
  subcategories,
  colors,
  sizes,
  brands,
  values,
  activeCount,
  onChange,
  onClear,
}: {
  idPrefix: string
  categories: FacetOption[]
  subcategories: FacetOption[]
  colors: FacetOption[]
  sizes: FacetOption[]
  brands: FacetOption[]
  values: FilterValues
  activeCount: number
  onChange: (key: FilterKey, value: string) => void
  onClear: () => void
}) {
  const { t } = useTranslation()
  const toggle = (key: FilterKey, value: string) => (current: string) => onChange(key, current === value ? '' : value)

  return (
    <div>
      <div className="flex items-center justify-between border-b border-ink/15 pb-3">
        <h3 className="flex items-center text-xs font-bold uppercase tracking-[0.18em] text-ink">
          {t('Filters')}
          {activeCount > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[10px] text-[#e6c97e]">
              {activeCount}
            </span>
          )}
        </h3>
        <button
          type="button"
          onClick={onClear}
          disabled={activeCount === 0}
          className="text-xs font-semibold text-gold-deep hover:text-[#8a6a1f] disabled:cursor-default disabled:opacity-35"
        >
          {t('Clear all')}
        </button>
      </div>

      {categories.length > 0 && (
        <FilterGroup title={t('Product Category')}>
          {categories.map((option) => (
            <RadioRow
              key={option.key}
              name={`${idPrefix}-category`}
              checked={values.productCategory === option.key}
              label={option.label}
              count={option.count}
              onChange={() => toggle('productCategory', option.key)(values.productCategory)}
            />
          ))}
        </FilterGroup>
      )}

      {subcategories.length > 0 && (
        <FilterGroup title={t('Sub Categories')}>
          {subcategories.map((option) => (
            <RadioRow
              key={option.key}
              name={`${idPrefix}-subcategory`}
              checked={values.subCategory === option.key}
              label={option.label}
              count={option.count}
              onChange={() => toggle('subCategory', option.key)(values.subCategory)}
            />
          ))}
        </FilterGroup>
      )}

      {colors.length > 0 && (
        <FilterGroup title={t('Color')}>
          {colors.map((option) => (
            <RadioRow
              key={option.key}
              name={`${idPrefix}-color`}
              checked={values.color === option.key}
              label={option.label}
              count={option.count}
              swatch={colorToHex(option.label)}
              onChange={() => toggle('color', option.key)(values.color)}
            />
          ))}
        </FilterGroup>
      )}

      {sizes.length > 0 && (
        <FilterGroup title={t('Size')}>
          <div className="flex flex-wrap gap-2 pt-1">
            {sizes.map((option) => {
              const active = values.size === option.key
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onChange('size', active ? '' : option.key)}
                  className={cn(
                    'h-9 min-w-11 rounded-full border px-3 text-xs font-semibold uppercase transition',
                    active
                      ? 'border-ink bg-ink text-[#e9c891]'
                      : 'border-line-warm text-ink-soft hover:border-ink/40 hover:text-ink',
                  )}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </FilterGroup>
      )}

      {brands.length > 0 && (
        <FilterGroup title={t('Brand')}>
          <div className="max-h-56 overflow-y-auto pr-1">
            {brands.map((option) => (
              <RadioRow
                key={option.key}
                name={`${idPrefix}-brand`}
                checked={values.brand === option.key}
                label={option.label}
                count={option.count}
                onChange={() => toggle('brand', option.key)(values.brand)}
              />
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title={t('Price')}>
        {priceOptions.map((option) => (
          <RadioRow
            key={option.value}
            name={`${idPrefix}-price`}
            checked={values.price === option.value}
            label={t(option.label)}
            onChange={() => toggle('price', option.value)(values.price)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title={t('Discount')}>
        {discountOptions.map((option) => (
          <RadioRow
            key={option.value}
            name={`${idPrefix}-discount`}
            checked={values.discount === option.value}
            label={t(option.label)}
            onChange={() => toggle('discount', option.value)(values.discount)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title={t('Customer rating')}>
        {ratingOptions.map((option) => (
          <RadioRow
            key={option.value}
            name={`${idPrefix}-rating`}
            checked={values.rating === option.value}
            label={t(option.label)}
            onChange={() => toggle('rating', option.value)(values.rating)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title={t('Availability')}>
        <label className="flex cursor-pointer items-center gap-3 py-1.5 text-sm text-ink-soft hover:text-ink">
          <input
            type="checkbox"
            checked={values.stock === 'true'}
            onChange={(event) => onChange('stock', event.target.checked ? 'true' : '')}
            className="sr-only"
          />
          <span
            className={cn(
              'flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition',
              values.stock === 'true' ? 'border-ink bg-ink text-[#e9c891]' : 'border-ink/25',
            )}
          >
            {values.stock === 'true' && <Check className="h-3 w-3" strokeWidth={3} />}
          </span>
          {t('In-stock products only')}
        </label>
      </FilterGroup>
    </div>
  )
}

export function ProductListing({
  title,
  description,
  styleLine,
  scopeKey,
  scopeValue,
  entityName,
}: {
  title: string
  description: string | null
  styleLine: string | null
  scopeKey: 'category_scope_id' | 'category_id' | 'collection_id'
  scopeValue: number
  entityName: string
}) {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filterOpen, setFilterOpen] = useState(false)
  const page = getValidPage(searchParams.get('page'))
  const sort = getValidSort(searchParams.get('sort'))
  const values: FilterValues = {
    productCategory: searchParams.get('product_category') ?? '',
    subCategory: searchParams.get('sub_category') ?? '',
    color: searchParams.get('color') ?? '',
    size: searchParams.get('size') ?? '',
    brand: searchParams.get('brand') ?? '',
    price: searchParams.get('price') ?? '',
    discount: searchParams.get('discount') ?? '',
    rating: searchParams.get('rating') ?? '',
    stock: searchParams.get('stock') ?? '',
  }

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

  const query = useMemo(() => {
    const [minPrice, maxPrice] = getPriceBounds(values.price)
    const scope =
      scopeKey === 'collection_id'
        ? { collection_id: scopeValue }
        : scopeKey === 'category_id'
          ? { category_id: scopeValue }
          : { category_scope_id: scopeValue }

    // The scope and the "Product Category" facet share the `category_id` query
    // param. When the scope already pins the category, the page *is* that
    // category, so the facet must not overwrite it with its own (often empty)
    // value — doing so silently widened the grid to the whole catalogue.
    const categoryFilter =
      scopeKey === 'category_id' ? undefined : getPositiveNumber(values.productCategory)

    return {
      ...scope,
      // Only emit a facet-driven category_id; `undefined` is dropped by axios,
      // so spreading the scope first keeps its category_id authoritative.
      ...(categoryFilter !== undefined ? { category_id: categoryFilter } : {}),
      subcategory_id: getPositiveNumber(values.subCategory),
      color: values.color || undefined,
      size: values.size || undefined,
      brand_id: getPositiveNumber(values.brand),
      min_price: minPrice,
      max_price: maxPrice,
      min_discount: getPositiveNumber(values.discount),
      min_rating: getPositiveNumber(values.rating),
      in_stock: values.stock === 'true' ? true : undefined,
      with_facets: true,
      page,
      sort: sort !== 'latest' ? sort : undefined,
      per_page: perPage,
    }
  }, [
    scopeKey,
    scopeValue,
    page,
    sort,
    values.productCategory,
    values.subCategory,
    values.color,
    values.size,
    values.brand,
    values.price,
    values.discount,
    values.rating,
    values.stock,
     perPage,
  ])

  const { data, error, isFetching, isLoading, refetch } = useProducts(query)

  const facets = data?.facets
  const categoryOptions: FacetOption[] = (facets?.categories ?? []).map((item) => ({
    key: String(item.id),
    label: item.name,
    count: item.count,
    slug: item.slug,
  }))
  const subCategoryOptions: FacetOption[] = (facets?.subcategories ?? []).map((item) => ({
    key: String(item.id),
    label: item.name,
    count: item.count,
    slug: item.slug,
  }))
  const brandOptions: FacetOption[] = (facets?.brands ?? []).map((item) => ({
    key: String(item.id),
    label: item.name,
    count: item.count,
    slug: item.slug,
  }))
  const attributeOptions = (name: string): FacetOption[] =>
    ((facets?.attributes ?? []).find((attribute) => attribute.name.trim().toLowerCase() === name)?.values ?? []).map(
      (item) => ({ key: item.value, label: item.value, count: item.count }),
    )
  const colorOptions = attributeOptions('color')
  const sizeOptions = attributeOptions('size')

  const activeCount = Object.values(values).filter(Boolean).length
  const selectedProductCategory = categoryOptions.find((option) => option.key === values.productCategory)
  const selectedSubCategory = subCategoryOptions.find((option) => option.key === values.subCategory)
  const selectedColor = colorOptions.find((option) => option.key === values.color)
  const selectedSize = sizeOptions.find((option) => option.key === values.size)
  const selectedBrand = brandOptions.find((option) => option.key === values.brand)
  const selectedPrice = priceOptions.find((option) => option.value === values.price)
  const selectedDiscount = discountOptions.find((option) => option.value === values.discount)
  const selectedRating = ratingOptions.find((option) => option.value === values.rating)

  const activeFilters = [
    selectedProductCategory ? { key: 'productCategory' as const, label: selectedProductCategory.label } : null,
    selectedSubCategory ? { key: 'subCategory' as const, label: selectedSubCategory.label } : null,
    selectedColor ? { key: 'color' as const, label: selectedColor.label } : null,
    selectedSize ? { key: 'size' as const, label: t('Size {{size}}', { size: selectedSize.label }) } : null,
    selectedBrand ? { key: 'brand' as const, label: selectedBrand.label } : null,
    selectedPrice ? { key: 'price' as const, label: t(selectedPrice.label) } : null,
    selectedDiscount ? { key: 'discount' as const, label: t('{{discount}} off', { discount: t(selectedDiscount.label) }) } : null,
    selectedRating ? { key: 'rating' as const, label: t(selectedRating.label) } : null,
    values.stock === 'true' ? { key: 'stock' as const, label: t('In stock') } : null,
  ].filter((filter): filter is { key: FilterKey; label: string } => filter !== null)

  function updateFilter(key: FilterKey, value: string) {
    const next = new URLSearchParams(searchParams)
    if (!value) next.delete(filterParam[key])
    else next.set(filterParam[key], value)
    if (key === 'productCategory') next.delete('sub_category')
    next.delete('page')
    setSearchParams(next)
  }

  function updateSort(value: string) {
    const next = new URLSearchParams(searchParams)
    if (value === 'latest') next.delete('sort')
    else next.set('sort', value)
    next.delete('page')
    setSearchParams(next)
  }

  function clearFilters() {
    const next = new URLSearchParams(searchParams)
    for (const key of Object.values(filterParam)) next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  const filterPanel = (idPrefix: string) => (
    <FilterPanel
      idPrefix={idPrefix}
      categories={categoryOptions}
      subcategories={subCategoryOptions}
      colors={colorOptions}
      sizes={sizeOptions}
      brands={brandOptions}
      values={values}
      activeCount={activeCount}
      onChange={updateFilter}
      onClear={clearFilters}
    />
  )

  return (
    <section id="category-products" className="scroll-mt-24 bg-ivory pb-12 pt-8 sm:pb-16 sm:pt-10">
      <div className="container-store">
        <div className="grid items-start gap-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10 lg:items-stretch">
          <aside className="hidden lg:block lg:sticky lg:top-24 self-start h-fit">
            {filterPanel('desktop')}
          </aside>

          <div className="min-w-0">
            <ProductTitleBlock title={title} styleLine={styleLine} description={description} />
            <h2 className="sr-only">{t('Shop all {{category}}', { category: entityName })}</h2>

            {/* ── KALKI-style toolbar: count left, Sort By right ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-warm pb-4">
              <p className="text-sm text-ink-soft" aria-live="polite">
                {data?.total === 1 ? t('{{count}} product', { count: data?.total ?? 0 }) : t('{{count}} products', { count: data?.total ?? 0 })}
              </p>

              <div className="flex w-full items-center gap-2.5 sm:w-auto">
                <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-10 flex-1 rounded-full border-line-warm px-4 text-sm font-semibold text-ink hover:bg-cream hover:text-gold-deep sm:hidden">
                      <SlidersHorizontal className="h-4 w-4" /> {t('Filters')}
                      {activeCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[10px] text-[#e6c97e]">
                          {activeCount}
                        </span>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-3xl p-0">
                    <DialogHeader className="border-b border-line-warm px-5 py-4 pr-14">
                      <DialogTitle className="heading-serif text-lg font-semibold text-ink">{t('Refine your search')}</DialogTitle>
                      <p className="text-sm text-ink-soft">{t('{{count}} products in this collection', { count: data?.total ?? 0 })}</p>
                    </DialogHeader>
                    <div className="px-5 py-2">{filterPanel('mobile')}</div>
                    <div className="sticky bottom-0 flex gap-3 border-t border-line-warm bg-ivory p-4">
                      <Button variant="outline" onClick={clearFilters} disabled={activeCount === 0} className="h-11 flex-1 rounded-full font-bold border-line-warm text-ink hover:bg-cream">
                        {t('Clear all')}
                      </Button>
                      <DialogClose asChild>
                        <Button className="h-11 flex-1 rounded-full bg-ink font-bold text-[#e9c891] hover:bg-[#2c2620]">
                          {t('Show products')}
                        </Button>
                      </DialogClose>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
                  <label htmlFor="category-sort" className="hidden text-xs font-bold uppercase tracking-[0.12em] text-ink-soft/70 sm:block">
                    {t('Sort By')}
                  </label>
                  <div className="relative min-w-0 flex-1 sm:w-56">
                    <select
                      id="category-sort"
                      value={sort}
                      onChange={(event) => updateSort(event.target.value)}
                      className="h-10 w-full appearance-none rounded-full border border-ink/35 bg-white px-4 pr-9 text-sm font-semibold text-ink outline-none transition focus:border-gold-deep focus:ring-4 focus:ring-gold-deep/15"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>{t(option.label)}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/60" />
                  </div>
                </div>
              </div>
            </div>

            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-b border-line-warm py-4">
                <span className="mr-1 text-xs font-bold uppercase tracking-[0.12em] text-ink-soft/60">{t('Applied')}</span>
                {activeFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => updateFilter(filter.key, '')}
                    className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-gold-deep ring-1 ring-gold-mid/40 transition hover:bg-gold-soft"
                  >
                    {filter.label} <X className="h-3 w-3" />
                  </button>
                ))}
                <button type="button" onClick={clearFilters} className="px-2 text-xs font-bold text-ink-soft underline underline-offset-4 hover:text-gold-deep">
                  {t('Clear all')}
                </button>
              </div>
            )}

            <div className="mt-7">
              {error && !data ? (
                <div className="rounded-2xl border border-dashed border-line-warm px-6 py-16 text-center" role="alert">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-soft text-gold-deep ring-1 ring-gold-mid/30">
                    <AlertCircle className="h-7 w-7" />
                  </span>
                  <h3 className="heading-serif mt-5 text-xl font-semibold text-ink">{t('Products could not be loaded')}</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">{t('Please try again in a moment.')}</p>
                  <Button onClick={() => refetch()} className="mt-6 rounded-full bg-ink px-6 font-bold text-[#e9c891] hover:bg-[#2c2620]">
                    <RotateCcw className="h-4 w-4" /> {t('Try again')}
                  </Button>
                </div>
              ) : isLoading ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
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
              ) : data && data.data.length > 0 ? (
                <>
                  {error && (
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
                      <span>{t('The collection could not be refreshed.')}</span>
                      <button type="button" onClick={() => refetch()} className="font-bold underline underline-offset-4">{t('Retry')}</button>
                    </div>
                  )}
                  <div
                    className={cn(
                      'grid grid-cols-2 gap-x-4 gap-y-9 transition-opacity duration-300 sm:gap-x-5 sm:gap-y-11 md:grid-cols-3 xl:grid-cols-4',
                      isFetching && 'pointer-events-none opacity-45',
                    )}
                    aria-busy={isFetching}
                  >
                    {data.data.map((product) => (
                      <CollectionCard key={product.id} product={product} />
                    ))}
                  </div>
                  <div className="mt-12 flex justify-center">
                    <PaginationBar
                      page={page}
                      lastPage={data.last_page}
                      buildPageHref={(targetPage) => buildPageHref(searchParams, targetPage)}
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-line-warm px-6 py-16 text-center">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-soft text-gold-deep ring-1 ring-gold-mid/30">
                    <PackageSearch className="h-7 w-7" />
                  </span>
                  <h3 className="heading-serif mt-5 text-xl font-semibold text-ink">{t('No matching products')}</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">{t('Try removing a filter or explore another category.')}</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {activeCount > 0 && (
                      <Button onClick={clearFilters} className="rounded-full bg-ink font-bold text-[#e9c891] hover:bg-[#2c2620]">
                        <RotateCcw className="h-4 w-4" /> {t('Clear filters')}
                      </Button>
                    )}
                    <Button asChild variant="outline" className="rounded-full border-line-warm font-bold text-ink hover:bg-cream hover:text-gold-deep">
                      <Link to="/shop">{t('Browse all products')}</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CategoryTestimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const { t } = useTranslation()
  if (!testimonials.length) return null

  return (
    <section className="bg-ivory py-12 sm:py-16">
      <div className="container-store">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-deep">{t('What shoppers say')}</p>
          <h2 className="heading-serif mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{t('Loved by our community')}</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {testimonials.slice(0, 3).map((testimonial) => (
            <article key={testimonial.id} className="relative rounded-2xl border border-line-warm bg-ivory p-6 shadow-[0_14px_36px_-24px_rgba(63,45,12,0.35)]">
              <Quote className="absolute right-5 top-5 h-8 w-8 text-gold-mid/25" />
              <div className="flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, index) => (
                  <Star key={index} className="h-4 w-4 fill-gold-deep text-gold-deep" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-ink-soft">“{testimonial.content}”</p>
              <div className="mt-5 flex items-center gap-3 border-t border-line-warm pt-4">
                {testimonial.author_avatar ? (
                  <img src={assetUrl(testimonial.author_avatar)} alt={testimonial.author_name} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-soft text-sm font-bold text-gold-deep">
                    {testimonial.author_name.charAt(0)}
                  </span>
                )}
                <div>
                  <p className="text-sm font-bold text-ink">{testimonial.author_name}</p>
                  {testimonial.author_role && <p className="text-xs text-ink-soft">{testimonial.author_role}</p>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function CategoryPageLoading() {
  return (
    <div className="min-h-screen bg-ivory">
      <Skeleton className="h-12 w-full rounded-none bg-line-warm" />
      <div className="container-store pt-4 sm:pt-5">
        <Skeleton className="h-[240px] w-full rounded-none bg-gold-soft/40 sm:h-[320px] lg:h-[400px]" />
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

export function CategoryPage() {
  const { t } = useTranslation()
  const { slug } = useParams()
  const { data, error, isLoading, refetch } = useCategoryPage(slug)
  const { data: allCategories } = useCategories()
  const notFound = isAxiosError(error) && error.response?.status === 404

  const pageCategory = data?.page.category
  const breadcrumbItems = useMemo(() => {
    if (!pageCategory) return []
    const byId = new Map((allCategories ?? []).map((item) => [item.id, item]))
    const chain: Category[] = []
    const guard = new Set<number>()
    let current: Category | undefined = byId.get(pageCategory.id) ?? pageCategory
    while (current && !guard.has(current.id)) {
      guard.add(current.id)
      chain.unshift(current)
      current = current.parent_id != null ? byId.get(current.parent_id) : undefined
    }
    return chain.map((node, index) => ({
      label: node.name,
      to: index < chain.length - 1 ? `/category/${node.slug}` : undefined,
    }))
  }, [allCategories, pageCategory])

  useEffect(() => {
    if (!data) return
    const title = data.page.meta_title ?? data.page.title
    document.title = `${title} | Waplia`

    const description =
      data.page.meta_description ?? resolveCategoryCopy(data.page).description
    if (!description) return
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (meta) meta.content = description
  }, [data])

  if (isLoading) return <CategoryPageLoading />

  if (error || !data) {
    return (
      <div className="flex min-h-[58vh] items-center justify-center bg-cream px-4 py-16">
        <div className="w-full max-w-lg rounded-3xl border border-line-warm bg-ivory px-6 py-12 text-center shadow-[0_24px_60px_-30px_rgba(63,45,12,0.45)] sm:px-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-soft text-gold-deep ring-1 ring-gold-mid/30">
            {notFound ? <PackageSearch className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
          </span>
          <h1 className="heading-serif mt-6 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {notFound ? 'Category not found' : 'This page is temporarily unavailable'}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-soft">
            {notFound ? 'The category may have moved or is no longer available.' : 'We could not load this collection. Please try again in a moment.'}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {!notFound && (
              <Button onClick={() => refetch()} className="rounded-full bg-ink px-6 font-bold text-[#e9c891] hover:bg-[#2c2620]">
                <RotateCcw className="h-4 w-4" /> {t('Try again')}
              </Button>
            )}
            <Button asChild variant="outline" className="rounded-full border-line-warm font-bold text-ink hover:bg-cream hover:text-gold-deep">
              <Link to="/shop">{t('Browse all products')}</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const { page, sections } = data
  const category = page.category
  const heroSection = sections.find((section) => section.type === 'HERO')
  const testimonialSection = sections.find((section) => section.type === 'TESTIMONIALS')
  const heroBanners = (heroSection?.content ?? []) as HomeBanner[]
  const testimonials = (testimonialSection?.content ?? []) as Testimonial[]
  const listing = data.listing

  // A page built from the admin's own section stack renders exactly that: hero,
  // then the product grid, then every other section in order. A category that
  // still uses the built-in default sections keeps the classic layout so its
  // hero banner and testimonials stay pinned to the top and bottom.
  if (listing.scope_key === 'category_id') {
    return (
      <div className="min-h-screen bg-ivory">
        <Breadcrumb
          className="border-line-warm bg-ivory"
          items={breadcrumbItems.length ? breadcrumbItems : [{ label: page.title }]}
        />
        <HomeSections
          sections={sections}
          heroHeadingLevel="h1"
          renderAfterType={{
            HERO: (
              <ProductListing
                title={page.title}
                description={resolveCategoryCopy(page).description}
                styleLine={resolveCategoryCopy(page).styleLine}
                scopeKey={listing.scope_key}
                scopeValue={listing.scope_value}
                entityName={category.name}
              />
            ),
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ivory">
      <Breadcrumb
        className="border-line-warm bg-ivory"
        items={breadcrumbItems.length ? breadcrumbItems : [{ label: page.title }]}
      />
      <CategoryBanner banner={heroBanners[0]} category={category} />
      <ProductListing
        title={page.title}
        description={resolveCategoryCopy(page).description}
        styleLine={resolveCategoryCopy(page).styleLine}
        scopeKey={listing.scope_key}
        scopeValue={listing.scope_value}
        entityName={category.name}
      />
      <CategoryTestimonials testimonials={testimonials} />
    </div>
  )
}