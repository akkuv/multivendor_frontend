import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { HomeSections } from '@/components/home/HomeSections'
import { NotFoundPage } from '@/features/website/pages/NotFoundPage'
import { useCustomPage } from '@/hooks/usePages'
import { useTranslation } from 'react-i18next'

/**
 * Storefront renderer for an admin-created page. The page lives at whatever path
 * the admin chose (e.g. `/women/women-ethnic-wear`), so the slug is derived from
 * the full pathname. It reuses the homepage section engine, so section types
 * render identically to the homepage.
 */
export function CustomPageView() {
  const { pathname } = useLocation()
  const { t } = useTranslation()

  const rawSlug = pathname.replace(/^\/+|\/+$/g, '')
  let slug = rawSlug
  try {
    slug = decodeURIComponent(rawSlug)
  } catch {
    slug = rawSlug
  }

  const { data, isLoading, error } = useCustomPage(slug || undefined)

  useEffect(() => {
    const title = data?.page?.meta_title || data?.page?.title
    if (title) {
      document.title = title
    }
  }, [data])

  if (!slug || isLoading) {
    if (!slug) {
      return <NotFoundPage />
    }
    return (
      <div className="bg-ivory">
        <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="mb-8 h-72 w-full rounded-2xl last:mb-0" />
          ))}
        </div>
      </div>
    )
  }

  // No data (404, network/query error, or a paused fetch) means there is no page
  // at this path — show the storefront 404 rather than a misleading empty state.
  if (error || !data) {
    return <NotFoundPage />
  }

  const sections = data.sections ?? []

  if (!sections.length) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <span className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
          <LayoutGrid className="h-6 w-6" />
        </span>
        <h1 className="text-xl font-semibold">{data?.page?.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('This page has no sections yet. Add some from the admin panel.')}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-ivory">
      <HomeSections sections={sections} heroHeadingLevel="h1" />
    </div>
  )
}
