import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Gem,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  Phone,
  Plus,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Tag,
  Truck,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { sanitizeHtml } from '@/lib/html'
import { assetUrl } from '@/lib/assets'
import { formatCurrency } from '@/utils/format'
import { isRecentlyAdded } from '@/utils/product'
import { useWebsiteContent } from '@/hooks/useWebsite'
import type { LucideIcon } from 'lucide-react'
import type {
  Category,
  FeaturedCategoryCard,
  HomeBanner,
  HomeCategoryCard,
  HomeImageBannerContent,
  HomeIconInfoContent,
  HomeVisitStoresContent,
  HomeStoreLocationItem,
  HomeStoreLocationsContent,
  HomeInstagramDiariesContent,
  HomeFaqItem,
  HomeTextBannerContent,
  HomeVideoBannerContent,
  HomeProductCarouselContent,
  HomeTrendingStylesContent,
  HomeTrendingStyleItem,
  HomeSplitCollageContent,
  HomeValueProp,
  Product,
  Testimonial,
} from '@/types'

/** Instagram glyph composed from primitives (rounded square, ring, dot). */
function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.2" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.5" cy="6.5" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  )
}

const categoryGradients = [
  'from-[#f3e9d4] via-[#faf5e9] to-[#ecdcb8]',
  'from-[#f6ecd6] via-[#f0e3c2] to-[#e6d3a8]',
  'from-[#efe2cc] via-[#f4ead6] to-[#e4d2ae]',
  'from-[#f7ecd9] via-[#f0e0c0] to-[#e9d5a6]',
  'from-[#f5ead7] via-[#f2e6c9] to-[#ead9b2]',
  'from-[#f3ead9] via-[#efe1c4] to-[#e7d5ad]',
  'from-[#f8efdd] via-[#f1e4c6] to-[#ecdcb4]',
  'from-[#f4e9d3] via-[#efe0bf] to-[#e8d4a9]',
]

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string | null
  title: string | null
  subtitle?: string | null
  action?: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4 sm:mb-9">
      <div>
        {eyebrow && (
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-deep">
            {eyebrow}
          </p>
        )}
        <h2 className="heading-serif text-[1.55rem] font-semibold tracking-tight text-ink sm:text-[2rem]">
          {title ?? t('Collection')}
        </h2>
        {subtitle && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/**
 * Centered section heading with a hairline rule running through the title,
 * matching the Mini Banners / Top Collection sections.
 */
function CenteredHeading({ title, subtitle }: { title?: string | null; subtitle?: string | null }) {
  if (!title && !subtitle) return null

  return (
    <div className="mb-8 flex flex-col items-center text-center sm:mb-10">
      <div className="relative flex w-full flex-col items-center">
        <div className="absolute inset-x-0 top-1/2 h-[1px] -translate-y-1/2 bg-gradient-to-r from-transparent via-gold-mid/50 to-transparent" />
        {title && (
          <h2 className="heading-serif relative z-10 bg-ivory px-6 text-[1.65rem] font-semibold tracking-tight text-ink sm:text-[2.1rem]">
            {title}
          </h2>
        )}
      </div>
      {subtitle && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">{subtitle}</p>}
    </div>
  )
}

export function HeroCarousel({
  banners,
  compact = false,
  headingLevel = 'h2',
  eyebrow = '',
  scopeCategoryId,
}: {
  banners: HomeBanner[]
  compact?: boolean
  headingLevel?: 'h1' | 'h2'
  eyebrow?: string
  scopeCategoryId?: number
}) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const [heroAspect, setHeroAspect] = useState(8 / 3)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (banners.length <= 1) return
    intervalRef.current = setInterval(() => {
      setIndex((current) => (current + 1) % banners.length)
    }, 5500)
  }, [banners.length])

  useEffect(() => {
    resetTimer()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [resetTimer])

  if (!banners.length) return null

  const safeIndex = Math.min(index, banners.length - 1)
  const banner = banners[safeIndex]
  const Heading = headingLevel
  const dealsQuery = new URLSearchParams({ sort: 'discount', deals_only: 'true' })
  if (scopeCategoryId != null) dealsQuery.set('category_scope_id', String(scopeCategoryId))
  const primaryUrl = banner.url ?? '/shop'
  // Render only what the admin actually configured. Empty fields stay empty
  // instead of falling back to sample copy, so clearing the banner clears it.
  const title = banner.title?.trim() ?? ''
  const subtitle = banner.subtitle?.trim() ?? ''
  const buttonText = banner.button_text?.trim() ?? ''
  const hasText = Boolean(title || subtitle || buttonText || eyebrow.trim())

  const showSecondaryCta = Boolean(banner.url && !banner.url.includes('deals_only'))

  return (
    <section className="px-3 pt-3 sm:px-5 sm:pt-5 lg:px-8">
      <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[1.4rem] bg-zinc-900 shadow-[0_18px_55px_-28px_rgba(20,12,28,0.55)] sm:rounded-[1.75rem]">
        <div className="relative aspect-[8/3]" style={{ aspectRatio: String(heroAspect) }}>
          {banners.map((item, slideIndex) => {
            const isActive = slideIndex === safeIndex
            const slideClass = cn(
              'absolute inset-0 transition-opacity duration-[900ms] ease-out',
              isActive ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none',
            )
            const content = item.image ? (
              <>
                <img
                  src={assetUrl(item.image)}
                  alt={item.title || t('Featured collection')}
                  onLoad={(event) => {
                    const el = event.currentTarget
                    if (el.naturalWidth && el.naturalHeight) {
                      setHeroAspect(el.naturalWidth / el.naturalHeight)
                    }
                  }}
                  className="hidden h-full w-full object-cover object-center md:block"
                />
                <img
                  src={assetUrl(item.mobile_image || item.image)}
                  alt={item.title || t('Featured collection')}
                  className="h-full w-full object-cover object-center md:hidden"
                />
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                <span className="grid h-28 w-28 place-items-center rounded-full border border-white/20 text-white/60">
                  <Sparkles className="h-12 w-12" />
                </span>
              </div>
            )

            return item.url ? (
              <Link
                key={item.id}
                to={item.url}
                aria-label={item.title || t('Featured collection')}
                aria-hidden={!isActive}
                tabIndex={isActive ? undefined : -1}
                className={cn(slideClass, 'block cursor-pointer')}
              >
                {content}
              </Link>
            ) : (
              <div key={item.id} aria-hidden={!isActive} className={slideClass}>
                {content}
              </div>
            )
          })}

          {hasText && (
            <>
              <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
              <div className="pointer-events-none absolute inset-0 z-20 hidden bg-gradient-to-r from-black/85 via-black/40 to-transparent lg:block" />

              <div className="pointer-events-none relative z-30 flex h-full max-w-3xl flex-col justify-end px-6 pb-16 pt-24 text-white sm:px-10 sm:pb-20 lg:justify-center lg:px-16 lg:py-20">
                {eyebrow.trim() && (
                  <span className="inline-flex w-fit items-center gap-2.5 rounded-full border border-white/20 bg-white/10 py-1.5 pl-2.5 pr-3.5 backdrop-blur-md">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e6c97e] opacity-70" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c9a25a]" />
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90">
                      {eyebrow}
                    </span>
                  </span>
                )}
                {title && (
                  <Heading
                    className={cn(
                      'heading-serif mt-5 font-semibold leading-[1.08] tracking-[-0.01em] drop-shadow-md',
                      compact ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl lg:text-[3.75rem]',
                    )}
                  >
                    {title}
                  </Heading>
                )}
                {subtitle && (
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
                    {subtitle}
                  </p>
                )}
                {(buttonText || showSecondaryCta) && (
                  <div className="pointer-events-auto mt-7 flex flex-wrap items-center gap-3">
                    {buttonText && (
                      <Button
                        asChild
                        size="lg"
                        className="h-12 rounded-full bg-white px-7 text-sm font-bold text-zinc-950 shadow-xl shadow-black/25 transition-transform hover:-translate-y-0.5 hover:bg-zinc-50"
                      >
                        <Link to={primaryUrl}>
                          {buttonText}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    {showSecondaryCta && (
                      <Button
                        asChild
                        size="lg"
                        className="h-12 rounded-full border border-white/40 bg-white/10 px-7 text-sm font-bold text-white backdrop-blur-md transition-colors hover:bg-white hover:text-zinc-950"
                      >
                        <Link to={`/shop?${dealsQuery.toString()}`}>{t('Explore offers')}</Link>
                      </Button>
                    )}
                  </div>
                )}
                <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-white/80">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {t('Easy returns')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {t('Secure payments')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {t('Fast delivery')}
                  </span>
                </div>
              </div>

              <span className="absolute right-4 top-4 z-30 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-zinc-900 shadow-lg backdrop-blur sm:right-6 sm:top-6">
                {t('New season edit')}
              </span>
            </>
          )}

          {banners.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => {
                  setIndex((current) => (current - 1 + banners.length) % banners.length)
                  resetTimer()
                }}
                aria-label={t('Previous slide')}
                className="absolute left-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md transition-all hover:bg-white hover:text-zinc-900 sm:left-6"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIndex((current) => (current + 1) % banners.length)
                  resetTimer()
                }}
                aria-label={t('Next slide')}
                className="absolute right-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md transition-all hover:bg-white hover:text-zinc-900 sm:right-6"
              >
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="absolute bottom-6 left-6 z-30 flex items-center gap-2 sm:bottom-8 sm:left-8">
                {banners.map((item, dotIndex) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setIndex(dotIndex)
                      resetTimer()
                    }}
                    aria-label={t('Go to slide {{number}}', { number: dotIndex + 1 })}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      dotIndex === safeIndex ? 'w-8 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80',
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export function CompactProductCard({ product }: { product: Product }) {
  const { t } = useTranslation()
  const image = product.images?.[0]
  const rating = product.rating
  const inStock = product.stock > 0

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-line-warm bg-ivory shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-mid/50 hover:shadow-lg hover:shadow-[#8a6a1f]/10"
    >
      <div className="relative block overflow-hidden bg-gradient-to-br from-[#f3e9d4] via-[#faf5e9] to-[#ecdcb8] aspect-square">
        {image ? (
          <>
            <img
              src={assetUrl(image)}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            />
            {product.images?.[1] && (
              <img
                src={assetUrl(product.images[1])}
                alt={product.name}
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

        <div className="absolute left-3 top-3 flex max-w-[70%] flex-col items-start gap-1.5">
          {product.discount_percent > 0 && (
            <span className="rounded-full bg-ink/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#e6c97e] shadow-lg shadow-black/20 backdrop-blur">
              {t('{{percent}}% off', { percent: Math.round(product.discount_percent) })}
            </span>
          )}
          {product.best_seller && inStock && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-700 shadow-sm backdrop-blur">
              {t('Bestseller')}
            </span>
          )}
        </div>

        {!inStock && (
          <div className="absolute inset-0 grid place-items-center bg-white/60 backdrop-blur-[1px]">
            <span className="rounded-full bg-ink px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#e6c97e]">
              {t('Sold out')}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <p className="mb-1.5 truncate text-[10px] font-bold uppercase tracking-[0.14em] text-gold-deep">
          {product.brand?.name ?? product.category?.name ?? t('Curated collection')}
        </p>
        <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-ink transition-colors group-hover:text-gold-deep">
          {product.name}
        </h3>
        {rating?.average != null && rating.count > 0 ? (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-soft">
            <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 font-bold text-white">
              <Star className="h-3 w-3 fill-current" /> {rating.average.toFixed(1)}
            </span>
            <span className="text-ink-soft/40">|</span>
            <span>
              {rating.count} {rating.count === 1 ? t('rating') : t('ratings')}
            </span>
          </div>
        ) : isRecentlyAdded(product) ? (
          <p className="mt-2 text-[11px] font-semibold text-emerald-700">{t('New arrival')}</p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-2.5">
          <span className="text-sm font-bold tracking-tight text-ink">{formatCurrency(product.price)}</span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-xs text-ink-soft/60 line-through">{formatCurrency(product.mrp)}</span>
          )}
          {product.discount_percent > 0 && (
            <span className="text-xs font-bold text-claret">{t('{{percent}}% off', { percent: Math.round(product.discount_percent) })}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

const productSortMap: Record<string, string> = {
  BEST_SELLERS: 'best_selling',
}

export function ProductSection({
  title,
  subtitle,
  products,
  type,
  scopeCategoryId,
}: {
  title: string | null
  subtitle: string | null
  products: Product[]
  type: string
  scopeCategoryId?: number
}) {
  const { t } = useTranslation()
  if (!products.length) return null

  const sort = productSortMap[type] ?? 'best_selling'
  const query = new URLSearchParams({ sort })
  if (type === 'BEST_SELLERS') query.set('best_seller', 'true')
  if (scopeCategoryId != null) query.set('category_scope_id', String(scopeCategoryId))

  const viewAllTo =
    scopeCategoryId != null
      ? `/shop?${query.toString()}`
      : type === 'BEST_SELLERS'
        ? '/best-sellers'
        : `/shop?${query.toString()}`

  const eyebrowByType: Record<string, string> = {
    BEST_SELLERS: t('Trending now'),
  }

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <SectionHeading
        eyebrow={eyebrowByType[type]}
        title={title}
        subtitle={subtitle}
        action={
          <Link to={viewAllTo} className="group flex items-center gap-1.5 text-sm font-bold text-gold-deep hover:text-[#8a6a1f]">
            {t('View all')}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => (
          <CompactProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}

/**
 * Section type Categories displaying a horizontal ring of category cards, with optional title and subtitle. Scrollable on smaller screens, with navigation arrows on larger screens if there are more than 7 categories. 
 */
export function CategoryRing({
  title,
  subtitle,
  categories,
}: {
  title: string | null
  subtitle: string | null
  categories: HomeCategoryCard[]
}) {
  const { t } = useTranslation()
  const trackRef = useRef<HTMLDivElement>(null)

  const scrollByCategory = (direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    const firstItem = track.firstElementChild as HTMLElement | null
    if (!firstItem) return
    const gap = Number.parseFloat(getComputedStyle(track).gap || '24')
    track.scrollBy({ left: direction * (firstItem.offsetWidth + gap), behavior: 'smooth' })
  }

  if (!categories.length) return null

  const showArrows = categories.length > 7

  return (
    <section className="relative isolate mx-auto w-full max-w-[1440px] overflow-hidden px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[520px] w-[860px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,162,90,0.16),transparent_62%)]" />

      {/* <div className="mb-10 flex flex-col items-center text-center sm:mb-14"> */}
         <CenteredHeading title={title} subtitle={subtitle} />
        {/* <h2 className="heading-serif text-[1.75rem] font-semibold tracking-tight text-ink sm:text-[2.4rem]">
          {title ?? t('Shop by category')}
        </h2>
        {subtitle && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">{subtitle}</p>} */}
      {/* </div> */}

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory items-start justify-center-safe gap-6 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-8"
      >
        {categories.map((category, index) => {
          const label = category.title?.trim() || category.name
          const description = category.description?.trim()
          const count = category.products_count ?? 0
          const to =
            category.url ||
            (category.slug
              ? `/category/${category.slug}`
              : category.id
                ? `/shop?category_id=${category.id}`
                : '/shop')
          return (
            <Link
              key={`${category.id ?? 'tile'}-${index}`}
              to={to}
              className="group flex w-[42%] min-w-0 shrink-0 snap-center flex-col items-center text-center sm:w-[30%] md:w-[23%] lg:w-[18%] xl:w-[15%] 2xl:w-[12%]"
            >
              <span className="relative block aspect-square w-full">
                <span className="absolute -inset-2 rounded-full border border-gold-mid/0 transition-colors duration-500 group-hover:border-gold-mid/55" />
                <span className="relative block h-full w-full overflow-hidden rounded-full bg-cream shadow-[0_20px_45px_-26px_rgba(122,92,32,0.65)] ring-1 ring-line-warm transition-all duration-500 group-hover:ring-2 group-hover:ring-gold-mid">
                  {category.image ? (
                    <img
                      src={assetUrl(category.image)}
                      alt={label}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center bg-gold-soft font-display text-5xl font-semibold text-gold-deep">
                      {label.charAt(0)}
                    </span>
                  )}
                </span>
                <span className="absolute -bottom-1 right-0 grid h-9 w-9 translate-y-1 place-items-center rounded-full bg-gold-deep text-ivory opacity-0 shadow-lg ring-2 ring-ivory transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </span>

              <span className="heading-serif mt-5 block text-base font-semibold leading-snug text-ink transition-colors duration-300 group-hover:text-gold-deep sm:text-md">
                {label}
              </span>
              {description ? (
                <span className="mt-1.5 line-clamp-2 max-w-[15rem] text-xs leading-relaxed text-ink-soft/80">
                  {description}
                </span>
              ) : count > 0 ? (
                <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-soft/75">
                  {count} {count === 1 ? t('item') : t('items')}
                </span>
              ) : null}
            </Link>
          )
        })}
      </div>

      {showArrows && (
        <div className="mt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => scrollByCategory(-1)}
            aria-label={t('Scroll categories left')}
            className="grid h-10 w-10 place-items-center rounded-full border border-line-warm bg-white text-ink-soft shadow-sm transition hover:border-gold-mid/60 hover:bg-gold-mid/10 hover:text-gold-deep"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCategory(1)}
            aria-label={t('Scroll categories right')}
            className="grid h-10 w-10 place-items-center rounded-full border border-line-warm bg-white text-ink-soft shadow-sm transition hover:border-gold-mid/60 hover:bg-gold-mid/10 hover:text-gold-deep"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  )
}

export function SubcategoryGrid({
  title,
  subtitle,
  categories,
  square = false,
}: {
  title: string | null
  subtitle: string | null
  categories: FeaturedCategoryCard[]
  /** Render each card as a square tile instead of a 4:3 tile. */
  square?: boolean
}) {
  const { t } = useTranslation()
  if (!categories.length) return null

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <CenteredHeading title={title} subtitle={subtitle} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((category, index) => {
          // A card without a category is fine: it links to the admin URL, the
          // category page, or (when neither exists) it is shown as plain art.
          const href = category.url
            ? category.url
            : category.slug
              ? `/category/${category.slug}`
              : category.id
                ? `/shop?category_scope_id=${category.id}`
                : null
          const label = category.title || category.name || t('Featured category')
          // Title and caption are both optional: a card with neither is shown as a
          // clean image tile with no overlay text.
          const hasTitle = Boolean(category.title)
          const hasSubtitle = Boolean(category.subtitle)

          const body = (
            <>
              {category.image ? (
                <img src={assetUrl(category.image)} alt={category.title || ''} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${categoryGradients[index % categoryGradients.length]}`}>
                  <span className="text-4xl font-extrabold text-gold-deep">{label.charAt(0)}</span>
                </div>
              )}
              {(hasTitle || hasSubtitle) && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 text-white sm:p-5">
                  {hasTitle && <h3 className="font-bold">{category.title}</h3>}
                  {hasSubtitle && (
                    <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-white/75">
                      {category.subtitle} <ArrowRight className="h-3 w-3" />
                    </span>
                  )}
                </div>
              )}
            </>
          )

          const className = `group relative overflow-hidden rounded-2xl sm:rounded-3xl ${square ? 'aspect-square' : 'aspect-[4/3]'}`

          if (!href) {
            return (
              <div key={`${category.id ?? label}-${index}`} className={className}>
                {body}
              </div>
            )
          }

          return (
            <Link key={`${category.id ?? href}-${index}`} to={href} aria-label={label} className={className}>
              {body}
            </Link>
          )
        })}
      </div>
    </section>
  )
}


// ** Testimonials section with a horizontal slider of testimonial cards, with optional title and subtitle. Scrollable on smaller screens, with autoplay and navigation arrows on larger screens if there are more than 2 testimonials.
// **
export function TestimonialsSection({
  title,
  subtitle,
  testimonials,
}: {
  title: string | null
  subtitle: string | null
  testimonials: Testimonial[]
}) {
  const { t } = useTranslation()
  const trackRef = useRef<HTMLDivElement>(null)
  const indexRef = useRef(0)
  const [index, setIndex] = useState(0)
  const [perView, setPerView] = useState(1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const count = testimonials.length
  const maxStart = Math.max(0, count - perView)

  // KALKI's slider shows one card below 1280px and two cards from 1280px up.
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1280px)')
    const sync = () => setPerView(media.matches ? 2 : 1)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  const goTo = useCallback(
    (targetIndex: number) => {
      const span = maxStart + 1
      const normalized = ((targetIndex % span) + span) % span
      setIndex(normalized)
      const element = trackRef.current
      const card = element?.children[normalized] as HTMLElement | undefined
      if (!element || !card) return
      const left =
        card.getBoundingClientRect().left - element.getBoundingClientRect().left + element.scrollLeft
      element.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
    },
    [maxStart],
  )

  useEffect(() => {
    indexRef.current = index
  }, [index])

  const startAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      const next = indexRef.current >= maxStart ? 0 : indexRef.current + 1
      goTo(next)
    }, 6000)
  }, [goTo, maxStart])

  const stopAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  useEffect(() => {
    if (maxStart <= 0) return
    startAutoplay()
    return stopAutoplay
  }, [startAutoplay, stopAutoplay, maxStart])

  if (!testimonials.length) return null

  const syncIndexOnScroll = () => {
    const element = trackRef.current
    if (!element || !element.children[0]) return
    const gap = Number.parseFloat(getComputedStyle(element).gap) || 0
    const step = (element.children[0] as HTMLElement).offsetWidth + gap
    if (step <= 0) return
    setIndex(Math.min(maxStart, Math.max(0, Math.round(element.scrollLeft / step))))
  }

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 pb-[60px] pt-[50px] sm:px-6 lg:px-8">
       <CenteredHeading title={title} subtitle={subtitle} />
      {/* <h2 className="mb-[30px] text-center text-[22px] font-medium tracking-[0.01em] text-ink sm:text-2xl">
        {title ?? t('Customer Stories')}
      </h2>
      {subtitle ? <p className="-mt-5 mb-[26px] text-center text-sm text-ink-soft">{subtitle}</p> : null} */}

      <div className="relative">
        <div
          ref={trackRef}
          onScroll={syncIndexOnScroll}
          onMouseEnter={stopAutoplay}
          onMouseLeave={startAutoplay}
          className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-10"
        >
          {testimonials.map((testimonial) => {
            const photo = testimonial.image || testimonial.author_avatar
            const href = testimonial.url || null

            return (
              <figure
                key={testimonial.id}
                className="flex w-full shrink-0 snap-start flex-col border border-[#e1e1e5] bg-white md:flex-row md:items-center md:gap-5 md:p-7 xl:w-[calc(50%-1.25rem)]"
              >
                <div className="relative md:w-[34%] md:shrink-0">
                  {photo ? (
                    <div className="aspect-[3/4] overflow-hidden bg-muted">
                      <img src={assetUrl(photo)} alt={testimonial.author_name} loading="lazy" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="grid aspect-[3/4] place-items-center bg-cream">
                      <Quote className="h-8 w-8 text-gold-mid/40" />
                    </div>
                  )}
                  {href ? (
                    <a href={href} className="absolute inset-x-0 bottom-0 flex justify-center pb-4">
                      <span className="inline-flex h-[30px] min-w-[134px] items-center justify-center rounded-[2px] bg-white px-4 text-[11px] font-medium uppercase tracking-[0.06em] text-[#aa6437] shadow-sm transition-colors hover:bg-[#f6ece1]">
                        {t('View Product')}
                      </span>
                    </a>
                  ) : null}
                </div>

                <div className="flex-1 px-6 py-6 text-center md:py-2 md:pl-1 md:pr-0">
                  <blockquote className="heading-serif text-base font-light italic leading-6 tracking-[0.04em] text-black">
                    {testimonial.content}
                  </blockquote>
                  <figcaption className="mt-7">
                    <p className="text-base text-black">{testimonial.author_name}</p>
                    {testimonial.author_role ? (
                      <p className="mt-1 text-xs tracking-[0.02em] text-[#545869]">{testimonial.author_role}</p>
                    ) : null}
                  </figcaption>
                </div>
              </figure>
            )
          })}
        </div>

        {count > perView ? (
          <>
            <button
              type="button"
              aria-label={t('Previous testimonial')}
              onClick={() => goTo(index - 1)}
              className="absolute left-0 top-1/2 grid h-10 w-[42px] -translate-y-1/2 place-items-center bg-white/95 text-ink transition-colors hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.25} />
            </button>
            <button
              type="button"
              aria-label={t('Next testimonial')}
              onClick={() => goTo(index + 1)}
              className="absolute right-0 top-1/2 grid h-10 w-[42px] -translate-y-1/2 place-items-center bg-white/95 text-ink transition-colors hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.25} />
            </button>
          </>
        ) : null}
      </div>

      {count > perView ? (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: maxStart + 1 }).map((_, dotIndex) => (
            <button
              key={dotIndex}
              type="button"
              onClick={() => goTo(dotIndex)}
              aria-label={t('Go to slide {{number}}', { number: dotIndex + 1 })}
              className={`h-[9px] w-[9px] rounded-full transition-colors ${dotIndex === index ? 'bg-ink' : 'bg-ink/20 hover:bg-ink/40'}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}

const valuePropIconMap: Record<string, LucideIcon> = {
  gem: Gem,
  truck: Truck,
  shield_check: ShieldCheck,
  sparkles: Sparkles,
  video: Video,
  award: Award,
  package: Package,
  quote: Quote,
  store: Store,
  tag: Tag,
  flame: Flame,
  badge_check: BadgeCheck,
  star: Star,
  check_circle2: CheckCircle2,
}

export function ValuePropsSection({ items }: { items: HomeValueProp[] }) {
  if (!items?.length) return null

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 pt-5 sm:px-6 lg:px-8">
      <div className="grid overflow-hidden border border-line-warm bg-ivory sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon, title, description }, index) => {
          const Icon = valuePropIconMap[icon] ?? Gem
          return (
            <div key={`${icon}-${title}-${index}`} className="group flex gap-3 border-b border-line-warm p-5 last:border-b-0 sm:p-6 lg:border-b-0 lg:border-r lg:last:border-r-0">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-deep transition-colors group-hover:bg-gold-deep group-hover:text-[#f7efdb]">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-ink">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">{description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ─────────────────────── KALKI-mapped homepage sections ───────────────────────
 * Each component below reproduces one observed KALKI homepage slot using real
 * Waplia catalog/settings data only. See docs/kalki-reference-spec.md for the
 * measured evidence and the documented data-gap substitutions.
 */

/** KALKI slot #2 — "round column list": category label row + round avatar tiles. */

export function DepartmentNavStrip({ categories }: { categories: Category[] }) {
  const { t } = useTranslation()
  const top = categories.slice(0, 5)
  if (!top.length) return null

  return (
    <section className="border-b border-line-warm bg-ivory">
      <div className="container-store py-4 sm:py-5">
        <nav className="hidden items-center justify-center gap-1 md:flex" aria-label={t('Departments')}>
          {top.map((category, index) => (
            <span key={category.id} className="flex items-center gap-1">
              {index > 0 && <span className="mx-2 h-1 w-1 rounded-full bg-line-warm" />}
              <NavLink
                to={category.slug ? `/category/${category.slug}` : `/shop?category_id=${category.id}`}
                className={({ isActive }) =>
                  `px-2 py-1 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors ${
                    isActive ? 'text-gold-deep' : 'text-ink-soft hover:text-ink'
                  }`
                }
              >
                {category.name}
              </NavLink>
            </span>
          ))}
        </nav>

        <div className="mt-3 flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-4 md:justify-center md:gap-6">
          {top.map((category) => (
            <Link
              key={category.id}
              to={category.slug ? `/category/${category.slug}` : `/shop?category_id=${category.id}`}
              className="group flex w-[76px] shrink-0 flex-col items-center gap-2 text-center"
            >
              <span className="grid h-[60px] w-[60px] place-items-center overflow-hidden rounded-full bg-gold-soft ring-1 ring-line-warm transition-all duration-300 group-hover:ring-gold-mid/60">
                {category.image ? (
                  <img
                    src={assetUrl(category.image)}
                    alt={category.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <span className="font-display text-lg font-semibold text-gold-deep">{category.name.charAt(0)}</span>
                )}
              </span>
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink transition-colors group-hover:text-gold-deep">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * KALKI slot #4 — thin personalization strip under the hero. Everything shown
 * here (copy + link) is admin configured on the Homepage Manager.
 */
export function PersonalizationStrip({
  text,
  subtitle,
  buttonText,
  buttonUrl,
}: {
  text?: string | null
  subtitle?: string | null
  buttonText?: string | null
  buttonUrl?: string | null
}) {
  const copy = text?.trim() ?? ''
  const support = subtitle?.trim() ?? ''
  const action = buttonText?.trim() ?? ''
  const url = buttonUrl?.trim() ?? ''

  if (!copy && !support && !action) {
    return null
  }

  return (
    <section className="border-b border-line-warm bg-cream/70">
      <div className="container-store flex min-h-12 flex-wrap items-center justify-center gap-x-6 gap-y-1 py-2 text-center">
        {copy && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-soft">{copy}</p>
        )}
        {support && <p className="text-[11px] text-ink-soft">{support}</p>}
        {action &&
          (url ? (
            <Link
              to={url}
              className="group flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-deep transition-colors hover:text-[#8a6a1f]"
            >
              {action}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-deep">{action}</span>
          ))}
      </div>
    </section>
  )
}

/** KALKI slot #6 — four mini banners at 400×533 (desk) / 250×353 (mob). */
export interface MiniBannerItem {
  id?: number
  title: string
  subtitle?: string
  description?: string
  image: string
  button_text?: string
  url: string
}

export function MiniBannerGrid({
  categories,
  items,
  title,
  subtitle,
}: {
  categories?: Category[]
  items?: MiniBannerItem[]
  title?: string | null
  subtitle?: string | null
}) {
  const { t } = useTranslation()
  const picks: MiniBannerItem[] = items && items.length > 0
    ? items.map((it, idx) => ({
        id: it.id ?? idx,
        title: it.title,
        subtitle: it.subtitle ?? '',
        description: it.description ?? '',
        image: it.image,
        button_text: it.button_text ?? t('Shop now'),
        url: it.url,
      }))
    : (categories ?? []).map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: (c as any).subtitle ?? '',
        description: (c as any).description ?? '',
        image: c.image ?? '',
        button_text: t('Shop now'),
        url: c.slug ? `/category/${c.slug}` : `/shop?category_id=${c.id}`,
      }))

  const data = picks
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  // Auto-advance pauses while the pointer rests on the rail.
  const pausedRef = useRef(false)
  const resumeTimerRef = useRef<number | null>(null)

  /** Hold the auto-advance off for a while after a touch/pointer interaction. */
  const pauseTemporarily = useCallback(() => {
    pausedRef.current = true
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = window.setTimeout(() => {
      pausedRef.current = false
    }, 8000)
  }, [])

  const sync = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 8)
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (el) el.scrollLeft = 0
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [sync, data.length])

  /** One card + the track gap, and how many cards fit in the viewport. */
  const metrics = () => {
    const el = trackRef.current
    if (!el) return { step: 240, perView: 1 }
    const card = el.querySelector<HTMLElement>('[data-mini-banner-card]')
    const width = card?.offsetWidth ?? 240
    const gap = 12
    const perView = Math.max(1, Math.round(el.clientWidth / (width + gap)))
    return { step: width + gap, perView }
  }

  const scrollByCards = (direction: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: direction * metrics().step, behavior: 'smooth' })
  }

  // Auto-advance one page at a time, wrapping back to the start.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (pausedRef.current) return
      const el = trackRef.current
      if (!el) return
      if (el.scrollWidth <= el.clientWidth + 8) return
      const { step, perView } = metrics()
      const page = step * perView
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8
      el.scrollBy({ left: atEnd ? -el.scrollWidth : page, behavior: 'smooth' })
    }, 4500)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length])

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current)
    }
  }, [])

  if (!data.length) return null

  const sectionTitleFinal = title
  const sectionSubtitleFinal = subtitle

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <CenteredHeading title={sectionTitleFinal} subtitle={sectionSubtitleFinal} />
      <div
        className="relative"
        onMouseEnter={() => {
          pausedRef.current = true
        }}
        onMouseLeave={() => {
          pausedRef.current = false
        }}
        onTouchStart={pauseTemporarily}
        onPointerDown={pauseTemporarily}
      >
        {canPrev && (
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            aria-label={t('Previous')}
            className="absolute -left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border bg-white shadow-sm transition hover:bg-gray-50 sm:-left-5"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        {canNext && (
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            aria-label={t('Next')}
            className="absolute -right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border bg-white shadow-sm transition hover:bg-gray-50 sm:-right-5"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
        <div
          ref={trackRef}
          onScroll={sync}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {data.map((item) => (
            <div
              key={item.id}
              data-mini-banner-card
              className="w-[calc(50%_-_6px)] shrink-0 snap-start sm:w-[calc(33.333%_-_8px)] lg:w-[calc(25%_-_9px)]"
            >
              <Link
                to={item.url || '/shop'}
                className="group relative block aspect-[400/533] overflow-hidden rounded-2xl bg-cream ring-1 ring-line-warm transition-all duration-300 hover:ring-gold-mid/60"
              >
                {item.image ? (
                  <img
                    src={assetUrl(item.image)}
                    alt={item.title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <span className="absolute inset-0 grid place-items-center bg-gold-soft font-display text-5xl font-semibold text-gold-deep">
                    {item.title?.charAt(0) || ''}
                  </span>
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 p-4 sm:p-5">
                  {(item.title || item.subtitle || item.description) && (
                    <div className="w-full">
                      {item.title && (
                        <div className="font-display text-lg font-semibold leading-tight text-white drop-shadow sm:text-xl">
                          {item.title}
                        </div>
                      )}
                      {item.subtitle && (
                        <div className="mt-0.5 text-xs text-white/90">{item.subtitle}</div>
                      )}
                      {item.description && (
                        <div className="mt-1 line-clamp-2 text-xs text-white/80">{item.description}</div>
                      )}
                    </div>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ink shadow-lg transition-transform group-hover:-translate-y-0.5">
                    {item.button_text ?? t('Shop now')}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── Content & FAQ sections ─────────────────────────── */

/**
 * Free-form content block. The admin composes HTML (headings, paragraphs,
 * lists, links, quotes) in the section editor; the markup is sanitised and then
 * injected into a styled wrapper so it inherits the storefront typography.
 */
export function RichTextSection({
  html,
  title,
  subtitle,
}: {
  html: string
  title?: string | null
  subtitle?: string | null
}) {
  // Wide tables would otherwise blow out the layout on small screens, so each
  // one gets a horizontal scroll container (class is picked up by Tailwind's
  // source scan since it is a literal here).
  const clean = sanitizeHtml(html)
    .trim()
    .replace(/<table\b/gi, '<div class="overflow-x-auto"><table')
    .replace(/<\/table>/gi, '</table></div>')

  if (!clean) {
    return null
  }

  const typography = cn(
    'mx-auto max-w-8xl text-sm leading-[1.8] text-ink-soft',
    '[&_h1]:font-display [&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-[-0.01em] [&_h1]:text-ink',
    '[&_h2]:font-display [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-[-0.01em] [&_h2]:text-ink',
    '[&_h3]:font-display [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-ink',
    '[&_h4]:font-display [&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-ink',
    '[&_h5]:mt-5 [&_h5]:mb-2 [&_h5]:text-base [&_h5]:font-semibold [&_h5]:text-ink',
    '[&_h6]:mt-5 [&_h6]:mb-2 [&_h6]:text-xs [&_h6]:font-bold [&_h6]:uppercase [&_h6]:tracking-[0.16em] [&_h6]:text-ink',
    '[&_p]:my-3',
    '[&_strong]:font-semibold [&_strong]:text-ink [&_b]:font-semibold [&_b]:text-ink',
    '[&_a]:text-gold-deep [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-colors [&_a:hover]:text-ink',
    '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5',
    '[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5',
    '[&_li]:leading-[1.8]',
    '[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-gold-mid [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-ink',
    '[&_hr]:my-6 [&_hr]:border-line-warm',
    // Tables inside the content block: keep them readable and responsive.
    '[&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-lg [&_table]:border [&_table]:border-line-warm [&_table]:text-left',
    '[&_th]:border [&_th]:border-line-warm [&_th]:bg-ivory/60 [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.12em] [&_th]:text-ink',
    '[&_td]:border [&_td]:border-line-warm [&_td]:px-4 [&_td]:py-2.5 [&_td]:align-top [&_td]:text-sm',
    '[&_tr]:border-b [&_tr]:border-line-warm',
    '[&_tr:last-child]:border-b-0',
    '[&_caption]:mb-2 [&_caption]:text-xs [&_caption]:font-semibold [&_caption]:uppercase [&_caption]:tracking-[0.12em] [&_caption]:text-ink-soft',
    '[&_tbody tr:hover]:bg-ivory/40',
    '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
  )

  return (
    <section className="mx-auto w-full max-w-[1470px] px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
      <CenteredHeading title={title} subtitle={subtitle} />
      {/* eslint-disable-next-line react/no-danger -- sanitised by sanitizeHtml() above */}
      <div className={typography} dangerouslySetInnerHTML={{ __html: clean }} />
    </section>
  )
}

/** Expandable question list with a plus / minus toggle on every row. */
export function FaqSection({
  title,
  subtitle,
  items,
}: {
  title?: string | null
  subtitle?: string | null
  items: HomeFaqItem[]
}) {
  const { t } = useTranslation()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (items.length === 0) {
    return null
  }

  return (
    <section className="mx-auto w-full max-w-[1470px] px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <CenteredHeading title={title ?? t('Frequently Asked Questions')} subtitle={subtitle} />
        <div className="divide-y divide-line-warm border-y border-line-warm">
          {items.map((item, index) => {
            const open = openIndex === index

            return (
              <div key={`${item.question}-${index}`}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenIndex(open ? null : index)}
                    className="group flex w-full items-center justify-between gap-4 py-5 text-left"
                  >
                    <span className="text-sm font-medium text-ink transition-colors group-hover:text-gold-deep sm:text-base">
                      {item.question}
                    </span>
                    <span
                      className={cn(
                        'grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-colors',
                        open
                          ? 'border-gold-deep bg-gold-deep text-ivory'
                          : 'border-line-warm text-ink group-hover:border-gold-deep group-hover:text-gold-deep',
                      )}
                    >
                      {open ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                </h3>
                <div
                  className={cn(
                    'grid transition-all duration-300 ease-out',
                    open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 text-sm leading-[1.8] text-ink-soft whitespace-pre-line">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/** KALKI slot #5 — "Best Sellers" product-card strip (image, name and price). */
export function BestSellersStrip({
  title,
  subtitle,
  products,
}: {
  title: string | null
  subtitle: string | null
  products: Product[]
}) {
  const { t } = useTranslation()
  const trackRef = useRef<HTMLDivElement>(null)
  const [scrollable, setScrollable] = useState(false)
  // Every product the section returns: five fill the rail at a time and the rest scroll in.
  const picks = products

  const syncScrollable = useCallback(() => {
    const track = trackRef.current
    if (!track) {
      return
    }
    setScrollable(track.scrollWidth > track.clientWidth + 1)
  }, [])

  // Ref callback: React 19 runs the returned cleanup on unmount or ref change.
  const attachTrack = useCallback(
    (track: HTMLDivElement | null) => {
      trackRef.current = track
      if (!track) {
        return
      }
      const onScroll = () => syncScrollable()
      const observer = new ResizeObserver(() => syncScrollable())
      track.addEventListener('scroll', onScroll, { passive: true })
      observer.observe(track)
      syncScrollable()
      return () => {
        track.removeEventListener('scroll', onScroll)
        observer.disconnect()
      }
    },
    [syncScrollable],
  )

  if (!picks.length) return null

  const scrollBy = (direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    const firstItem = track.firstElementChild as HTMLElement | null
    if (!firstItem) return
    const gap = Number.parseFloat(getComputedStyle(track).gap || '16')
    track.scrollBy({ left: direction * (firstItem.offsetWidth + gap), behavior: 'smooth' })
  }

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <CenteredHeading title={title ?? t('Best Sellers')} subtitle={subtitle} />
      <div className="relative">
        {scrollable && (
          <>
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label={t('Scroll products left')}
              className="absolute -left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line-warm bg-ivory text-ink-soft shadow-sm transition-colors hover:border-gold-mid/60 hover:text-gold-deep sm:-left-5"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label={t('Scroll products right')}
              className="absolute -right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-ink text-[#e6c97e] shadow-sm transition-colors hover:bg-[#2c2620] sm:-right-5"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}
        <div key={picks.length} ref={attachTrack} className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
          {picks.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.slug}`}
              className="group w-[calc((100%_-_1rem)/2)] shrink-0 snap-start sm:w-[calc((100%_-_2rem)/3)] md:w-[calc((100%_-_3rem)/4)] lg:w-[calc((100%_-_4rem)/5)]"
            >
              <div className="relative block aspect-[3/4] overflow-hidden rounded-xl bg-cream ring-1 ring-line-warm transition-all duration-300 group-hover:ring-gold-mid/50">
                {product.images?.[0] ? (
                  <img
                    src={assetUrl(product.images[0])}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[#a08a5c]">
                    <Package className="h-8 w-8" />
                  </span>
                )}
                {product.discount_percent > 0 && (
                  <span className="absolute left-3 top-3 rounded-full bg-ink/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#e6c97e] shadow-lg shadow-black/20 backdrop-blur">
                    {t('{{percent}}% off', { percent: Math.round(product.discount_percent) })}
                  </span>
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100">
                  {t('View')}
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
              <h3 className="mt-2.5 line-clamp-1 text-[13px] font-medium text-ink transition-colors group-hover:text-gold-deep">
                {product.name}
              </h3>
              <span className="mt-1 block text-xs font-semibold text-ink-soft/70">
                {product.brand?.name ?? product.category?.name ?? t('Curated collection')}
              </span>
              <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-sm font-bold tracking-tight text-ink">{formatCurrency(product.price)}</span>
                {product.mrp && product.mrp > product.price && (
                  <span className="text-xs text-ink-soft/60 line-through">{formatCurrency(product.mrp)}</span>
                )}
                {product.discount_percent > 0 && (
                  <span className="text-xs font-bold text-claret">
                    {t('{{percent}}% off', { percent: Math.round(product.discount_percent) })}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Responsive cards-per-view for the centre-mode rail (KALKI: 1 / 3 / 5). */
function useTrendingStylesPerView() {
  const [perView, setPerView] = useState(() =>
    window.matchMedia('(min-width: 1024px)').matches
      ? 5
      : window.matchMedia('(min-width: 768px)').matches
        ? 3
        : 1,
  )

  useEffect(() => {
    const medium = window.matchMedia('(min-width: 768px)')
    const large = window.matchMedia('(min-width: 1024px)')
    const update = () => setPerView(large.matches ? 5 : medium.matches ? 3 : 1)
    update()
    medium.addEventListener('change', update)
    large.addEventListener('change', update)
    return () => {
      medium.removeEventListener('change', update)
      large.removeEventListener('change', update)
    }
  }, [])

  return perView
}

/**
 * KALKI slot #7 — "Trending Styles".
 *
 * A faithful port of KALKI's `collection_video_grid_Lqtdtp` swiper:
 *  - centred 24px heading (Futura → Jost substitution),
 *  - a centre-mode rail where the active card sits full size while its
 *    neighbours are scaled down and tucked under solid page-coloured masks on
 *    both edges,
 *  - only the active card reveals its product name + black "View" button and
 *    autoplays its muted video (poster fades out); other cards show the still,
 *  - circular semi-transparent prev/next arrows, and clicking a video card
 *    opens the full-screen video lightbox.
 */
export function TrendingStyles({
  content,
  title,
  subtitle,
}: {
  content: HomeTrendingStylesContent
  title?: string | null
  subtitle?: string | null
}) {
  const { t } = useTranslation()
  const viewportRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const mobileTrackRef = useRef<HTMLDivElement>(null)
  const mobileVideoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const touchStartRef = useRef<number | null>(null)

  // The section title wins so the admin "Title" field is authoritative; the legacy
  // per-item `config.heading` is only a fallback for sections saved before the field.
  const heading = (title || content?.heading || '').trim()
  const subheading = (subtitle || '').trim()
  const items = Array.isArray(content?.items)
    ? content.items.filter((item) => item?.image || item?.video)
    : []
  const count = items.length

  const perView = useTrendingStylesPerView()
  const [viewportWidth, setViewportWidth] = useState(0)
  // Index into the tripled rail; -1 means "not placed yet" → defaults to the middle copy.
  const [pos, setPos] = useState(-1)
  // Mirrors `pos` synchronously so rapid arrow clicks / swipes accumulate instead of
  // every one of them resolving against the same stale render value.
  const posRef = useRef(-1)
  const [animate, setAnimate] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  // Mobile rail: index of the card currently snapped to the centre of the strip.
  const [mobileActive, setMobileActive] = useState(0)

  // Three copies so KALKI's loop always has neighbours on both sides.
  const rail = count > 0 ? [...items, ...items, ...items] : []
  // `-1` is the pre-placement sentinel; otherwise the index into the tripled rail.
  const activePos = pos < 0 ? count : pos

  const isMobile = perView === 1
  const gap = perView > 1 ? 20 : 12
  const cardWidth =
    perView > 0
      ? isMobile
        ? Math.max(260, Math.min(340, viewportWidth - 48))
        : Math.max(0, (viewportWidth - gap * (perView - 1)) / perView)
      : viewportWidth
  const step = cardWidth + gap
  const offset = Math.round(viewportWidth / 2 - (activePos * step + cardWidth / 2))

  const videoItems = items.filter((item) => item.video)

  // Measure the viewport on mount (ref callback) and on every resize.
  const attachViewport = useCallback((element: HTMLDivElement | null) => {
    viewportRef.current = element
    if (element) {
      setViewportWidth(element.clientWidth)
    }
  }, [])

  useLayoutEffect(() => {
    const element = viewportRef.current
    if (!element) {
      return
    }
    const observer = new ResizeObserver(() => setViewportWidth(element.clientWidth))
    observer.observe(element)
    return () => observer.disconnect()
  }, [count])

  // Advance one slide, KALKI-style: when a move would leave the middle copy, first
  // teleport onto the identical frame in the neighbouring copy (no transition), then
  // animate. That keeps the loop endless without relying on `transitionend`.
  const move = useCallback(
    (direction: -1 | 1) => {
      if (count === 0) {
        return
      }
      // Read the live position from the ref so several clicks inside one tick stack up.
      const current = posRef.current < 0 ? count : posRef.current
      const next = current + direction
      if (next < count) {
        flushSync(() => {
          setAnimate(false)
          posRef.current = current + count
          setPos(current + count)
        })
        setAnimate(true)
        posRef.current = next + count
        setPos(next + count)
        return
      }
      if (next > 2 * count - 1) {
        flushSync(() => {
          setAnimate(false)
          posRef.current = current - count
          setPos(current - count)
        })
        setAnimate(true)
        posRef.current = next - count
        setPos(next - count)
        return
      }
      setAnimate(true)
      posRef.current = next
      setPos(next)
    },
    [count],
  )

  // Only the centred card plays; the rest stay paused on their poster.
  useEffect(() => {
    if (isMobile) {
      return
    }
    videoRefs.current.forEach((video, index) => {
      if (!video) {
        return
      }
      if (index === activePos) {
        void video.play().catch(() => {})
      } else {
        video.pause()
      }
    })
  }, [activePos, count, isMobile])

  // Mobile: the rail is a native scroll strip, so the "active" card is the one
  // currently closest to the middle of the viewport. Keep it in sync with a
  // scroll listener (passive) so the right video autoplays after a swipe.
  const handleMobileScroll = useCallback(() => {
    const track = mobileTrackRef.current
    if (!track) {
      return
    }
    const centre = track.scrollLeft + track.clientWidth / 2
    let best = 0
    let bestDistance = Number.POSITIVE_INFINITY
    Array.from(track.children).forEach((child, index) => {
      const element = child as HTMLElement
      const cardCentre = element.offsetLeft + element.offsetWidth / 2
      const distance = Math.abs(cardCentre - centre)
      if (distance < bestDistance) {
        bestDistance = distance
        best = index
      }
    })
    setMobileActive((current) => (current === best ? current : best))
  }, [])

  // React's `onScroll` does not fire for this container, so the rail is watched
  // with a native passive listener instead.
  useEffect(() => {
    const track = mobileTrackRef.current
    if (!isMobile || !track) {
      return
    }
    track.addEventListener('scroll', handleMobileScroll, { passive: true })
    return () => track.removeEventListener('scroll', handleMobileScroll)
  }, [isMobile, count, handleMobileScroll])

  // Mobile: only the centred card plays its video.
  useEffect(() => {
    if (!isMobile) {
      return
    }
    mobileVideoRefs.current.forEach((video, index) => {
      if (!video) {
        return
      }
      if (index === mobileActive) {
        void video.play().catch(() => {})
      } else {
        video.pause()
      }
    })
  }, [isMobile, mobileActive, count])

  // Lightbox: lock scroll + keyboard navigation.
  useEffect(() => {
    if (lightbox === null) {
      return
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLightbox(null)
      }
      if (event.key === 'ArrowRight') {
        setLightbox((i) => (i === null ? i : (i + 1) % videoItems.length))
      }
      if (event.key === 'ArrowLeft') {
        setLightbox((i) => (i === null ? i : (i - 1 + videoItems.length) % videoItems.length))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [lightbox, videoItems.length])

  if (items.length === 0) {
    return null
  }

  const activeLightbox = lightbox === null ? null : (videoItems[lightbox] ?? null)

  const cardStateClass = (distance: number) => {
    if (distance === 0) {
      return 'md:z-10 md:scale-100 md:opacity-100'
    }
    if (distance === -1) {
      return 'md:z-[9] md:scale-[0.9] md:translate-x-1/2 md:opacity-100'
    }
    if (distance === 1) {
      return 'md:z-[9] md:scale-[0.9] md:-translate-x-1/2 md:opacity-100'
    }
    // KALKI hides the second-order neighbours between 767px and 1024px.
    if (distance === -2) {
      return 'md:z-[8] md:scale-[0.8] md:translate-x-[125%] md:opacity-0 lg:opacity-60'
    }
    if (distance === 2) {
      return 'md:z-[8] md:scale-[0.8] md:-translate-x-[125%] md:opacity-0 lg:opacity-60'
    }
    return 'md:opacity-0'
  }

  // On desktop only the centred card shows its info; on mobile every card does.
  const infoVisibility = (isActive: boolean) => (isActive ? 'block' : 'hidden max-md:block')

  // Shared caption block (product name + black "View" button).
  const renderCaption = (item: HomeTrendingStyleItem, isActive: boolean) => {
    const to = (item.url || '').trim()
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] flex flex-wrap items-end justify-center gap-2.5 p-[15px] text-center">
        {item.title && (
          <h3
            className={cn(
              'w-full truncate text-[14px] font-normal text-white md:text-[12px] lg:text-[14px]',
              infoVisibility(isActive),
            )}
          >
            {item.title}
          </h3>
        )}
        {to && (
          <Link
            to={to}
            className={cn(
              'pointer-events-auto w-full bg-black px-5 py-1.5 text-center text-[14px] font-normal text-white underline md:text-[12px] lg:text-[14px]',
              infoVisibility(isActive),
            )}
          >
            {t('View')}
          </Link>
        )}
      </div>
    )
  }

  return (
    <section className="font-store mx-auto w-full max-w-[1470px] px-4 pt-10 pb-5 md:pb-10 overflow-x-hidden">
      {/* ditto KALKI `.Common_title_new`: 30px gutter, 20px below 750px, 25px below 990px */}
      <div className="mb-5 text-center min-[750px]:mb-[25px] min-[990px]:mb-[30px]">
         <CenteredHeading title={heading} subtitle={subheading} />
        {/* <h2 className="text-left text-xl font-medium leading-[1.18] text-ink min-[750px]:text-center min-[750px]:text-2xl">
          {heading || t('Trending Styles')}
        </h2>
        {subheading && (
          <p className="mt-2 text-left text-sm leading-relaxed text-ink-soft min-[750px]:text-center">{subheading}</p>
        )} */}
      </div>

      {isMobile ? (
        /*
         * Mobile: a plain horizontal scroll-snap strip. No transform is applied here,
         * so the rail follows the finger 1:1 instead of the native scroll and the
         * carousel both moving at once (which made the strip slide on its own).
         */
        <div
          ref={mobileTrackRef}
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, index) => {
            const hasVideo = Boolean(item.video)
            const videoIndex = hasVideo ? videoItems.indexOf(item) : -1

            return (
              <div
                key={index}
                className="relative w-[calc(100%_-_44px)] shrink-0 snap-center overflow-hidden rounded-[15px] bg-ivory"
              >
                <div className="relative aspect-[9/16] w-full">
                  {item.image && (
                    <img
                      src={assetUrl(item.image)}
                      alt={item.title ?? ''}
                      loading="lazy"
                      className={cn(
                        'absolute inset-0 h-full w-full object-cover transition-opacity duration-200',
                        hasVideo && index === mobileActive ? 'opacity-0' : 'opacity-100',
                      )}
                    />
                  )}
                  {hasVideo && (
                    <video
                      ref={(element) => {
                        mobileVideoRefs.current[index] = element
                      }}
                      src={assetUrl(item.video)}
                      poster={item.image ? assetUrl(item.image) : undefined}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  {hasVideo && (
                    <button
                      type="button"
                      onClick={() => setLightbox(videoIndex)}
                      aria-label={t('Play video')}
                      className="absolute inset-0 z-[2] cursor-pointer"
                    />
                  )}
                </div>
                {renderCaption(item, true)}
              </div>
            )
          })}
        </div>
      ) : (
        /*
         * Desktop / tablet: KALKI's centre-mode slider. The container is clipped
         * (`overflow-hidden`, not `overflow-x-auto`) so the browser can never scroll
         * the rail natively — only the transform moves it, keeping the active card
         * perfectly centred.
         */
        <div
          ref={attachViewport}
          className="relative mx-auto w-full overflow-hidden touch-pan-x [-webkit-overflow-scrolling:touch]"
          style={{ touchAction: 'pan-x' }}
          onTouchStart={(event) => {
            touchStartRef.current = event.touches[0]?.clientX ?? null
          }}
          onTouchEnd={(event) => {
            const start = touchStartRef.current
            touchStartRef.current = null
            if (start === null) {
              return
            }
            const delta = (event.changedTouches[0]?.clientX ?? start) - start
            if (Math.abs(delta) > 40) {
              move(delta < 0 ? 1 : -1)
            }
          }}
        >
          <div
            className="flex w-max"
            style={{
              gap: `${gap}px`,
              transform: `translate3d(${offset}px, 0, 0)`,
              transition: animate ? 'transform 300ms ease' : 'none',
            }}
          >
            {rail.map((item, railIndex) => {
              const distance = railIndex - activePos
              const isActive = distance === 0
              const hasVideo = Boolean(item.video)
              const videoIndex = hasVideo ? videoItems.indexOf(item) : -1

              return (
                <div
                  key={railIndex}
                  style={{ width: cardWidth ? `${cardWidth}px` : undefined }}
                  className={cn(
                    'relative shrink-0 overflow-hidden rounded-[15px] bg-ivory transition-[opacity,scale,translate] duration-300',
                    cardStateClass(distance),
                  )}
                >
                  <div
                    className={cn(
                      'relative aspect-[9/16] w-full',
                      Math.abs(distance) === 1 && 'md:opacity-80',
                    )}
                  >
                    {item.image && (
                      <img
                        src={assetUrl(item.image)}
                        alt={item.title ?? ''}
                        loading="lazy"
                        className={cn(
                          'absolute inset-0 h-full w-full object-cover transition-opacity duration-200',
                          hasVideo && isActive ? 'opacity-0' : 'opacity-100',
                        )}
                      />
                    )}
                    {hasVideo && (
                      <video
                        ref={(element) => {
                          videoRefs.current[railIndex] = element
                        }}
                        src={assetUrl(item.video)}
                        poster={item.image ? assetUrl(item.image) : undefined}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                    {hasVideo && (
                      <button
                        type="button"
                        onClick={() => setLightbox(videoIndex)}
                        aria-label={t('Play video')}
                        className="absolute inset-0 z-[2] cursor-pointer"
                      />
                    )}
                  </div>

                  {renderCaption(item, isActive)}
                </div>
              )
            })}
          </div>

        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-20 hidden w-[15.7%] bg-ivory md:block lg:w-[20%]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-20 hidden w-[15.7%] bg-ivory md:block lg:w-[20%]"
        />

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label={t('Previous style')}
              className="absolute left-2 top-1/2 z-30 grid h-[35px] w-[35px] -translate-y-1/2 place-items-center rounded-full bg-[#404040]/50 text-white transition-colors hover:bg-[#404040]/70 md:left-[16.5%] lg:left-[21.2%]"
            >
              <ChevronLeft className="h-[14px] w-[14px]" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label={t('Next style')}
              className="absolute right-2 top-1/2 z-30 grid h-[35px] w-[35px] -translate-y-1/2 place-items-center rounded-full bg-[#404040]/50 text-white transition-colors hover:bg-[#404040]/70 md:right-[16.5%] lg:right-[21.2%]"
            >
              <ChevronRight className="h-[14px] w-[14px]" strokeWidth={2.5} />
            </button>
          </>
        )}
      </div>
      )}

      {activeLightbox && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
          onClick={() => setLightbox(null)}
          role="presentation"
        >
          <div
            className="relative w-[45vh] max-w-[80%]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <video
              key={activeLightbox.video}
              src={assetUrl(activeLightbox.video)}
              poster={activeLightbox.image ? assetUrl(activeLightbox.image) : undefined}
              controls
              autoPlay
              muted
              loop
              playsInline
              className="block h-[80vh] max-h-[80vh] w-full bg-black object-contain"
            />
            {videoItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setLightbox((i) =>
                      i === null ? i : (i - 1 + videoItems.length) % videoItems.length,
                    )
                  }
                  aria-label={t('Previous video')}
                  className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-[#404040]/50 text-white md:-left-12"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightbox((i) => (i === null ? i : (i + 1) % videoItems.length))}
                  aria-label={t('Next video')}
                  className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-[#404040]/50 text-white md:-right-12"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setLightbox(null)}
              aria-label={t('Close')}
              className="absolute -top-10 right-0 text-[28px] leading-none text-white"
            >
              ✕
            </button>
            {activeLightbox.url && (
              <Link
                to={activeLightbox.url}
                className="absolute inset-x-0 bottom-[30px] mx-auto block w-[200px] bg-black px-5 py-1.5 text-center text-sm font-bold text-white"
              >
                {t('View')}
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

/**
 * KALKI slot #12 — "Editor's Picks": two-up clickable banners at 800×586.
 *
 * Cards are driven by the admin repeater (uploaded banner image + link). The
 * overlaid title/subtitle are optional, and the heading is centered like KALKI.
 */
export function EditorsPicks({
  items,
  categories,
  title,
  subtitle,
}: {
  items?: MiniBannerItem[]
  categories?: Category[]
  title?: string | null
  subtitle?: string | null
}) {
  const picks: MiniBannerItem[] =
    items && items.length > 0
      ? items
      : (categories ?? []).map((category) => ({
          title: category.name,
          image: category.image ?? '',
          url: category.slug ? `/category/${category.slug}` : `/shop?category_id=${category.id}`,
        }))

  if (!picks.length) return null

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <CenteredHeading title={title} subtitle={subtitle} />
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-5">
        {picks.map((item, index) => {
          const hasText = Boolean(item.title || item.subtitle)
          return (
            <Link
              key={`${item.url}-${index}`}
              to={item.url || '/shop'}
              className="group relative block self-start overflow-hidden rounded-2xl bg-cream ring-1 ring-line-warm transition-all duration-300 hover:ring-gold-mid/60"
            >
              {item.image ? (
                // No fixed aspect ratio here: the image renders at the size the
                // admin uploaded (scaled to the column width), and the link
                // wrapper grows to match it.
                <img
                  src={assetUrl(item.image)}
                  alt={item.title}
                  loading="lazy"
                  className="block w-full transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <span className="grid aspect-[800/586] w-full place-items-center bg-gold-soft font-display text-6xl font-semibold text-gold-deep">
                  {item.title.charAt(0)}
                </span>
              )}
              {hasText && (
                <>
                  <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-7">
                    <span className="min-w-0">
                      {item.title && (
                        <span className="block font-display text-2xl font-semibold leading-tight text-white drop-shadow sm:text-3xl">
                          {item.title}
                        </span>
                      )}
                      {item.subtitle && (
                        <span className="mt-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                          {item.subtitle}
                        </span>
                      )}
                    </span>
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-ink shadow-lg transition-transform group-hover:-translate-y-0.5">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </span>
                </>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}

/** KALKI slot #16 — icon info tiles ("video call / styling"). Admin configured. */
export function IconInfoBand({ content }: { content: HomeIconInfoContent }) {
  const items = Array.isArray(content?.items) ? content.items : []

  if (!items.length) return null

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-5">
        {items.map(({ icon, title, description, url }, index) => {
          const Icon = valuePropIconMap[icon] ?? Sparkles
          const tileClassName =
            'group flex items-center gap-4 rounded-2xl border border-line-warm bg-ivory p-5 transition-all duration-300 hover:border-gold-mid/60 hover:shadow-[0_18px_44px_-18px_rgba(138,106,31,0.35)] sm:p-6'
          const body = (
            <>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-deep transition-colors group-hover:bg-gold-deep group-hover:text-[#f7efdb]">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                {title && (
                  <span className="block text-sm font-bold text-ink transition-colors group-hover:text-gold-deep">{title}</span>
                )}
                {description && <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">{description}</span>}
              </span>
              {url && (
                <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-gold-deep opacity-60 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              )}
            </>
          )

          const key = `${icon}-${title}-${index}`

          return url ? (
            <Link key={key} to={url} className={tileClassName}>
              {body}
            </Link>
          ) : (
            <div key={key} className={tileClassName}>
              {body}
            </div>
          )
        })}
      </div>
    </section>
  )
}

/**
 * KALKI "The Saree Edit" split feature: a media collage (one tall tile that can
 * hold a video with a poster image, plus a wide image and two smaller images)
 * beside a text block with an optional call to action.
 */
export function SplitCollage({
  content,
  title,
  subtitle,
}: {
  content: HomeSplitCollageContent
  title?: string | null
  subtitle?: string | null
}) {
  const { t } = useTranslation()

  const images: string[] = Array.isArray(content?.images) ? content.images.filter(Boolean) : []
  const hasVideo = Boolean(content?.video)
  const hasPoster = Boolean(content?.poster)

  let tallImage: string | null = null
  let rest = images

  if (!hasVideo) {
    if (hasPoster) {
      tallImage = content.poster
    } else if (images.length) {
      tallImage = images[0]
      rest = images.slice(1)
    }
  }

  const wideImage = rest[0] ?? null
  const smallImages = rest.slice(1, 3)
  const hasMedia = hasVideo || Boolean(tallImage) || Boolean(wideImage) || smallImages.length > 0
  const hasText = Boolean(content?.heading || content?.eyebrow || content?.description || content?.button_text)

  if (!hasMedia && !hasText) return null

  const mediaFirst = (content?.media_position ?? 'left') !== 'right'

  const media = (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <div className="relative aspect-[267/363] overflow-hidden rounded-2xl bg-cream ring-1 ring-line-warm/60">
        {hasVideo ? (
          <video
            src={assetUrl(content.video)}
            poster={hasPoster ? assetUrl(content.poster) : undefined}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        ) : tallImage ? (
          <img
            src={assetUrl(tallImage)}
            alt={content.heading || title || ''}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center bg-gold-soft font-display text-5xl font-semibold text-gold-deep">
            {t('Saree')}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:gap-3">
        <div className="aspect-[267/175] overflow-hidden rounded-2xl bg-cream ring-1 ring-line-warm/60">
          {wideImage && (
            <img src={assetUrl(wideImage)} alt="" loading="lazy" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2 sm:gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl bg-cream ring-1 ring-line-warm/60">
              {smallImages[i] && (
                <img src={assetUrl(smallImages[i])} alt="" loading="lazy" className="h-full w-full object-cover" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const text = (
    <div className="max-w-md">
      {content.eyebrow && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep">{content.eyebrow}</p>
      )}
      {content.heading && (
        <h3 className="heading-serif mt-3 text-[1.65rem] font-semibold tracking-tight text-ink sm:text-[2.1rem]">
          {content.heading}
        </h3>
      )}
      {content.description && (
        <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">{content.description}</p>
      )}
      {content.button_text && (
        <Button
          asChild
          className="mt-6 h-11 rounded-full bg-ink px-8 text-sm font-bold text-ivory hover:bg-ink/90"
        >
          <Link to={content.button_url || '/shop'}>{content.button_text}</Link>
        </Button>
      )}
    </div>
  )

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <CenteredHeading title={title} subtitle={subtitle} />
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <div className={cn('mx-auto w-full max-w-[100%] lg:mx-0', mediaFirst ? '' : 'lg:order-2')}>{media}</div>
        <div className={cn(mediaFirst ? '' : 'lg:order-1')}>{text}</div>
      </div>
    </section>
  )
}

export function ImageBanner({
  content,
  title,
  subtitle,
}: {
  content: HomeImageBannerContent
  title?: string | null
  subtitle?: string | null
}) {
  const { t } = useTranslation()

  const heading = (title || '').trim()
  const subheading = (subtitle || '').trim()
  const image = (content?.image || '').trim()
  const mobileImage = (content?.image_mobile || '').trim()
  const linkUrl = (content?.link_url || '').trim()
  const alt = (content?.alt || '').trim() || heading || t('Bride and groom collection')

  // ditto KALKI: the band is an image banner, so it stays hidden until one is configured.
  if (!image) return null

  const band = (
    <>
      {/* ditto KALKI `.Common_title_new`: 30px gutter, 20px below 750px, 25px below 990px */}
      {(heading || subheading) && (
        <div className="mb-5 text-center min-[750px]:mb-[25px] min-[990px]:mb-[30px]">
          <CenteredHeading title={heading} subtitle={subheading} />
          {/* {heading && (
            <h2 className="text-left text-xl font-medium leading-[1.18] text-ink min-[750px]:text-center min-[750px]:text-2xl">
              {heading}
            </h2>
          )}
          {subheading && (
            <p className="mt-2 text-left text-sm leading-relaxed text-ink-soft min-[750px]:text-center">
              {subheading}
            </p>
          )} */}
        </div>
      )}

      {/* ditto KALKI `.Index_middle_banner_infos_innerboxs_videoimage_new img`: plain full-width, no radius */}
      <picture>
        {mobileImage && <source media="(max-width: 749px)" srcSet={assetUrl(mobileImage)} />}
        <img src={assetUrl(image)} alt={alt} loading="lazy" className="block h-auto w-full rounded-2xl" />
      </picture>
    </>
  )

  return (
    /*
     * ditto KALKI `.Index_middle_banner_infos_main_new` (18px gutter, 12px below 750px,
     * 10px from 750–989px) + `.page-width` (max-width 1470px, 16px gutters).
     * KALKI links only the image; here the whole band is one link, as requested.
     */
    <section className="mx-auto my-3 w-full max-w-[1470px] px-4 min-[750px]:my-2.5 min-[990px]:my-[18px]">
      {linkUrl ? (
        <Link to={linkUrl} className="block w-full" aria-label={heading ? undefined : alt}>
          {band}
        </Link>
      ) : (
        band
      )}
    </section>
  )
}

/**
 * KALKI slot #10 — "Shop With A Stylist" (`index_form_app_detail_new`): a page-width band
 * with an optional full-bleed background photo and centred text (section title as `<h2>`,
 * subtitle as `<h3>`, description as `<p>`) above a single white CTA button.
 *
 * KALKI's headline packs two lines into one `<h2>` separated by a blank line, i.e. its
 * "subtitle" line is typeset exactly like the title — reproduced here with `h3`.
 * Without a background image the band falls back to the house dark gradient so the white
 * type stays legible (KALKI always ships a photo with this band).
 */
export function TextBanner({
  content,
  title,
  subtitle,
}: {
  content: HomeTextBannerContent
  title?: string | null
  subtitle?: string | null
}) {
  const { t } = useTranslation()

  const heading = (title || '').trim()
  const subheading = (subtitle || '').trim()
  const description = (content?.description || '').trim()
  const image = (content?.image || '').trim()
  const alt = (content?.alt || '').trim() || heading || t('Shop with a stylist')
  const buttonText = (content?.button_text || '').trim()
  const buttonUrl = (content?.button_url || '').trim() || '/shop'

  if (!heading && !subheading && !description && !buttonText && !image) {
    return null
  }

  // ditto KALKI: `.Index_form_app_detail_parts_2_detail_title_new h2` — 30px/600/118.222%,
  // capitalize, centred (24px 750–989px, 18px/500/122.222% + .18px tracking below 750px).
  const titleType =
    'heading-serif m-0 text-center text-[18px] font-medium capitalize leading-[1.2222] tracking-[0.18px] text-white min-[750px]:text-[24px] min-[750px]:font-semibold min-[750px]:leading-[1.1822] min-[750px]:tracking-normal min-[990px]:text-[30px]'

  return (
    // ditto `.Index_form_app_detail_main_new` (18px gutter, 10px below 990px) + `.page-width`
    <section className="mx-auto my-2.5 w-full max-w-[1470px] px-4 min-[990px]:my-[18px]">
      {/* ditto `.Index_form_app_detail_parts_new`: relative box, 50px padding (40px 750–989px, 40px/16px below 750px) */}
      <div className="relative rounded-2xl overflow-hidden p-10 px-4 min-[750px]:px-10 min-[990px]:p-[50px]">
        {image ? (
          // ditto `.Index_form_app_detail_parts_1_new` + its img: absolute, cover, fills the box
          <img
            src={assetUrl(image)}
            alt={alt}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-[#2c2620] to-[#4a3a26]" aria-hidden="true" />
        )}
        <div className="relative z-[1]">
          {heading && <h2 className={titleType}>{heading}</h2>}
          {subheading && <h3 className={`${titleType} mt-[1.22em] min-[750px]:mt-[1.18em]`}>{subheading}</h3>}
          {description && (
            // ditto `.Index_form_app_detail_parts_2_detail_infos_new`: 14px, +18px top (13px 750–989px,
            // 12px/133.33% with 6px/10px padding below 750px)
            <p className="m-0 px-[10px] pt-[6px] text-center text-[12px] leading-[1.3333] text-white min-[750px]:px-0 min-[750px]:pt-[18px] min-[750px]:text-[13px] min-[750px]:leading-[1.2] min-[990px]:text-[14px]">
              {description}
            </p>
          )}
          {buttonText && (
            // ditto `.Index_form_app_detail_parts_2_detail_forms_new`: 14px top, max 446px, 80%-wide
            // white pill (5px radius, 15px padding, 10px below 750px, #fffc on hover)
            <div className="mx-auto max-w-[446px] pt-[14px]">
              <Link
                to={buttonUrl}
                className="mx-auto block w-4/5 rounded-[5px] bg-white p-[10px] text-center text-[14px] leading-none text-black transition-colors hover:bg-white/80 min-[750px]:p-[15px]"
              >
                {buttonText}
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/**
 * KALKI slot #1 — the "bridal wedding dresses" top banner (`video_OR_image_new`): a
 * full-width autoplaying, looping, muted video (portrait clip swapped in below 750px
 * when the admin uploads one) with a bottom-anchored centred overlay: white headline
 * (section title) + description, and a single black CTA block underneath — measured
 * off the live KALKI page (h2 24/500/line-height 1, h3 18/500, CTA 16px on #000 with
 * 10px×20px padding, 20px top margin, overlay 30px off the bottom, z-index 9).
 *
 * Hidden entirely until an admin uploads a video, like KALKI's image fallback.
 */
export function VideoBanner({
  content,
  title,
}: {
  content: HomeVideoBannerContent
  title?: string | null
}) {
  const { t } = useTranslation()

  const video = (content?.video || '').trim()
  const videoMobile = (content?.video_mobile || '').trim()
  const poster = (content?.poster || '').trim()
  const heading = (title || '').trim()
  const description = (content?.description || '').trim()
  const buttonText = (content?.button_text || '').trim()
  const buttonUrl = (content?.button_url || '').trim() || '/shop'

  // React only writes `muted` as a DOM property; mirror it into the content attribute
  // (`defaultMuted`) so the markup matches KALKI's hand-written <video muted> and Chrome's
  // autoplay gate sees a muted clip. The play() nudge covers elements mounted after load.
  const attachVideo = useCallback((element: HTMLVideoElement | null) => {
    if (!element) return
    element.defaultMuted = true
    element.muted = true
    element.play()?.catch(() => undefined)
  }, [])

  if (!video) return null

  const hasOverlay = Boolean(heading || description || buttonText)
  const videoProps = {
    poster: poster ? assetUrl(poster) : undefined,
    autoPlay: true,
    muted: true,
    loop: true,
    playsInline: true,
    preload: 'metadata' as const,
  }

  return (
    // ditto `.Index_top_banner_slider_main_new` + `.page-width` (1470px, 16px gutters)
    <section className="mx-auto my-3 w-full max-w-[1470px] px-4 min-[750px]:my-2.5 min-[990px]:my-[18px]">
      {/*
       * The video sets the box height at its own intrinsic ratio (block, w-full,
       * height auto) so whatever the admin uploads is shown whole — no fixed
       * padding-ratio box, no object-cover cropping. The hidden breakpoint twin is
       * display:none, so it contributes no height.
       */}
      <div className="relative w-full overflow-hidden bg-ink">
        {videoMobile ? (
          <>
            <video
              {...videoProps}
              ref={attachVideo}
              src={assetUrl(video)}
              className="block h-auto w-full max-[749px]:hidden"
            />
            <video
              {...videoProps}
              ref={attachVideo}
              src={assetUrl(videoMobile)}
              className="block h-auto w-full min-[750px]:hidden"
            />
          </>
        ) : (
          <video
            {...videoProps}
            ref={attachVideo}
            src={assetUrl(video)}
            className="block h-auto w-full"
          />
        )}

        {/* faint scrim so the white type stays legible over bright clips */}
        {hasOverlay && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[8] h-2/5 bg-gradient-to-t from-black/35 to-transparent"
          />
        )}

        {/* ditto `.title-wrapper.subhead-wrapper`: absolute, full width, bottom-anchored, 3rem up, centred */}
        {hasOverlay && (
          <div className="absolute inset-x-0 bottom-0 z-[9] mb-6 text-center min-[750px]:mb-[30px]">
            {heading && (
              <h2 className="m-0 text-[18px] font-medium leading-none text-white min-[750px]:text-[24px]">
                {heading}
              </h2>
            )}
            {description && (
              <h3 className="m-0 mt-2 text-[15px] font-medium leading-none text-white min-[750px]:mt-2.5 min-[750px]:text-[18px]">
                {description}
              </h3>
            )}
            {buttonText && (
              /* ditto `.subhead-cta`: #000 block, 10px/20px padding, fit-content, 20px auto 0 */
              <Link
                to={buttonUrl}
                className="mx-auto mt-5 block w-fit bg-black px-5 py-[10px] text-[15px] font-normal leading-[1.8] text-white transition-colors hover:bg-black/80 min-[750px]:text-[16px]"
                aria-label={buttonText || heading || t('Video banner link')}
              >
                {buttonText}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

/**
 Section Type Product Carousel title + subtitle above a horizontally scrolling row of product cards, each
 with an image, title, and price. The row auto-advances one card at a time, wrapping
 around to the start when it reaches the end. The visitor can pause the auto-scroll
 by hovering or focusing on the row, or by touching it on a mobile device. 
 */
export function ProductCarousel({
  content,
  title,
  subtitle,
}: {
  content: HomeProductCarouselContent
  title?: string | null
  subtitle?: string | null
}) {
  const { t } = useTranslation()
  const trackRef = useRef<HTMLDivElement>(null)

  const heading = (title || '').trim()
  const subheading = (subtitle || '').trim()
  const buttonText = (content?.button_text || '').trim()
  const buttonUrl = (content?.button_url || '').trim() || '/shop'
  const items = (content?.items ?? []).filter((item) => (item.image || '').trim())
  const itemCount = items.length

  // KALKI's row advances on its own (Swiper autoplay). Nudge one card at a time
  // and wrap around; stand down while the visitor is interacting or when the OS
  // asks for reduced motion.
  useEffect(() => {
    const track = trackRef.current
    if (!track || itemCount < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let paused = false
    const pause = () => {
      paused = true
    }
    const resume = () => {
      paused = false
    }
    const tick = () => {
      const element = trackRef.current
      if (paused || !element) return
      const firstItem = element.firstElementChild as HTMLElement | null
      if (!firstItem) return
      const gap = Number.parseFloat(getComputedStyle(element).gap || '12')
      const step = firstItem.offsetWidth + gap
      // `clientWidth`/`scrollWidth` are integers that round a fractional flex
      // layout. Wrap as soon as one more full card would not fit, so a short row
      // never sticks while it is only part-way through the overflow.
      const maxScroll = element.scrollWidth - element.clientWidth
      const atEnd = element.scrollLeft + step > maxScroll + 1
      const target = atEnd ? 0 : element.scrollLeft + step
      const start = element.scrollLeft
      element.scrollTo({ left: target, behavior: 'smooth' })
      // A browser that has smooth scrolling disabled (reduced motion, a background
      // tab) drops the animated scroll silently. Settle the final position on the
      // next frame if nothing moved, so the row still advances.
      if (element.scrollLeft === start) {
        window.setTimeout(() => {
          if (trackRef.current === element && element.scrollLeft === start) {
            element.scrollLeft = target
          }
        }, 220)
      }
    }

    const timer = window.setInterval(tick, 3500)
    track.addEventListener('pointerenter', pause)
    track.addEventListener('pointerleave', resume)
    track.addEventListener('touchstart', pause, { passive: true })
    track.addEventListener('focusin', pause)
    track.addEventListener('focusout', resume)

    return () => {
      window.clearInterval(timer)
      track.removeEventListener('pointerenter', pause)
      track.removeEventListener('pointerleave', resume)
      track.removeEventListener('touchstart', pause)
      track.removeEventListener('focusin', pause)
      track.removeEventListener('focusout', resume)
    }
  }, [itemCount])

  if (!items.length) return null

  return (
    // ditto `.page-width` (1470px, 16px gutters) plus the section spacing
    <section className="mx-auto my-3 w-full max-w-[1470px] px-4 min-[750px]:my-2.5 min-[990px]:my-[18px]">
      {/* ditto `.List_collections_template_innerloop_mainboxs_new` */}
      <div className="mb-[13px] overflow-hidden rounded-2xl bg-[#FBF4EB] px-2.5 py-[30px] min-[750px]:mb-[30px] min-[750px]:p-5 min-[990px]:rounded-[24px] min-[990px]:p-[30px]">
        {/* ditto `.detail_new`: mobile reverses the column so the carousel leads */}
        <div className="flex flex-col-reverse min-[750px]:flex-row min-[750px]:items-center">
          {/* ditto `.detail_mainleft_new` */}
          <div className="w-full text-center min-[750px]:w-[200px] min-[990px]:w-[280px] min-[990px]:max-w-[21%] min-[990px]:px-5">
            <div className="min-[750px]:block">
              {heading && (
                <h2 className="m-0 mb-[10px] text-[24px] font-medium leading-[1.3] text-black">
                  {heading}
                </h2>
              )}
              {subheading && (
                <h3 className="m-0 text-[18px] font-medium leading-[1.2] text-black">
                  {subheading}
                </h3>
              )}
            </div>
            {buttonText && (
              <Link
                to={buttonUrl}
                className="mt-[10px] inline-block min-w-[130px] rounded-[2px] bg-black px-[7px] py-[7px] text-[12px] font-medium uppercase leading-none tracking-[0.6px] text-white transition-colors hover:bg-black/80 min-[990px]:min-w-0 min-[990px]:px-[30px] min-[990px]:py-3 min-[990px]:text-[16px] min-[990px]:tracking-[0.64px] min-[1200px]:mt-[30px]"
              >
                {buttonText}
              </Link>
            )}
          </div>

          {/* ditto `.detail_mainright_new` + `.swiper` */}
          <div className="mb-[30px] min-w-0 min-[750px]:mb-0 min-[750px]:flex-1 min-[750px]:pl-3 min-[990px]:pl-7">
            <div
              ref={trackRef}
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {items.map((item, index) => {
                const cardImage = item.image.trim()
                const cardTitle = (item.title || '').trim()
                const cardPrice = (item.price || '').trim()
                return (
                  <Link
                    key={index}
                    to={(item.url || '').trim() || '/shop'}
                    className="group w-[calc(50%-6px)] shrink-0 snap-start min-[750px]:w-[calc(50%-6px)] min-[990px]:w-[calc(33.333%-8px)]"                  >
                    {/* 141.43% padding box ditto `.innerright_image_new a`; image is centre-top */}
                    <span className="relative block w-full overflow-hidden rounded-xl bg-[#efe6d8] pb-[141.43%] min-[990px]:rounded-2xl">
                      <img
                        src={assetUrl(cardImage)}
                        alt={cardTitle || t('Product')}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />
                    </span>
                    {(cardTitle || cardPrice) && (
                      <span className="mt-2.5 block text-center">
                        {cardTitle && (
                          <span className="block truncate text-[14px] leading-snug text-black">
                            {cardTitle}
                          </span>
                        )}
                        {cardPrice && (
                          <span className="mt-0.5 block text-[14px] font-medium leading-snug text-black">
                            {cardPrice}
                          </span>
                        )}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * KALKI slot #17 — "Visit Our Instagram Diaries": a centred title + handle above
 * a grid of square image/video tiles. Tapping a tile opens an Instagram-style
 * lightbox dialog with the post media, caption and an optional permalink.
 */
export function InstagramDiaries({ content }: { content: HomeInstagramDiariesContent }) {
  const { t } = useTranslation()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const heading = (content?.heading || '').trim()
  const handle = (content?.handle || '').trim()
  const avatar = (content?.avatar || '').trim()
  const buttonText = (content?.button_text || '').trim()
  const buttonUrl = (content?.button_url || '').trim()

  const items = Array.isArray(content?.items)
    ? content.items.filter((item) => item?.image || item?.video)
    : []

  if (items.length === 0) return null

  const active = activeIndex !== null ? items[activeIndex] : null

  const step = (dir: -1 | 1) => {
    setActiveIndex((prev) => (prev === null ? prev : (prev + dir + items.length) % items.length))
  }

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      {(heading || handle) && (
        <div className="mb-6 text-center sm:mb-8">
           <CenteredHeading title={heading} />
          {/* {heading && (
            <h2 className="heading-serif text-[1.3rem] font-medium uppercase tracking-[0.08em] text-ink sm:text-[1.55rem]">
              {heading}
            </h2>
          )} */}
          {handle && <p className="mt-0 text-sm font-medium text-gold-deep sm:text-base">{handle}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        {items.map((item, index) => {
          const poster = item.image || item.poster
          return (
            <button
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className="group relative block aspect-square overflow-hidden rounded-xl bg-cream ring-1 ring-line-warm/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-mid sm:rounded-2xl"
              aria-label={t('Open Instagram post {{number}}', { number: index + 1 })}
            >
              {poster ? (
                <img
                  src={assetUrl(poster)}
                  alt={item.caption || ''}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              ) : (
                <video
                  src={assetUrl(item.video)}
                  muted
                  loop
                  playsInline
                  autoPlay
                  className="h-full w-full object-cover"
                />
              )}
              <span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/25" />
              <span className="pointer-events-none absolute right-2 top-2 text-white opacity-0 drop-shadow transition-opacity duration-300 group-hover:opacity-100">
                {item.video ? <Video className="h-5 w-5" /> : <InstagramGlyph className="h-5 w-5" />}
              </span>
            </button>
          )
        })}
      </div>

      {buttonText && buttonUrl && (
        <div className="mt-8 flex justify-center">
          <a
            href={buttonUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-ink/90"
          >
            <InstagramGlyph className="h-4 w-4" />
            {buttonText}
          </a>
        </div>
      )}

      <Dialog open={activeIndex !== null} onOpenChange={(open) => !open && setActiveIndex(null)}>
        <DialogContent
          aria-describedby={undefined}
          className="max-w-4xl gap-0 overflow-hidden p-0 sm:rounded-2xl"
        >
          <DialogTitle className="sr-only">{heading || t('Instagram post')}</DialogTitle>
          {active && (
            <div className="grid max-h-[88vh] grid-cols-1 md:grid-cols-[minmax(0,1fr)_340px]">
              <div className="relative flex items-center justify-center bg-black">
                {active.video ? (
                  <video
                    key={active.video}
                    src={assetUrl(active.video)}
                    poster={active.poster ? assetUrl(active.poster) : undefined}
                    controls
                    muted
                    loop
                    autoPlay
                    playsInline
                    className="max-h-[70vh] w-full object-contain md:max-h-[80vh]"
                  />
                ) : (
                  <img
                    src={assetUrl(active.image)}
                    alt={active.caption || ''}
                    className="max-h-[70vh] w-full object-contain md:max-h-[85vh]"
                  />
                )}
                {items.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => step(-1)}
                      aria-label={t('Previous')}
                      className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow transition hover:bg-white"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => step(1)}
                      className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow transition hover:bg-white"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto bg-background p-5 sm:max-h-[80vh]">
                <div className="flex items-center gap-3">
                  {avatar && (
                    <img
                      src={assetUrl(avatar)}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover ring-1 ring-line-warm"
                    />
                  )}
                  {handle && <p className="text-sm font-semibold text-ink">{handle}</p>}
                </div>

                {active.caption && (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">{active.caption}</p>
                )}

                {(active.likes || active.comments) && (
                  <div className="flex items-center gap-5 text-sm text-ink-soft">
                    {active.likes && (
                      <span className="inline-flex items-center gap-1.5">
                        <Heart className="h-4 w-4 text-gold-deep" />
                        {active.likes}
                      </span>
                    )}
                    {active.comments && (
                      <span className="inline-flex items-center gap-1.5">
                        <MessageCircle className="h-4 w-4 text-gold-deep" />
                        {active.comments}
                      </span>
                    )}
                  </div>
                )}

                {active.permalink && (
                  <a
                    href={active.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto inline-flex items-center gap-1.5 text-sm font-bold text-gold-deep transition-colors hover:text-[#8a6a1f]"
                  >
                    {t('View post')}
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}

/**
 * KALKI slot #18 store tile. Mirrors `visit-our-store.css`: the image is a cover
 * crop of the reference's 345×365 source and the caption is a flat 50% black block
 * flush with the image's bottom edge (KALKI's 10px tile padding only exists to make
 * the 20px gutters, so here the gutters live on the grid/slider cells instead).
 */
function StoreCard({ item }: { item: HomeStoreLocationItem }) {
  const name = (item.name ?? '').trim()
  const buttons = [
    { text: (item.button_text ?? '').trim(), url: (item.button_url ?? '').trim() },
    { text: (item.secondary_button_text ?? '').trim(), url: (item.secondary_button_url ?? '').trim() },
  ].filter((button) => button.text && button.url)

  return (
    <article className="relative aspect-[345/365] min-h-[250px] min-[768px]:min-h-[300px] min-[992px]:min-h-0">
      <img
        src={assetUrl(item.image)}
        alt={name}
        loading="lazy"
        className="absolute inset-0 block h-full w-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-black/50 pb-5 text-center">
        {name && (
          <h3 className="heading-serif mb-2 mt-[15px] px-1.5 text-[14px] font-normal leading-[14px] text-white min-[1025px]:mb-[15px] min-[1025px]:text-[18px] min-[1025px]:leading-[20px] min-[1281px]:text-[20px] min-[1281px]:leading-none">
            {name}
          </h3>
        )}
        {buttons.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {buttons.map((button) => (
              <Link
                key={`${button.text}-${button.url}`}
                to={button.url}
                className="block w-fit min-w-[130px] rounded-[2px] bg-white p-2.5 text-center text-[10px] uppercase leading-none text-black min-[768px]:text-[12px]"
              >
                {button.text}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

/**
 * KALKI slot #18 — "Visit our Stores". Mirrors the reference layout: the first four
 * cards sit in a fixed row, and any further cards go into a snap slider showing four
 * per view on desktop (two on mobile) with edge arrows, like the product rails.
 * Cards without an image are dropped and the section hides itself when none remain.
 */
export function StoreLocations({
  content,
  title,
  subtitle,
}: {
  content: HomeStoreLocationsContent
  title?: string | null
  subtitle?: string | null
}) {
  const { t } = useTranslation()
  const railRef = useRef<HTMLDivElement | null>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const items = (Array.isArray(content?.items) ? content.items : []).filter(
    (item) => (item?.image ?? '').trim(),
  )
  const fixedItems = items.slice(0, 4)
  const sliderItems = items.slice(4)

  const sync = useCallback(() => {
    const el = railRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    sync()
    window.addEventListener('resize', sync)

    return () => window.removeEventListener('resize', sync)
  }, [sync, items.length])

  const step = (direction: 1 | -1) => {
    const el = railRef.current
    const card = el?.querySelector<HTMLElement>('[data-store-card]')
    if (!el || !card) return
    el.scrollBy({ left: direction * (card.offsetWidth + 20), behavior: 'smooth' })
  }

  if (!items.length) return null

  const heading = (content?.heading ?? '').trim() || (title ?? '').trim() || null
  const tagline = (subtitle ?? '').trim()

  return (
    <section className="mx-auto w-full max-w-[1470px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      {(heading || tagline) && (
        <div className="mb-8 text-center">
          <CenteredHeading title={heading} />
          {tagline && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{tagline}</p>}
        </div>
      )}

      <div className="-mx-2.5">
        <div className="flex flex-wrap">
          {fixedItems.map((item, index) => (
            <div key={`fixed-${index}`} className="w-1/2 p-2.5 md:w-1/4">
              <StoreCard item={item} />
            </div>
          ))}
        </div>

        {sliderItems.length > 0 && (
          <div className="relative mt-2.5 px-2.5">
            {canPrev && (
              <button
                type="button"
                aria-label={t('Previous stores')}
                onClick={() => step(-1)}
                className="absolute left-2.5 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line-warm bg-white/95 text-ink shadow-lg transition hover:scale-105 hover:text-gold-deep"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div
              ref={railRef}
              onScroll={sync}
              className="flex snap-x gap-5 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {sliderItems.map((item, index) => (
                <div
                  key={`slide-${index}`}
                  data-store-card
                  className="w-[calc(50%-10px)] shrink-0 snap-start md:w-[calc(25%-15px)]"
                >
                  <StoreCard item={item} />
                </div>
              ))}
            </div>
            {canNext && (
              <button
                type="button"
                aria-label={t('Next stores')}
                onClick={() => step(1)}
                className="absolute right-2.5 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line-warm bg-white/95 text-ink shadow-lg transition hover:scale-105 hover:text-gold-deep"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

/** KALKI slot #18 — "Visit our Stores" band. Copy is admin configured; contact rows use real settings. */
export function VisitBand({ content }: { content: HomeVisitStoresContent }) {
  const { t } = useTranslation()
  const { data } = useWebsiteContent()
  const contact = data?.footer?.contact
  const rows: { icon: LucideIcon; label: string; value: string; href?: string }[] = []
  if (contact?.phone) rows.push({ icon: Phone, label: t('Call us'), value: contact.phone, href: `tel:${contact.phone}` })
  if (contact?.email) rows.push({ icon: Mail, label: t('Email us'), value: contact.email, href: `mailto:${contact.email}` })
  if (contact?.address) rows.push({ icon: MapPin, label: t('Visit us'), value: contact.address })

  const eyebrow = (content?.eyebrow ?? '').trim()
  const heading = (content?.title ?? '').trim()
  const description = (content?.description ?? '').trim()
  const buttonText = (content?.button_text ?? '').trim()
  const buttonUrl = (content?.button_url ?? '').trim()

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="relative overflow-hidden rounded-[1.4rem] border border-line-warm bg-gradient-to-br from-cream via-ivory to-ivory sm:rounded-[1.75rem]">
        <span className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-gold-mid/15 blur-3xl" />
        <div className="relative grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:gap-12">
          <div>
            {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-deep">{eyebrow}</p>}
            {heading && (
              <h2 className="heading-serif mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{heading}</h2>
            )}
            {description && <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">{description}</p>}
            {rows.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
                {rows.map(({ icon: Icon, label, value, href }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-deep">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft/70">{label}</span>
                      {href ? (
                        <a href={href} className="block text-sm font-semibold text-ink transition-colors hover:text-gold-deep">
                          {value}
                        </a>
                      ) : (
                        <span className="block text-sm font-semibold text-ink">{value}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {buttonText && buttonUrl && (
            <Button asChild size="lg" className="h-12 rounded-full bg-ink px-7 text-sm font-bold text-[#e9c891] shadow-lg shadow-[#8a6a1f]/20 transition-transform hover:-translate-y-0.5 hover:bg-[#2c2620]">
              <Link to={buttonUrl}>
                {buttonText} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}


