import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/components/common/admin'
import { AdminHomeManagerPage } from '@/features/website/pages/admin/AdminHomeManagerPage'
import { useAdminPage } from '@/hooks/usePages'
import { useTranslation } from 'react-i18next'

/**
 * Section manager for one admin-created page. Reuses the homepage section editor so
 * every section type is available, scoped to the page via its id.
 */
export function AdminPageManagerPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const pageId = Number(id)
  const validId = Number.isFinite(pageId) && pageId > 0

  const { data: page, isLoading, error, refetch } = useAdminPage(validId ? pageId : undefined)

  if (!validId) {
    return (
      <div className="rounded-xl border bg-background p-6">
        <ApiError error={new Error(t('This page could not be found.'))} onRetry={() => navigate('/admin/pages')} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/pages')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t('All pages')}
        </Button>
        {page && (
          <a
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            href={`/${page.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            /{page.slug}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : error ? (
        <ApiError error={error} onRetry={() => refetch()} />
      ) : (
        <AdminHomeManagerPage
          pageId={pageId}
          heading={page?.title ?? t('Page')}
          description={t('Build this page from the same section types as the homepage.')}
        />
      )}

      <p className="text-xs text-muted-foreground">
        <Link to="/admin/pages" className="hover:underline">
          {t('Back to all pages')}
        </Link>
      </p>
    </div>
  )
}
