import { useState, useEffect, type ReactNode } from 'react'
import { assetUrl } from '@/lib/assets'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Copy,
  Heart,
  Lock,
  Minus,
  Play,
  Plus,
  RotateCcw,
  Scale,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Tag,
  Truck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useProduct, useProductOffers } from '@/hooks/useProducts'
import { useAddToCart } from '@/hooks/useCart'
import { useToggleWishlist, useWishlistIds } from '@/hooks/useWishlist'
import { ReviewSection } from '@/components/common/ReviewSection'
import { ProductQuestionSection } from '@/components/common/ProductQuestionSection'
import { ProductQueryComposer } from '@/components/common/ProductQueryComposer'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { estimatedDeliveryWindow, formatCurrency } from '@/utils/format'
import { isRecentlyAdded } from '@/utils/product'
import {
  recordProductView,
  getRelatedProducts,
  getFrequentlyBought,
  getRecentlyViewed,
} from '@/services/cx'
import { getColors } from '@/services/catalog'
import { useQuery } from '@tanstack/react-query'
import { ProductRail } from '@/components/common/ProductRail'
import type { ProductOffer } from '@/types'
import { useTranslation } from 'react-i18next'

/* ─────────────────────────────────────────────────────────────
   KALKI-in.kalkifashion.com PDP — measured values (1440×900)
   Reference: /products/baby-pink-tissue-saree-with-velvet-...
   - ink        #0F0D1A   (title/body text)
   - CTA dark   #172926   (outline add-to-cart + solid buy-now)
   - selected   #3F3D4D   (active option pill)      radius 28px
   - taxes      #756F6F  · mrp grey #73717E        · accent copper #AA6437
   - grid       838px gallery / 70px gutter / 412px buy box
   - gallery    thumbs 88px (desktop) + main frame shown at the image's
                natural aspect (object-contain, no crop/zoom per user request)
   - title     18px/500 capitalize · base text 16px ink
   - CTAs       412×47 · uppercase 14px · ls 0.56px · radius 6 · border 2px
   - option row border-top rgba(73,71,86,.15) (≈ #494756/25)
   ───────────────────────────────────────────────────────────── */

const CTA_DARK = 'bg-[#172926] text-white border-[#172926]'
const CTA_OUTLINE = 'border-[#172926] text-[#172926] hover:bg-[#F2F4F3]'
const PILL_ACTIVE = 'border-[#3F3D4D] bg-[#3F3D4D] text-white'
const PILL_IDLE = 'border-[#494756]/30 bg-white text-ink hover:border-[#172926]'

type VariantLike = { attributes?: Record<string, string> | null }

function variantAttr(v: VariantLike, key: string): string | undefined {
  const attrs = v.attributes ?? {}
  const match = Object.keys(attrs).find((k) => k.trim().toLowerCase() === key)
  return match !== undefined ? attrs[match] : undefined
}

function variantMatches(v: VariantLike, selected: Record<string, string>): boolean {
  return Object.entries(selected).every(([key, value]) => variantAttr(v, key) === value)
}

function groupVariantOptions(variants: VariantLike[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {}
  for (const variant of variants) {
    for (const [key, value] of Object.entries(variant.attributes ?? {})) {
      if (!value) continue
      const k = key.trim().toLowerCase()
      if (!groups[k]) groups[k] = []
      if (!groups[k].includes(value)) groups[k].push(value)
    }
  }
  return groups
}

function optionKeys(groups: Record<string, string[]>): string[] {
  // KALKI order: size-like options first, then colour.
  const rank = (key: string): number => (key === 'size' ? 0 : key === 'color' ? 1 : 2)
  return Object.keys(groups).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
}

function optionName(key: string): string {
  if (key === 'color') return 'Colour'
  if (key === 'size') return 'Size'
  return key.replace(/^./, (c) => c.toUpperCase()).replace(/_/g, ' ')
}

const COLOR_HEX: Record<string, string> = {
  Black: '#1e1e1e',
  White: '#f4f4f4',
  Navy: '#1f3561',
  Grey: '#7d8184',
  Stone: '#aca49b',
  Blue: '#2456a4',
  Teal: '#0f7c7f',
  Olive: '#6b7f2f',
  Camel: '#bf8f63',
  Burgundy: '#6e1d2a',
  Forest: '#1f5b35',
  Rose: '#c94a6b',
  Charcoal: '#3a3f44',
  Sky: '#6fb5d6',
  Mustard: '#d9a423',
  Mint: '#7fcfa0',
  Coral: '#ef6f5c',
}

const LIGHT_SWATCHES = new Set([
  'White',
  'Mint',
  'Sky',
  'Yellow',
  'Mustard',
  'Rose',
  'Coral',
  'Grey',
  'Stone',
])

function colorHex(value: string): string {
  return COLOR_HEX[value] ?? '#e2e8f0'
}

function offerLabel(offer: ProductOffer): string {
  if (offer.type === 'FIXED') {
    const min = offer.min_amount ? ` on orders above ${formatCurrency(offer.min_amount)}` : ''
    return `Flat ${formatCurrency(offer.value)} off${min}`
  }
  const upper = offer.max_discount ? ` up to ${formatCurrency(offer.max_discount)}` : ''
  const min = offer.min_amount ? `, minimum order ${formatCurrency(offer.min_amount)}` : ''
  return `${offer.value}% off${upper}${min}`
}

/** KALKI-style full-width section title (24px/500 capitalize, ink). */
function RailHeading({ children }: { children: ReactNode }) {
  return <h2 className="text-2xl font-medium capitalize text-ink">{children}</h2>
}

/** KALKI-style collapsible section (20px/500 capitalize header, 60px tall). */
function CollapseSection({
  title,
  preview,
  isOpen,
  onToggle,
  children,
}: {
  title: string
  preview?: string
  isOpen: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className="border-t border-[#494756]/20">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="group flex w-full items-center justify-between py-5 pr-2 text-left"
      >
        <span className="min-w-0">
          <span className="block text-xl font-medium capitalize text-ink">{title}</span>
          {preview && !isOpen && (
            <span className="mt-0.5 block truncate text-sm text-ink-soft">{preview}</span>
          )}
        </span>
        <span className="grid h-6 w-6 shrink-0 place-items-center text-ink-soft">
          {isOpen ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
        </span>
      </button>
      <div
        role="region"
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="pb-7 text-[15px] leading-relaxed text-ink/80">{children}</div>
        </div>
      </div>
    </div>
  )
}

export function ProductPage() {
  const { t } = useTranslation()
  const { slug } = useParams()
  const navigate = useNavigate()
  const productKey = slug ?? ''
  const { data: product, isLoading } = useProduct(productKey || undefined)
  const productId = product?.id ?? 0
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const isCustomer = !!token && user?.role === 'CUSTOMER'
  const addToCart = useAddToCart()
  const wishlistIds = useWishlistIds(isCustomer)
  const isWishlisted = product ? wishlistIds.has(product.id) : false
  const toggleWishlist = useToggleWishlist()
  const [activeImage, setActiveImage] = useState(0)
  const [aspects, setAspects] = useState<Record<string, number>>({})
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [cartError, setCartError] = useState('')
  const [copiedOffer, setCopiedOffer] = useState<string | null>(null)
  const [openDetails, setOpenDetails] = useState<string[]>([])

  const copyOfferCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // Clipboard may be unavailable on some browsers; feedback still shows.
    }
    setCopiedOffer(code)
    window.setTimeout(() => setCopiedOffer(null), 1600)
  }

  const { data: related } = useQuery({
    queryKey: ['related', productId],
    queryFn: () => getRelatedProducts(productId),
    enabled: productId > 0,
  })

  const { data: fbt } = useQuery({
    queryKey: ['frequently-bought', productId],
    queryFn: () => getFrequentlyBought(productId),
    enabled: productId > 0,
  })

  const { data: recentlyViewed } = useQuery({
    queryKey: ['recently-viewed', productId],
    queryFn: getRecentlyViewed,
    enabled: isCustomer,
  })

  const { data: offers } = useProductOffers(productId > 0 ? productId : undefined)

  const { data: adminColors } = useQuery({
    queryKey: ['colors'],
    queryFn: getColors,
  })

  useEffect(() => {
    if (token && productId && productId > 0) recordProductView(productId).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, productId])

  useEffect(() => {
    if (!product) return
    const groups = groupVariantOptions(product.variants ?? [])
    const preselect: Record<string, string> = {}
    for (const key of optionKeys(groups)) {
      if (groups[key].length === 1) preselect[key] = groups[key][0]
    }
    setSelected(preselect)
  }, [product])

  // Canonicalise the URL to the product's slug. Links and legacy URLs may use a
  // numeric id; once we know the slug, rewrite the address bar to use it.
  useEffect(() => {
    if (product?.slug && product.slug !== productKey) {
      navigate(`/product/${product.slug}`, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.slug, productKey])

  if (isLoading) {
    return (
      <div className="mx-auto min-h-screen max-w-[1400px] px-4 py-10 sm:px-6">
        <Skeleton className="mb-10 h-5 w-80 rounded" />
        <div className="lg:grid lg:grid-cols-[minmax(0,838px)_minmax(0,412px)] lg:gap-[70px]">
          <Skeleton className="h-[420px] w-full rounded-none sm:h-[min(68vh,840px)]" />
          <div className="mt-8 space-y-5 lg:mt-0">
            <Skeleton className="h-6 w-3/4 rounded" />
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-8 w-56 rounded" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-24 text-center sm:px-6">
        <p className="text-xl font-medium text-ink">{t('Product not found')}</p>
        <Button
          asChild
          className="mt-6 rounded-md bg-[#172926] px-8 text-white hover:bg-[#243a36]"
        >
          <Link to="/shop">{t('Back to Shop')}</Link>
        </Button>
      </div>
    )
  }

  const variants = (product.variants ?? []).filter((v) => v.status === 'ACTIVE')
  const needsVariant = variants.length > 0
  const groups = groupVariantOptions(variants)
  const keys = optionKeys(groups)
  const matchedVariant = variants.find((v) => variantMatches(v, selected))
  const selectedVariant =
    matchedVariant ??
    (keys.length === 0
      ? (variants.find((v) => (v.available_stock ?? 0) > 0) ?? variants[0])
      : undefined)
  const missingOptions = keys.filter((key) => !selected[key])
  const resolved = missingOptions.length === 0

  const images = product.images?.length ? product.images : []
  // Only swap to a variant's images once the shopper has actually chosen an
  // option. With nothing selected `variantMatches(v, {})` is vacuously true and
  // would otherwise resolve to the first variant for every product.
  const hasSelectedOption = Object.keys(selected).length > 0
  const gallerySource = keys.length === 0 || hasSelectedOption ? selectedVariant : undefined
  const gallery = gallerySource?.images?.length ? gallerySource.images : images
  // Images first, then any uploaded/linked product videos, so the gallery stays
  // image-led while videos remain reachable from the same thumbnail strip.
  const media: Array<{ type: 'image' | 'video'; url: string; thumbnail?: string | null }> = [
    ...gallery.map((url) => ({ type: 'image' as const, url })),
    ...(product.videos ?? []).map((video) => ({
      type: 'video' as const,
      url: video.url,
      thumbnail: video.thumbnail_url,
    })),
  ]
  const adminColorHex = new Map((adminColors ?? []).map((c) => [c.name.toLowerCase(), c.hex_code]))
  const colorSwatchHex = (value: string): string => adminColorHex.get(value.toLowerCase()) ?? colorHex(value)
  const unitPrice = selectedVariant?.price ?? product.price
  const mrp = selectedVariant?.mrp ?? product.mrp ?? null
  const stock = selectedVariant?.available_stock ?? product.available_stock ?? 0
  const inStock = stock > 0
  const isReturnable = product.is_returnable ?? true
  const saved = mrp && mrp > unitPrice ? mrp - unitPrice : 0
  const savedPct = mrp && mrp > unitPrice ? Math.round((saved / mrp) * 100) : 0
  const ratingAvg = product.rating?.average ?? null
  const ratingCount = product.rating?.count ?? 0
  const subtotal = quantity * unitPrice
  const activeMedia = media[activeImage] ?? media[0]
  const activeImg =
    activeMedia?.type === 'image' ? activeMedia.url : (product.images?.[0] ?? '')
  // Frame is sized to the photo's own aspect ratio so it fills edge-to-edge
  // (no letterboxing). A floor keeps extreme panoramas from towering the page.
  const activeAspect = activeMedia ? aspects[activeMedia.url] : undefined

  const selectOption = (key: string, value: string) => {
    if (key === 'color') setActiveImage(0)
    setSelected((prev) => {
      const next = { ...prev }
      if (next[key] === value) delete next[key]
      else next[key] = value
      return next
    })
  }

  const isAvailable = (key: string, value: string) => {
    const probe = { ...selected }
    delete probe[key]
    probe[key] = value
    return variants.some((v) => variantMatches(v, probe) && (v.available_stock ?? 0) > 0)
  }

  const runAddToCart = (onSuccess?: () => void) => {
    if (!token) {
      window.location.href = '/login'
      return
    }
    setCartError('')
    addToCart.mutate(
      {
        productId: product.id,
        variantId: needsVariant ? Number(selectedVariant?.id) : null,
        quantity: Math.min(quantity, Math.max(1, stock)),
      },
      {
        onSuccess: () => {
          setAdded(true)
          onSuccess?.()
        },
        onError: (e) => setCartError((e as Error).message),
      },
    )
  }

  const specs: Record<string, string> = {}
  if (product.specifications) {
    if (Array.isArray(product.specifications)) {
      for (const line of product.specifications) {
        if (!line) continue
        const [rawKey, ...rest] = line.split(':')
        const key = rawKey?.trim()
        const value = rest.join(':').trim()
        if (key && value) specs[key] = value
      }
    } else {
      for (const [k, v] of Object.entries(product.specifications)) {
        if (v) specs[k] = String(v)
      }
    }
  }
  const highlights = Array.isArray(product.highlights) ? product.highlights.filter(Boolean) : []
  const ctaDisabled = !inStock || !resolved || addToCart.isPending || added

  const detailSections: Array<{ id: string; title: string; preview?: string; body: ReactNode }> = []

  const previewOf = (text: string) => text.replace(/\s+/g, ' ').trim().slice(0, 110)

  detailSections.push({
    id: 'details',
    title: t('Product Details'),
    preview: previewOf(
      [
        `Style No: ${selectedVariant?.sku ?? product.sku}`,
        product.brand?.name && `Brand: ${product.brand.name}`,
        product.category?.name && `Category: ${product.category.name}`,
        ...Object.entries(specs).map(([k, v]) => `${k}: ${v}`),
      ]
        .filter(Boolean)
        .join(' · '),
    ),
    body: (
      <div className="space-y-5">
        <dl className="space-y-1.5">
          {[
            ['Style No', selectedVariant?.sku ?? product.sku],
            product.brand?.name && ['Brand', product.brand.name],
            product.category?.name && ['Category', product.category.name],
            selected['color'] && ['Colour', selected['color']],
            ...Object.entries(specs).map(([k, v]) => [k, v] as const),
          ]
            .filter((row): row is [string, string] => Boolean(row && row[1]))
            .map(([label, value], index) => (
              <div
                key={`${label}-${index}`}
                className="flex flex-wrap gap-x-2 text-[15px] leading-relaxed"
              >
                <dt className="font-semibold text-ink">{label}:</dt>
                <dd className="text-ink/80">{value}</dd>
              </div>
            ))}
        </dl>
        {product.description && (
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink/80">
            {product.description}
          </p>
        )}
        {highlights.length > 0 && (
          <div className="space-y-2">
            <p className="pt-1 text-[15px] font-semibold text-ink">{t('Product Speciality')} :</p>
            {highlights.map((highlight, index) => {
              // Highlights arrive as "Label: text" lines ("Care instructions : …",
              // "Disclaimer : …"). Bold the label to mirror the KALKI PDP.
              const match = highlight.match(/^([A-Za-z][A-Za-z /]{2,40}?)\s*:\s*([\s\S]+)$/)
              if (match && /^(care instructions|disclaimer)$/i.test(match[1].trim())) {
                return (
                  <p key={index} className="text-[15px] leading-relaxed text-ink/80">
                    <span className="font-semibold text-ink">{match[1].trim()} :</span> {match[2]}
                  </p>
                )
              }
              return (
                <p key={index} className="whitespace-pre-line text-[15px] leading-relaxed text-ink/80">
                  {highlight}
                </p>
              )
            })}
          </div>
        )}
      </div>
    ),
  })

  const fitTip = product.short_description ?? product.description
  if (fitTip) {
    detailSections.push({
      id: 'fit',
      title: t('Style & Fit Tips'),
      preview: previewOf(fitTip),
      body: <p className="whitespace-pre-line">{fitTip}</p>,
    })
  }

  const policyText =
    product.return_policy ??
    (isReturnable && product.return_days
      ? `${t('Return this item within')} ${product.return_days} ${t('days of delivery for a full refund.')}`
      : null)
  if (policyText || inStock) {
    detailSections.push({
      id: 'returns',
      title: t('Cancellation, Shipping & Returns'),
      preview: previewOf(
        [
          policyText,
          inStock
            ? `${t('Estimated delivery')} : ${estimatedDeliveryWindow()}`
            : t('Currently out of stock'),
        ]
          .filter(Boolean)
          .join(' · '),
      ),
      body: (
        <div className="space-y-4">
          {policyText ? (
            <div className="space-y-3">
              {policyText
                .split(/\n+/)
                .map((paragraph) => paragraph.trim())
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
            </div>
          ) : null}
          {isReturnable ? null : (
            <p>{t('This product is not returnable or cancellable.')}</p>
          )}
          <p className="flex items-center gap-2.5 text-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F0FAF2]">
              <Truck className="h-4 w-4 text-[#223330]" strokeWidth={1.5} />
            </span>
            <span>
              {t('Estimated delivery :')}{' '}
              <span className="font-medium text-ink">
                {inStock ? estimatedDeliveryWindow() : t('Currently out of stock')}
              </span>
            </span>
          </p>
        </div>
      ),
    })
  }

  const faqs = Array.isArray(product.faqs)
    ? [...product.faqs].sort((a, b) => a.sort_order - b.sort_order)
    : []
  if (faqs.length > 0) {
    detailSections.push({
      id: 'faqs',
      title: t('Frequently Asked Questions'),
      preview: previewOf(faqs.map((faq) => faq.question).join(' · ')),
      body: (
        <div className="divide-y divide-[#494756]/15">
          {faqs.map((faq) => (
            <details key={faq.id} className="group py-3 first:pt-0 last:pb-0" open={false}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-medium text-ink marker:content-none">
                {faq.question}
                <Plus className="h-4 w-4 shrink-0 text-ink-soft group-open:hidden" />
                <Minus className="hidden h-4 w-4 shrink-0 text-ink-soft group-open:block" />
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-ink/80">{faq.answer}</p>
            </details>
          ))}
        </div>
      ),
    })
  }

  const toggleDetail = (id: string) =>
    setOpenDetails((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const crumb = [
    product.category?.name && { label: product.category.name, to: `/category/${product.category.slug}` },
    product.subcategory?.name && {
      label: product.subcategory.name,
      to: `/category/${product.subcategory.slug}`,
    },
  ].filter((x): x is { label: string; to: string } => Boolean(x && x.to))

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-32 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-10">
      {/* ── Breadcrumb ── */}
      <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-ink-soft" aria-label="Breadcrumb">
        <Link to="/" className="transition-colors hover:text-[#AA6437]">
          {t('Home')}
        </Link>
        {crumb.map(({ label, to }) => (
          <span key={to} className="flex items-center gap-2">
            <span className="text-ink-soft/40">/</span>
            <Link to={to} className="transition-colors hover:text-[#AA6437]">
              {label}
            </Link>
          </span>
        ))}
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-ink-soft/40">/</span>
          <span className="truncate font-medium text-ink">{product.name}</span>
        </span>
      </nav>

      {/* ── Main grid: gallery | buy box ── */}
      <div className="lg:grid lg:grid-cols-[minmax(0,838px)_minmax(0,412px)] lg:gap-[70px] lg:items-start">
        {/* Gallery (sticky on desktop, matches KALKI MagicToolbox) */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-col-reverse gap-3 lg:flex-row lg:gap-[30px]">
            {media.length > 1 && (
              <div
                className="flex gap-2.5 overflow-x-auto pb-1 lg:flex-col lg:gap-3 lg:overflow-visible lg:pb-0"
                role="tablist"
                aria-label={t('Product media')}
              >
                {media.map((item, i) => (
                  <button
                    key={`${item.type}-${item.url}-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={i === activeImage}
                    aria-label={`Show media ${i + 1}`}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      'relative h-[92px] w-[66px] shrink-0 overflow-hidden border lg:h-[123px] lg:w-[88px]',
                      i === activeImage
                        ? 'border-[#172926]'
                        : 'border-transparent opacity-70 hover:opacity-100',
                    )}
                  >
                    {item.type === 'image' ? (
                      <img src={assetUrl(item.url)} alt="" className="h-full w-full object-cover" />
                    ) : item.thumbnail ? (
                      <img src={assetUrl(item.thumbnail)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <>
                        <video
                          src={assetUrl(item.url)}
                          muted
                          playsInline
                          preload="metadata"
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute inset-0 grid place-items-center bg-black/25">
                          <Play className="h-4 w-4 text-white" />
                        </span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div
              className="relative w-full overflow-hidden bg-white"
              style={
                activeAspect
                  ? {
                      aspectRatio: String(
                        activeMedia?.type === 'video' ? activeAspect : Math.max(activeAspect, 0.7),
                      ),
                    }
                  : { minHeight: 'min(68vh, 560px)' }
              }
              onClick={(e) => {
                if (activeMedia?.type === 'video') return
                if (media.length <= 1) return
                if (e.target instanceof Element && e.target.closest('button')) return
                setActiveImage((prev) => (prev + 1) % media.length)
              }}
            >
              {/* The frame adopts the photo's own aspect ratio so the image fills
                  it edge-to-edge with no letterboxing. Only an unusually tall
                  photo is height-capped (and cropped slightly) to keep the page
                  from stretching. */}
              {activeMedia?.type === 'video' ? (
                <video
                  key={activeMedia.url}
                  src={assetUrl(activeMedia.url)}
                  autoPlay
                  muted
                  loop
                  controls
                  playsInline
                  onLoadedMetadata={(e) => {
                    const el = e.currentTarget
                    if (!el.videoWidth || !el.videoHeight) return
                    const ratio = el.videoWidth / el.videoHeight
                    setAspects((prev) =>
                      prev[activeMedia.url] === ratio ? prev : { ...prev, [activeMedia.url]: ratio },
                    )
                  }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <img
                  key={activeMedia?.url}
                  src={assetUrl(activeImg)}
                  alt={product.name}
                  onLoad={(e) => {
                    const el = e.currentTarget
                    if (!el.naturalWidth || !el.naturalHeight) return
                    const ratio = el.naturalWidth / el.naturalHeight
                    setAspects((prev) => (prev[activeImg] === ratio ? prev : { ...prev, [activeImg]: ratio }))
                  }}
                  className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
                />
              )}

              {/* discount / best-seller badges (KALKI: 11px chip) */}
              <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
                {product.discount_percent > 0 ? (
                  <span className="bg-[#F2D6C2] px-1.5 py-0.5 text-[11px] font-medium text-[#3A0B08]">
                    {product.discount_percent}% OFF
                  </span>
                ) : (
                  isRecentlyAdded(product) && (
                    <span className="bg-white/90 px-1.5 py-0.5 text-[11px] font-medium text-ink">
                      {t('New arrival')}
                    </span>
                  )
                )}
                {product.best_seller && (
                  <span className="bg-white/90 px-1.5 py-0.5 text-[11px] font-medium text-ink">
                    {t('Best Seller')}
                  </span>
                )}
              </div>

              {/* counter */}
              {activeMedia?.type !== 'video' && (
                <span className="absolute bottom-3 right-3 rounded-none bg-white/80 px-2 py-0.5 text-[11px] font-medium text-ink backdrop-blur">
                  {activeImage + 1} / {media.length}
                </span>
              )}

              {/* Zoom hint removed — the gallery shows the full image (see above) */}

              {media.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveImage((prev) => (prev - 1 + media.length) % media.length)}
                    aria-label={t('Previous image')}
                    className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/50 bg-white/85 text-ink shadow-md backdrop-blur transition hover:bg-white"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImage((prev) => (prev + 1) % media.length)}
                    aria-label={t('Next image')}
                    className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/50 bg-white/85 text-ink shadow-md backdrop-blur transition hover:bg-white"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Buy box (412px column, KALKI order) ── */}
        <div className="mt-8 space-y-6 lg:mt-0">
          {/* Title + Style No + Price — tight group like KALKI */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-[18px] font-medium capitalize leading-snug text-ink">
                  {product.name}
                </h1>
                <p className="mt-1 text-sm text-ink">
                  <span className="text-ink-soft">Style No:</span>{' '}
                  {selectedVariant?.sku ?? product.sku}
                </p>
              </div>
              <button
                aria-label={t('Toggle wishlist')}
                onClick={() => {
                  if (!isCustomer) {
                    if (!token) window.location.href = '/login'
                    return
                  }
                  toggleWishlist.mutate(product)
                }}
                disabled={toggleWishlist.isPending}
                className={cn(
                  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors',
                  isWishlisted
                    ? 'border-gold-mid/60 bg-gold-soft text-gold-deep'
                    : 'border-[#494756]/25 bg-white text-ink-soft hover:text-gold-deep',
                )}
              >
                <Heart className={cn('h-4 w-4', isWishlisted && 'fill-gold-deep text-gold-deep')} />
              </button>
            </div>

            {/* Price */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-[18px] font-medium text-ink">
                  {formatCurrency(unitPrice)}
                </span>
                {mrp && mrp > unitPrice && (
                  <span className="flex items-baseline gap-1">
                    <span className="text-sm text-[#73717E]">MRP</span>
                    <span className="text-base text-[#73717E] line-through">
                      {formatCurrency(mrp)}
                    </span>
                    <span className="text-[13px] font-medium text-[#AA6437]">{savedPct}% OFF</span>
                  </span>
                )}
              </div>
              <p className="text-xs capitalize text-[#756F6F]">{t('Inclusive of all taxes')}</p>
              {(product.fees?.length ?? 0) > 0 && (
                <p className="text-xs text-[#756F6F]">
                  {t('Product fees')}:{' '}
                  {product.fees!.map((fee) => `${fee.name} ${formatCurrency(fee.amount)}`).join(' · ')}
                </p>
              )}
            </div>
          </div>

          {/* Rating */}
          {ratingAvg != null && ratingCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i < Math.round(ratingAvg) ? 'fill-[#C99B3F] text-[#C99B3F]' : 'text-[#D9D2C0]',
                    )}
                  />
                ))}
              </span>
              <span className="text-sm font-medium text-ink">{ratingAvg.toFixed(1)}</span>
              <a href="#reviews" className="text-sm text-ink-soft underline-offset-2 hover:underline">
                ({ratingCount} {t('reviews')})
              </a>
            </div>
          )}

          {/* Offers (functional: coupon codes from the backend) */}
          {(offers?.length ?? 0) > 0 && (
            <div className="border border-dashed border-[#C99B3F]/50 bg-ivory px-4 py-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold-deep">
                <Tag className="h-3.5 w-3.5" /> {t('Available offers')}
              </p>
              <ul className="mt-3 space-y-2">
                {offers!.slice(0, 5).map((offer) => (
                  <li key={offer.id} className="flex items-start gap-2 text-sm text-ink/80">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-soft text-gold-deep">
                      <Tag className="h-3 w-3" />
                    </span>
                    <span className="min-w-0">
                      <span>
                        {offerLabel(offer)}
                        {offer.first_order_only && (
                          <span className="text-ink-soft"> · {t('first order only')}</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyOfferCode(offer.code)}
                        className="ml-1.5 inline-flex items-center gap-1 rounded border border-dashed border-gold-mid/50 bg-white px-1.5 py-0.5 font-mono text-xs font-semibold text-gold-deep transition-colors hover:bg-gold-soft"
                        aria-label={`Copy coupon code ${offer.code}`}
                      >
                        {copiedOffer === offer.code ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {offer.code}
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Variant selection (size pills first, then colour swatches) */}
          {needsVariant && (
            <div className="space-y-6">
              {keys.map((key) => (
                <div key={key} className="border-t border-[#494756]/20 pt-5">
                  <div className="mb-3 flex items-baseline justify-between">
                    <p className="text-lg font-normal text-ink">
                      {optionName(key)} <span className="text-ink-soft">:</span>{' '}
                      <span className="font-medium">{selected[key] ?? t('Please select')}</span>
                    </p>
                  </div>

                  {key === 'color' ? (
                    <div className="flex flex-wrap items-center gap-3">
                      {groups[key].map((value) => {
                        const available = isAvailable(key, value)
                        const active = selected[key] === value
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => available && selectOption(key, value)}
                            disabled={!available}
                            aria-label={`${value} colour`}
                            aria-pressed={active}
                            title={available ? value : `${value} (${t('out of stock')})`}
                            className={cn(
                              'relative flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200',
                              active ? 'border-[#172926]' : 'border-[#494756]/25',
                              !available && 'cursor-not-allowed opacity-30',
                            )}
                          >
                            <span
                              className="flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-black/10"
                              style={{ backgroundColor: colorSwatchHex(value) }}
                            >
                              {active && (
                                <Check
                                  className={cn(
                                    'h-3.5 w-3.5',
                                    LIGHT_SWATCHES.has(value) ? 'text-ink' : 'text-white',
                                  )}
                                  strokeWidth={3}
                                />
                              )}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2.5">
                      {groups[key].map((value) => {
                        const available = isAvailable(key, value)
                        const active = selected[key] === value
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => available && selectOption(key, value)}
                            disabled={!available}
                            aria-pressed={active}
                            className={cn(
                              'rounded-[28px] border px-4 py-3 text-sm transition-all duration-200',
                              active ? PILL_ACTIVE : available ? PILL_IDLE : 'cursor-not-allowed opacity-35 line-through',
                            )}
                          >
                            {value}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
              {missingOptions.length > 0 && (
                <p className="border-t border-[#494756]/20 pt-4 text-sm font-medium text-gold-deep">
                  {t('Select')} {missingOptions.map(optionName).join(' and ')} {t('to add to cart')}
                </p>
              )}
            </div>
          )}

          {/* Availability + delivery (KALKI sold-out note style when needed) */}
          {!inStock ? (
            <div className="border-[3px] border-[#AAC2FC] bg-[#E4ECFF] px-3 py-2.5 text-[13px] leading-snug text-[#F4473D]">
              {t('This size is sold out and will be made to order for you. Est. delivery may vary.')}
            </div>
          ) : (
            <div className="border-t border-[#494756]/20 pt-5">
              <p className="flex items-center gap-2.5 text-base leading-relaxed text-ink">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F0FAF2]">
                  <Truck className="h-4 w-4 text-[#223330]" strokeWidth={1.5} />
                </span>
                <span>
                  {t('Estimated delivery :')}{' '}
                  <span className="font-medium">{estimatedDeliveryWindow()}</span>
                </span>
              </p>
              <p className="mt-2 pl-[34px] text-sm text-ink-soft">
                {isReturnable && product.return_days
                  ? `${product.return_days}-day easy returns`
                  : t('This product is not returnable')}
                {inStock && ` · ${stock} ${t('available')}`}
              </p>
            </div>
          )}

          {/* Quantity */}
          <div className="border-t border-[#494756]/20 pt-5">
            <p className="mb-2.5 text-lg text-ink">
              {t('Quantity')} <span className="text-ink-soft">:</span>
            </p>
            <div className="flex w-fit items-center border border-[#494756]/30">
              <button
                className="px-3.5 py-2.5"
                aria-label={t('Decrease quantity')}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={added || addToCart.isPending}
              >
                <Minus className="h-4 w-4 text-ink" />
              </button>
              <span className="w-9 text-center text-base font-medium text-ink">{quantity}</span>
              <button
                className="px-3.5 py-2.5"
                aria-label={t('Increase quantity')}
                onClick={() => setQuantity((q) => Math.min(q + 1, Math.max(1, stock)))}
                disabled={added || addToCart.isPending || quantity >= stock}
              >
                <Plus className="h-4 w-4 text-ink" />
              </button>
            </div>
          </div>

          {/* CTAs — KALKI 412×47 outline + solid, uppercase 14 ls .56 */}
          <div className="space-y-2.5">
            <Button
              size="lg"
              disabled={ctaDisabled}
              onClick={() => runAddToCart()}
              className={cn(
                'flex h-[47px] w-full items-center justify-between rounded-[6px] border-2 px-6 text-sm font-medium uppercase tracking-[0.56px] transition-colors',
                added
                  ? 'border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800'
                  : `${CTA_OUTLINE} bg-white`,
              )}
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" /> {t('Added to Cart')}
                </>
              ) : addToCart.isPending ? (
                <span className="w-full animate-pulse text-center">{t('Adding…')}</span>
              ) : (
                <>
                  <span className="flex items-center gap-2.5">
                    <ShoppingCart className="h-4 w-4" /> ADD TO CART
                  </span>
                  <span className="tracking-normal">{formatCurrency(subtotal)}</span>
                </>
              )}
            </Button>

            <Button
              size="lg"
              disabled={ctaDisabled}
              onClick={() => runAddToCart(() => navigate('/checkout'))}
              className={cn(
                'flex h-[47px] w-full items-center justify-center gap-2.5 rounded-[6px] border-2 text-sm font-medium uppercase tracking-[0.56px] transition-colors',
                CTA_DARK,
              )}
            >
              <ShoppingBag className="h-4 w-4" /> {t('Buy it now')}
            </Button>

            {added && (
              <Button asChild variant="outline" className="w-full rounded-md border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100">
                <Link to="/cart">
                  {t('Go to Cart')} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}

            {cartError && (
              <p className="rounded-md border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
                {cartError}
              </p>
            )}
          </div>

          {/* Trust grid — KALKI 2×2 (Protection / Returns / Quality / Shipping) */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-[#494756]/20 pt-5">
            {[
              { icon: ShieldCheck, label: t('100% Purchase Protection') },
              {
                icon: RotateCcw,
                label: isReturnable && product.return_days ? `${product.return_days}-day easy returns` : t('No returns'),
              },
              { icon: BadgeCheck, label: t('Assured Quality') },
              { icon: Lock, label: t('Secure payments') },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <Icon className="h-4.5 w-4.5 shrink-0 text-gold-deep" />
                <span className="text-base text-ink">{label}</span>
              </div>
            ))}
          </div>

          {/* Collapsible sections (KALKI right-column accordions) */}
          {detailSections.length > 0 && (
            <div className="pt-1">
              {detailSections.map((section) => (
                <CollapseSection
                  key={section.id}
                  title={section.title}
                  preview={section.preview}
                  isOpen={openDetails.includes(section.id)}
                  onToggle={() => toggleDetail(section.id)}
                >
                  {section.body}
                </CollapseSection>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ Full-width rails (sliders) ─────────────────── */}
      {(related?.length ?? 0) > 0 && (
        <ProductRail title={t('Similar Products')} products={related!} />
      )}

      {(fbt?.length ?? 0) > 0 && (
        <ProductRail title={t('Complete Your Look')} products={fbt!} />
      )}

      {(recentlyViewed?.length ?? 0) > 0 && (
        <ProductRail title={t('Recently Viewed')} products={recentlyViewed!} />
      )}

      {/* ── Reviews ── */}
      <section id="reviews" className="mt-20 scroll-mt-28">
        <RailHeading>{t('Customer Reviews')}</RailHeading>
        <div className="mt-6">
          <ReviewSection productId={product.id} isLive={inStock} />
        </div>
      </section>

      {/* ── Questions & answers ── */}
      <section className="mt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <RailHeading>{t('Questions & answers')}</RailHeading>
          <ProductQueryComposer productId={product.id} productName={product.name} />
        </div>
        <div className="mt-6">
          <ProductQuestionSection productId={product.id} />
        </div>
      </section>

      {/* Footer actions */}
      <div className="mt-14 flex flex-wrap items-center justify-center gap-4 border-t border-line-warm pt-8">
        <Button
          asChild
          variant="outline"
          className="h-11 rounded-md border-[#494756]/30 px-8 text-ink hover:border-[#172926] hover:bg-white hover:text-[#172926]"
        >
          <Link to={`/compare?ids=${product.id}`}>
            <Scale className="mr-1.5 h-4 w-4" /> {t('Compare this product')}
          </Link>
        </Button>
        <Button asChild variant="ghost" className="h-11 rounded-md px-6 text-ink-soft">
          <Link to="/shop">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> {t('Back to shop')}
          </Link>
        </Button>
      </div>

      {/* ═══════════ Mobile sticky buy bar ─────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line-warm bg-white/95 px-4 py-3 backdrop-blur-lg lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-ink-soft">{product.name}</p>
            <p className="flex items-baseline gap-1.5">
              <span className="text-xl font-medium text-ink">{formatCurrency(subtotal)}</span>
              {mrp && mrp > unitPrice && (
                <span className="text-xs text-[#73717E] line-through">{formatCurrency(mrp * quantity)}</span>
              )}
            </p>
          </div>

          <button
            aria-label={t('Toggle wishlist')}
            onClick={() => {
              if (!isCustomer) {
                if (!token) window.location.href = '/login'
                return
              }
              toggleWishlist.mutate(product)
            }}
            disabled={toggleWishlist.isPending}
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-md border transition-colors',
              isWishlisted
                ? 'border-gold-mid/60 bg-gold-soft text-gold-deep'
                : 'border-[#494756]/25 bg-white text-ink-soft',
            )}
          >
            <Heart className={cn('h-5 w-5', isWishlisted && 'fill-gold-deep text-gold-deep')} />
          </button>

          <Button
            size="lg"
            disabled={ctaDisabled}
            onClick={() => runAddToCart()}
            className={cn(
              'h-[47px] flex-1 rounded-md border-2 text-sm font-medium uppercase tracking-[0.56px]',
              added
                ? 'border-emerald-700 bg-emerald-700 text-white'
                : `${CTA_OUTLINE} bg-white`,
            )}
          >
            {added ? (
              <>
                <Check className="h-4 w-4" /> {t('Added')}
              </>
            ) : addToCart.isPending ? (
              <span className="animate-pulse">{t('Adding…')}</span>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" /> ADD TO CART
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}