import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { HomeSections } from '@/components/home/HomeSections'
import { useHome } from '@/hooks/useHome'
import { useTranslation } from 'react-i18next'

/**
 * The storefront homepage: an ordered list of admin-managed sections rendered by
 * the shared {@link HomeSections} renderer (also used by custom pages).
 */
export function HomePage() {
  const { t } = useTranslation()
  const { data, isLoading, error } = useHome()

  const sections = data?.sections ?? []

  if (isLoading) {
    return (
      <div className="bg-ivory">
        <Skeleton className="mx-3 mt-3 h-[480px] w-[calc(100%-1.5rem)] rounded-2xl sm:mx-5 sm:mt-5 lg:mx-8" />
        <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="mb-8 h-72 w-full rounded-2xl last:mb-0" />
          ))}
        </div>
      </div>
    )
  }

  if (error && !sections.length) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center bg-cream px-4 text-center">
        <span className="mb-5 grid h-14 w-14 place-items-center rounded-full bg-gold-soft text-gold-deep ring-1 ring-gold-mid/30">
          <Sparkles className="h-6 w-6" />
        </span>
        <h2 className="heading-serif text-2xl font-semibold tracking-tight text-ink">{t('We couldn’t load the storefront')}</h2>
        <p className="mb-6 mt-2 text-sm text-ink-soft">{t('Please try again or continue browsing our latest fashion.')}</p>
        <Button asChild className="rounded-full bg-ink px-6 font-bold text-[#e9c891] hover:bg-[#2c2620]">
          <Link to="/shop">{t('Browse Products')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-ivory">
      <HomeSections sections={sections} heroHeadingLevel="h1" />
    </div>
  )
}
