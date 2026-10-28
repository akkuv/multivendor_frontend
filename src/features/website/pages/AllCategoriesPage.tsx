import { Link } from 'react-router-dom'
import { assetUrl } from '@/lib/assets'
import { ArrowRight, Tag } from 'lucide-react'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategories } from '@/hooks/useCategories'
import { useTranslation } from 'react-i18next'

export function AllCategoriesPage() {
  const { t } = useTranslation()
  const { data: categories, isLoading } = useCategories()

  return (
    <div>
      <Breadcrumb items={[{ label: t('All Categories') }]} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <p className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#a07a28]">
            <span className="h-px w-8 bg-[#c9a25a]/60" />
            {t('Shop by category')}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-[#1c1812] sm:text-4xl">
            {t('All Categories')}
          </h1>
          <p className="mt-2 text-[#6b5d47]">
            {t('Browse every category and find exactly what you are looking for.')}
          </p>
        </div>

        {isLoading || !categories ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-[1.75rem]">
                <Skeleton className="h-full w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="group relative aspect-[3/4] overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#f0e6d2] to-[#e8d6b4] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_26px_54px_-22px_rgba(160,122,40,0.5)]"
              >
                {cat.image ? (
                  <img
                    src={assetUrl(cat.image)}
                    alt={cat.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#a08a5c]">
                    <Tag className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0c08]/80 via-[#0f0c08]/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <span className="block font-display text-sm font-semibold text-white sm:text-base">
                    {cat.name}
                  </span>
                  <span className="mt-1.5 flex translate-y-1 items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#e6c97e] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    {t('Shop now')} <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}