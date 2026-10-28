import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { BadgeCheck } from 'lucide-react'
import { deleteVendorReview, getVendorReviews, submitVendorReview } from '@/services/vendorReview'
import type { VendorReview } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RatingStars } from '@/components/common/RatingStars'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from 'react-i18next'

function VendorReviewItem({
  review,
  deletable,
  onDelete,
}: {
  review: VendorReview
  deletable: boolean
  onDelete?: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <RatingStars value={review.rating} readonly />
          <span className="text-sm font-semibold">{review.title || 'Untitled review'}</span>
        </div>
        {deletable && onDelete && (
          <Button variant="ghost" size="sm" onClick={onDelete}>
            {t('Delete')}
          </Button>
        )}
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{review.user?.name}</span>
        {review.is_verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
            <BadgeCheck className="h-3 w-3" /> {t('Verified Customer')}
          </span>
        )}
        <span>{new Date(review.created_at).toLocaleDateString()}</span>
      </div>
      {review.body && <p className="mt-2 text-sm leading-relaxed">{review.body}</p>}
    </div>
  )
}

interface VendorReviewSectionProps {
  vendorId: number
}

export function VendorReviewSection({ vendorId }: VendorReviewSectionProps) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['vendor-reviews', vendorId],
    queryFn: () => getVendorReviews(vendorId),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['vendor-reviews', vendorId] })

  const submit = useMutation({
    mutationFn: () => submitVendorReview({ vendor_id: vendorId, rating, title, body }),
    onSuccess: () => {
      setRating(0)
      setTitle('')
      setBody('')
      refresh()
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteVendorReview(id),
    onSuccess: refresh,
  })

  const reviewsList = reviews ?? []
  const myReview = user ? reviewsList.find((r) => r.user?.id === user.id) : null
  const others = myReview ? reviewsList.filter((r) => r.id !== myReview.id) : reviewsList

  return (
    <div className="space-y-6">
      {user && (
        <Card>
          <CardContent className="space-y-4 pt-5">
            <h3 className="font-semibold">{t('Review this vendor')}</h3>
            <div className="flex items-center gap-2">
              <RatingStars value={myReview?.rating ?? rating} onChange={myReview ? undefined : setRating} />
            </div>
            {!myReview && rating === 0 && (
              <p className="text-xs text-muted-foreground">{t('Select a rating to continue.')}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="vendor-review-title">{t('Title')}</Label>
              <Input
                id="vendor-review-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('How was your experience?')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-review-body">{t('Review')}</Label>
              <Textarea
                id="vendor-review-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t('Share details about shipping, product quality and service.')}
                rows={4}
              />
            </div>
            <Button
              onClick={() => submit.mutate()}
              disabled={!rating || submit.isPending || !!myReview}
            >
              {isLoading ? '' : myReview ? 'Already reviewed' : 'Submit review'}
            </Button>
            {submit.isError && (
              <p className="text-sm text-claret">{submit.error?.message}</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h3 className="font-semibold">
          Vendor Reviews <Badge variant="secondary">{reviewsList.length}</Badge>
        </h3>
        {isLoading && <p className="text-sm text-muted-foreground">{t('Loading reviews…')}</p>}
        {!isLoading && reviewsList.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('No reviews yet.')}</p>
        )}
        {myReview && (
          <VendorReviewItem
            review={myReview}
            deletable
            onDelete={() => remove.mutate(myReview.id)}
          />
        )}
        {others.map((review) => (
          <VendorReviewItem key={review.id} review={review} deletable={false} />
        ))}
      </div>
    </div>
  )
}