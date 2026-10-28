import { Link } from 'react-router-dom'
import { assetUrl } from '@/lib/assets'
import { ArrowRight } from 'lucide-react'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { useBrands } from '@/hooks/useCatalog'
import { useTranslation } from 'react-i18next'

export function AllBrandsPage() {
  const { t } = useTranslation()
  const { data: brands, isLoading } = useBrands()
  const count = brands?.length ?? 0

  return (
    <div>
      <Breadcrumb items={[{ label: t('All Brands') }]} />
      <section className="relative overflow-hidden bg-[#faf6ee] py-12 sm:py-16">
        {/* faint gold serif watermark */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1 -translate-x-1/2 select-none whitespace-nowrap font-display text-[24vw] font-semibold italic leading-none text-[#c9a25a]/[0.08] lg:text-[10rem]"
        >
          {t('Labels')}
        </span>

        <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-5 sm:mb-12">
            <div>
              <p className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#a07a28]">
                <span className="h-px w-8 bg-[#c9a25a]/60" />
                {t('Shop the labels')}
              </p>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[#1c1812] sm:text-4xl">
                {t('All Brands')}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6b5d47]">
                {t('Browse every brand and shop their products in one place.')}
              </p>
            </div>
            {!isLoading && brands && (
              <span className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1c1812] px-6 text-sm font-bold text-[#f5efdf] shadow-lg shadow-[#1c1812]/25 ring-1 ring-[#c9a25a]/40">
                {t('{{count}} labels', { count })}
              </span>
            )}
          </div>

          {isLoading || !brands ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-[150px] rounded-3xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
              {brands.map((brand, index) => (
                <Link
                  key={brand.id}
                  to={`/shop?brand_id=${brand.id}`}
                  className="group relative flex min-h-[150px] flex-col items-center justify-center rounded-3xl bg-card px-5 py-6 text-center shadow-[0_10px_28px_-16px_rgba(160,122,40,0.35)] ring-1 ring-[#e6dcc4] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_46px_-20px_rgba(160,122,40,0.55)] hover:ring-[#c9a25a]/70"
                >
                  <span className="absolute right-4 top-3 font-display text-[11px] italic text-[#c9a25a]/50 transition-colors group-hover:text-[#8a6a1f]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl ring-1 ring-[#e6dcc4] transition-colors group-hover:ring-[#c9a25a]">
                    {brand.logo ? (
                      <img
                        src={assetUrl(brand.logo)}
                        alt={brand.name}
                        loading="lazy"
                        className="h-8 w-auto max-w-[52px] object-contain transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gold font-display text-lg font-semibold text-[#1a1308]">
                        {brand.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="max-w-full truncate font-display text-sm font-semibold text-[#2a2419] transition-colors group-hover:text-[#8a6a1f]">
                    {brand.name}
                  </span>
                  {typeof brand.products_count === 'number' && brand.products_count > 0 && (
                    <span className="mt-1 text-[11px] font-semibold text-[#8b7a5e]">
                      {brand.products_count === 1
                        ? t('{{count}} product', { count: brand.products_count })
                        : t('{{count}} products', { count: brand.products_count })}
                    </span>
                  )}
                  <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a6a1f] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    {t('Shop now')} <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}