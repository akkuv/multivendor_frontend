import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  CalendarDays,
  ShieldAlert,
  Store,
  Trash2,
} from 'lucide-react'
import { deleteVendorReview, getMyVendorReviews } from '@/services/vendorReview'
import type { VendorReview } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RatingStars } from '@/components/common/RatingStars'
import { AccountSubPageHeader } from '@/components/common/AccountSubPageHeader'
import { formatDate } from '@/utils/format'
import { useTranslation } from 'react-i18next'

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function MyVendorReviewItem({
  review,
  onDelete,
}: {
  review: VendorReview
  onDelete: () => void
}) {
  const { t } = useTranslation()
  return (
    <li className="overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start gap-4 p-4 sm:p-5">
        <Link to={`/vendors/${review.vendor_id}`} className="shrink-0">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg border bg-primary/10 text-primary">
            <Store className="h-6 w-6" />
          </div>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <RatingStars value={review.rating} readonly />
              <Link
                to={`/vendors/${review.vendor_id}`}
                className="mt-1 block truncate text-sm font-semibold transition-colors hover:text-primary hover:underline"
              >
                {review.vendor?.store_name ?? `Vendor #${review.vendor_id}`}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" /> {formatDate(review.created_at)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('Delete review')}
                title={t('Delete review')}
                onClick={onDelete}
                className="text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {review.title && <p className="mt-2 text-sm font-medium">{review.title}</p>}
          {review.body && <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {review.is_verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                <BadgeCheck className="h-3.5 w-3.5" /> {t('Verified Customer')}
              </span>
            )}
            {review.is_approved ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                {t('Approved')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
                {t('Pending approval')}
              </span>
            )}
            {review.is_hidden && (
              <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 font-medium text-rose-700">
                {t('Hidden')}
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

export function MyVendorReviewsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['my-vendor-reviews'],
    queryFn: getMyVendorReviews,
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteVendorReview(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-vendor-reviews'] }),
    onError: (e) => setError((e as { message?: string }).message ?? 'Unable to delete review.'),
  })

  const reviews = data?.data ?? []
  const approvedCount = reviews.filter((r) => r.is_approved).length
  const pendingCount = reviews.filter((r) => !r.is_approved).length
  const average =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <AccountSubPageHeader
        icon={Store}
        title={t('Vendor Reviews')}
        subtitle={t('Manage the reviews you have written for stores you ordered from.')}
        actions={
          reviews.length > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {reviews.length} review{reviews.length > 1 ? 's' : ''}
            </span>
          ) : undefined
        }
      />

      {error && (
        <p className="mb-4 flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <ShieldAlert className="h-4 w-4" /> {error}
        </p>
      )}

      {reviews.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label={t('Total reviews')} value={reviews.length} />
          <StatCard label={t('Average rating')} value={average > 0 ? average.toFixed(1) : '—'} />
          <StatCard label={t('Approved')} value={approvedCount} />
          <StatCard label={t('Pending')} value={pendingCount} />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <MyVendorReviewItem
              key={review.id}
              review={review}
              onDelete={remove.isPending ? () => {} : () => remove.mutate(review.id)}
            />
          ))}
        </ul>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Store className="h-8 w-8" />
            </div>
            <p className="font-display text-xl font-bold">{t('No vendor reviews yet')}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {t('Reviews you write for vendors you ordered from will appear here.')}
            </p>
            <Button asChild className="mt-5">
              <Link to="/shop">{t('Start Shopping')}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}