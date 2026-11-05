import { Link } from 'react-router-dom'
import { assetUrl } from '@/lib/assets'
import { Tag } from 'lucide-react'
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
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-semibold text-[#1c1812] sm:text-4xl">
            {t('All Categories')}
          </h1>
          <p className="mt-2 text-[#6b5d47]">
            {t('Browse every category and find exactly what you are looking for.')}
          </p>
        </div>

        {isLoading || !categories ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl border border-line-warm bg-white">
                <Skeleton className="h-full w-full rounded-2xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {categories.map((cat) => {
              const iconSrc = cat.icon || cat.image
              return (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-line-warm bg-white px-3 py-5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-mid/60 hover:shadow-md"
                >
                  {iconSrc ? (
                    <img
                      src={assetUrl(iconSrc)}
                      alt={cat.name}
                      
                      className="h-12 w-12 rounded-xl object-contain transition-transform duration-300 group-hover:scale-110 sm:h-14 sm:w-14"
                    />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-50 text-[#5b4a8a] sm:h-14 sm:w-14">
                      <Tag className="h-6 w-6" />
                    </div>
                  )}
                  <span className="line-clamp-2 text-sm font-semibold text-[#2a2540]">
                    {cat.name}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}