import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assetUrl } from '@/lib/assets'
import { useState } from 'react'
import { BadgeCheck, ImageOff, ShieldAlert, Star, Trash2 } from 'lucide-react'
import {
  deleteReview,
  getProductReviews,
  submitReview,
} from '@/services/review'
import type { Review } from '@/types'
import { Button } from '@/components/ui/button'
import { RatingStars } from '@/components/common/RatingStars'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from 'react-i18next'

function reviewInitials(name?: string): string {
  if (!name) return 'C'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('')
}

/** The API may nest a review's image list one level deep; flatten defensively. */
function reviewImages(review: Review): string[] {
  return (review.images ?? []).flat().filter(Boolean)
}

/** Reviews shown before the visitor taps "See more". */
const VISIBLE_REVIEWS = 2

function ReviewItem({
  review,
  deletable,
  onDelete,
}: {
  review: Review
  deletable: boolean
  onDelete?: () => void
}) {
  const { t } = useTranslation()
  const images = reviewImages(review)
  return (
    <article className="rounded-2xl border border-line-warm bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-soft text-sm font-bold text-gold-deep">
            {reviewInitials(review.user?.name)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-semibold text-ink">{review.user?.name ?? t('Customer')}</span>
              {review.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  <BadgeCheck className="h-3 w-3" /> {t('Verified Purchase')}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-ink-soft">
              {new Date(review.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        {deletable && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('Delete review')}
            onClick={onDelete}
            className="shrink-0 text-ink-soft hover:text-claret"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <RatingStars value={review.rating} readonly size={15} />
        {review.title && <span className="text-sm font-semibold text-ink">{review.title}</span>}
      </div>

      {review.body && <p className="mt-2 text-sm leading-relaxed text-ink/80">{review.body}</p>}

      {images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((img, i) => (
            <img
              key={i}
              src={assetUrl(img)}
              alt=""
              className="h-20 w-20 rounded-lg border border-line-warm object-cover"
            />
          ))}
        </div>
      )}
    </article>
  )
}

interface ReviewSectionProps {
  productId: number
  isLive: boolean
}

export function ReviewSection({ productId, isLive }: ReviewSectionProps) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [image, setImage] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [error, setError] = useState('')
  const [showAllReviews, setShowAllReviews] = useState(false)

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: () => getProductReviews(productId),
  })

  const list = reviews ?? []
  const visibleReviews = showAllReviews ? list : list.slice(0, VISIBLE_REVIEWS)
  const total = list.length
  const average = total ? list.reduce((sum, r) => sum + r.rating, 0) / total : 0
  const distribution = [5, 4, 3, 2, 1].map((score) => ({
    score,
    count: list.filter((r) => Math.round(r.rating) === score).length,
  }))

  const submit = useMutation({
    mutationFn: () =>
      submitReview({
        product_id: productId,
        rating,
        title: title || undefined,
        body: body || undefined,
        images: images.length ? images : undefined,
      }),
    onSuccess: () => {
      setRating(0)
      setTitle('')
      setBody('')
      setImages([])
      setImage('')
      setError('')
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] })
    },
    onError: (e) => {
      const axiosError = e as { message?: string }
      setError(axiosError.message ?? 'Unable to submit review.')
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] })
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteReview(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] }),
  })

  return (
    <div className="space-y-6">
      {/* ── Rating summary card ── */}
      {total > 0 && (
        <div className="grid overflow-hidden rounded-2xl border border-line-warm bg-ivory md:grid-cols-[240px_1fr]">
          <div className="flex flex-col items-center justify-center gap-1 border-b border-line-warm p-6 text-center md:border-b-0 md:border-r">
            <p className="text-5xl font-medium text-ink">{average.toFixed(1)}</p>
            <RatingStars value={average} readonly size={18} />
            <p className="text-sm text-ink-soft">
              {total} {total === 1 ? t('review') : t('reviews')}
            </p>
          </div>
          <div className="space-y-2 p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
              {t('Rating distribution')}
            </p>
            {distribution.map(({ score, count }) => (
              <div key={score} className="flex items-center gap-3 text-xs text-ink-soft">
                <span className="w-4 text-right font-medium text-ink">{score}</span>
                <Star className="h-3.5 w-3.5 shrink-0 text-gold-mid" />
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E8E1CF]">
                  <div
                    className="h-full rounded-full bg-gold-mid transition-[width] duration-500"
                    style={{ width: `${total ? (count / total) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Review list ── */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : total > 0 ? (
        <div className="space-y-3">
          {visibleReviews.map((review) => (
            <ReviewItem
              key={review.id}
              review={review}
              deletable={user?.id === review.user?.id}
              onDelete={remove.isPending ? undefined : () => remove.mutate(review.id)}
            />
          ))}
          {total > VISIBLE_REVIEWS && (
            <div className="flex justify-center pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAllReviews((value) => !value)}
                className="rounded-md border-gold-mid/40 text-gold-deep hover:bg-gold-soft/50"
              >
                {showAllReviews ? t('Show less') : `${t('See more reviews')} (${total - VISIBLE_REVIEWS})`}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line-warm bg-ivory/50 px-6 py-12 text-center">
          <RatingStars value={0} readonly size={22} />
          <p className="mt-3 font-medium text-ink">{t('No reviews yet.')}</p>
          {isLive && !user && <p className="mt-1 text-sm text-ink-soft">{t('Be the first to review this product.')}</p>}
        </div>
      )}

      {/* ── Write a review form ── */}
      {isLive && user && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (rating === 0) {
              setError(t('Please select a star rating.'))
              return
            }
            submit.mutate()
          }}
          className="space-y-4 rounded-2xl border border-gold-mid/30 bg-ivory/70 p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-base font-semibold text-ink">{t('Write a review')}</p>
            <a
              href="/account/reviews"
              className="text-xs font-medium text-gold-deep underline underline-offset-2 hover:text-[#8a5a22]"
            >
              {t('My reviews')}
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <RatingStars value={rating} onChange={setRating} size={28} />
            {rating === 0 && <span className="text-xs text-ink-soft">{t('Tap a star to rate')}</span>}
          </div>

          <div>
            <Label htmlFor="review-title">{t('Title')}</Label>
            <Input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('Summarize your experience')}
              maxLength={255}
              className="mt-1.5 border-line-warm bg-white"
            />
          </div>

          <div>
            <Label htmlFor="review-body">{t('Description')}</Label>
            <Textarea
              id="review-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('What did you like or dislike?')}
              rows={4}
              className="mt-1.5 border-line-warm bg-white"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder={t('Paste an image URL')}
              className="border-line-warm bg-white"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (image.trim() && !images.includes(image.trim())) {
                  setImages((prev) => [...prev, image.trim()])
                  setImage('')
                }
              }}
              className="rounded-md border-gold-mid/40 text-gold-deep hover:bg-gold-soft/50"
            >
              {t('Add image')}
            </Button>
          </div>

          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  className="group relative h-16 w-16 overflow-hidden rounded-lg border border-line-warm"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label={t('Remove image')}
                >
                  <img src={assetUrl(img)} alt="" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 hidden items-center justify-center bg-black/50 text-white group-hover:flex">
                    <ImageOff className="h-4 w-4" />
                  </span>
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="flex items-center gap-1 text-sm text-claret">
              <ShieldAlert className="h-4 w-4" /> {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={submit.isPending || rating === 0}
              className="rounded-md bg-[#172926] px-8 text-white hover:bg-[#243a36]"
            >
              {submit.isPending ? t('Submitting…') : t('Submit review')}
            </Button>
          </div>
        </form>
      )}

      {/* ── Guest prompt ── */}
      {isLive && !user && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line-warm bg-ivory/60 px-5 py-4">
          <p className="text-sm text-ink-soft">{t('Have you bought this product? Share your experience.')}</p>
          <Button asChild className="rounded-md bg-[#172926] px-6 text-white hover:bg-[#243a36]">
            <a href="/login">{t('Sign in to write a review')}</a>
          </Button>
        </div>
      )}
    </div>
  )
}

export default ReviewSection