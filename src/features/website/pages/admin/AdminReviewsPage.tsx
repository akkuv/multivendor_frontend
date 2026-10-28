import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  BadgeCheck,
  Ban,
  CalendarDays,
  Check,
  ChevronRight,
  EyeOff,
  Flag,
  Inbox,
  MessageSquareQuote,
  Quote,
  ShieldCheck,
  ShieldAlert,
  ShoppingBag,
  Star,
  Trash2,
  User as UserIcon,
  ImageOff,
} from 'lucide-react'
import {
  approveReview,
  clearReport,
  deleteReviewAsAdmin,
  getAdminReviews,
  getAdminReviewStats,
  hideReview,
  moderateReviewImages,
  reportReview,
  unhideReview,
} from '@/services/review'
import { useAdminUser } from '@/hooks/useAdmin'
import type { Review, ReviewStats, ReviewUser } from '@/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RatingStars } from '@/components/common/RatingStars'
import { ApiError, ConfirmDialog, PaginationFooter } from '@/components/common/admin'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { assetUrl } from '@/lib/assets'
import { formatDateTime, formatCurrency } from '@/utils/format'
import { useTranslation } from 'react-i18next'

type StatusFilter = 'all' | 'pending' | 'approved' | 'hidden' | 'reported'

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'reported', label: 'Reported' },
]

const RATING_OPTIONS = [5, 4, 3, 2, 1]

const SENTIMENT: Record<number, { label: string; chip: string; bar: string }> = {
  5: { label: 'Excellent', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400', bar: 'from-emerald-400 to-teal-600' },
  4: { label: 'Great', chip: 'bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-400', bar: 'from-teal-400 to-orange-600' },
  3: { label: 'Average', chip: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400', bar: 'from-amber-400 to-orange-500' },
  2: { label: 'Poor', chip: 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400', bar: 'from-orange-400 to-red-600' },
  1: { label: 'Bad', chip: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400', bar: 'from-rose-400 to-red-700' },
}

const BARS: Record<number, string> = {
  5: 'bg-emerald-500',
  4: 'bg-teal-500',
  3: 'bg-amber-500',
  2: 'bg-orange-500',
  1: 'bg-rose-500',
}

function RatingBreakdown({ stats }: { stats?: ReviewStats }) {
  if (!stats || stats.total === 0) return null

  const rows = [5, 4, 3, 2, 1].map((n) => {
    const count = stats.rating_distribution?.[n] ?? 0
    return {
      star: n,
      count,
      pct: stats.total > 0 ? Math.round((count / stats.total) * 100) : 0,
    }
  })

  return (
    <Card className="overflow-hidden border-transparent bg-white/70 shadow-sm backdrop-blur dark:bg-card/70">
      <div className="grid items-center gap-6 p-6 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-2 text-center sm:border-r sm:pr-8 sm:dark:border-white/10">
          <p className="bg-gradient-to-br from-amber-400 to-orange-600 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent">
            {stats.average_rating.toFixed(1)}
          </p>
          <RatingStars value={stats.average_rating} readonly size={18} />
          <p className="text-xs text-muted-foreground">
            Based on {stats.total} review{stats.total === 1 ? '' : 's'}
          </p>
        </div>
        <div className="space-y-2.5">
          {rows.map((row) => (
            <div key={row.star} className="flex items-center gap-3 text-sm">
              <span className="flex w-11 shrink-0 items-center justify-end gap-1 font-semibold">
                {row.star}<Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted/70">
                <div
                  className={`h-full rounded-full ${BARS[row.star]} transition-all duration-500`}
                  style={{ width: `${row.pct}%` }}
                />
              </div>
              <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
                {row.count} ({row.pct}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string
  value: string | number
  sub?: string
  icon: typeof Star
  tone: { bar: string; icon: string }
}) {
  return (
    <Card className="group relative overflow-hidden border-transparent bg-white/70 p-4 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:bg-card/70">
      <div className={`absolute inset-x-0 top-0 h-1 ${tone.bar}`} />
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone.icon} transition duration-300 group-hover:scale-110`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2.5 text-2xl font-extrabold tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-xs font-medium text-muted-foreground">{sub}</p>}
    </Card>
  )
}

function ReviewImageGrid({
  images,
  onRemove,
}: {
  images: string[]
  onRemove?: (image: string) => void
}) {
  const { t } = useTranslation()
  if (images.length === 0) return null
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {images.map((img, i) => (
        <div key={i} className="group relative h-16 w-16 overflow-hidden rounded-lg border">
          <img src={assetUrl(img)} alt="" className="h-full w-full object-cover" />
          {onRemove && (
            <button
              type="button"
              aria-label={t('Remove image')}
              className="absolute inset-0 hidden items-center justify-center rounded-lg bg-black/55 text-white group-hover:flex"
              onClick={() => onRemove(img)}
            >
              <ImageOff className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

function ReviewCard({
  review,
  onAction,
  onOpenCustomer,
}: {
  review: Review
  onAction: (action: string, id: number, image?: string) => void
  onOpenCustomer: (user: ReviewUser) => void
}) {
  const { t } = useTranslation()
  const initials = (review.user?.name ?? 'A')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <Card className="relative overflow-hidden border-transparent bg-white/70 p-5 shadow-sm backdrop-blur transition duration-300 hover:shadow-md dark:bg-card/70">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${SENTIMENT[review.rating]?.bar ?? SENTIMENT[3].bar}`} />
      {review.rating >= 4 && (
        <Star className="pointer-events-none absolute -bottom-5 -right-5 h-24 w-24 rotate-12 text-emerald-500/[0.07] dark:text-emerald-400/[0.06]" />
      )}
      <div className="flex items-start justify-between gap-4">
        {review.user ? (
          <button
            type="button"
            onClick={() => onOpenCustomer(review.user!)}
            className="group flex min-w-0 items-start gap-3 rounded-xl text-left transition "
            title={t('View customer profile')}
          >
            <Avatar className="h-10 w-10 shrink-0 ring-2 ring-amber-100 transition group-hover:ring-amber-300 dark:ring-amber-500/20">
              {review.user.avatar && <AvatarImage src={review.user.avatar} alt={review.user.name} />}
              <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold transition group-hover:text-amber-600">
                  {review.user.name}
                </span>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 opacity-0 transition group-hover:opacity-100 dark:bg-amber-500/15 dark:text-amber-400">
                  View profile <ChevronRight className="h-3 w-3" />
                </span>
                {review.is_verified && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-600">
                    <BadgeCheck className="h-3.5 w-3.5" /> {t('Verified purchase')}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <RatingStars value={review.rating} readonly size={14} />
                <span className="text-xs text-muted-foreground">{formatDateTime(review.created_at)}</span>
              </div>
            </div>
          </button>
        ) : (
          <div className="flex min-w-0 items-start gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{t('Anonymous')}</span>
                {review.is_verified && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-600">
                    <BadgeCheck className="h-3.5 w-3.5" /> {t('Verified purchase')}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <RatingStars value={review.rating} readonly size={14} />
                <span className="text-xs text-muted-foreground">{formatDateTime(review.created_at)}</span>
              </div>
            </div>
          </div>
        )}
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${SENTIMENT[review.rating]?.chip ?? SENTIMENT[3].chip}`}>
            {SENTIMENT[review.rating]?.label ?? '—'}
          </span>
          {!review.is_approved && (
            <Badge variant="warning" className="bg-amber-100 text-amber-700">
              {t('Pending')}
            </Badge>
          )}
          {review.is_approved && !review.is_hidden && (
            <Badge variant="success">{t('Approved')}</Badge>
          )}
          {review.is_hidden && (
            <Badge variant="secondary">{t('Hidden')}</Badge>
          )}
          {review.reported_at && (
            <Badge variant="destructive" className="bg-rose-100 text-rose-700">
              <Flag className="h-3 w-3" /> {t('Reported')}
            </Badge>
          )}
        </div>
      </div>

      {review.title && (
        <h3 className="mt-3 text-sm font-bold leading-snug">
          <Quote className="mr-1 inline h-3.5 w-3.5 -translate-y-0.5 text-muted-foreground/50" />
          {review.title}
        </h3>
      )}
      {review.body && (
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{review.body}</p>
      )}

      {review.product && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
          {review.product.images?.[0] && (
            <img
              src={assetUrl(review.product.images[0])}
              alt=""
              className="h-8 w-8 shrink-0 rounded-md object-cover"
            />
          )}
          <span className="truncate text-xs font-medium">{review.product.name}</span>
          {review.vendor?.store_name && (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {review.vendor.store_name}
            </span>
          )}
          <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
            Product #{review.product.id}
          </span>
        </div>
      )}

      <ReviewImageGrid images={review.images ?? []} onRemove={(img) => onAction('remove-image', review.id, img)} />

      {review.report_reason && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200/60 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-500/10">
          <Flag className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{review.report_reason}</span>
        </div>
      )}

      <Separator className="my-4" />

      <div className="flex flex-wrap items-center gap-2">
        {!review.is_approved && (
          <Button size="sm" onClick={() => onAction('approve', review.id)}>
            <Check className="mr-1 h-3.5 w-3.5" /> {t('Approve')}
          </Button>
        )}
        {review.is_hidden ? (
          <Button size="sm" variant="outline" onClick={() => onAction('unhide', review.id)}>
            <EyeOff className="mr-1 h-3.5 w-3.5" /> {t('Unhide')}
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => onAction('hide', review.id)}>
            <Ban className="mr-1 h-3.5 w-3.5" /> {t('Hide')}
          </Button>
        )}
        {review.reported_at ? (
          <Button size="sm" variant="outline" onClick={() => onAction('unreport', review.id)}>
            <ShieldCheck className="mr-1 h-3.5 w-3.5" /> {t('Clear report')}
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => onAction('report', review.id)}>
            <Flag className="mr-1 h-3.5 w-3.5" /> {t('Report')}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onAction('delete', review.id)}
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" /> {t('Delete')}
        </Button>
      </div>
    </Card>
  )
}

function CustomerDialog({
  user,
  onClose,
}: {
  user: ReviewUser | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { data: detail, isLoading, isError, refetch } = useAdminUser(user?.id ?? null)

  return (
    <Dialog open={user !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        {isLoading || !detail ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-12 w-2/3 rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : isError ? (
          <ApiError error={{ message: t('Could not load customer.') }} onRetry={refetch} />
        ) : (
          <>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-orange-600 to-fuchsia-700 p-6 text-white shadow-lg">
              <div className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
              <div className="relative flex items-center gap-4">
                <Avatar className="h-16 w-16 shrink-0 ring-4 ring-white/25">
                  {detail.user.avatar && (
                    <AvatarImage src={detail.user.avatar} alt={detail.user.name} />
                  )}
                  <AvatarFallback className="bg-white/20 text-lg font-bold text-white">
                    {(detail.user.name?.split(' ').map((p) => p[0]).slice(0, 2).join('') || '?').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <DialogTitle className="flex flex-wrap items-center gap-2 text-white">
                    <UserIcon className="h-4 w-4 text-white/70" /> {detail.user.name}
                  </DialogTitle>
                  <p className="mt-0.5 truncate text-sm text-white/80">{detail.user.email}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-white/75">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Joined {formatDateTime(detail.user.created_at)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BadgeCheck className="h-3.5 w-3.5 text-emerald-300" />
                      {detail.user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <CustomerStat
                icon={ShoppingBag}
                label={t('Orders')}
                value={detail.order_count}
                tone="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
              />
              <CustomerStat
                icon={ShieldCheck}
                label={t('Total Spent')}
                value={formatCurrency(detail.total_spent)}
                tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
              />
              <CustomerStat
                icon={MessageSquareQuote}
                label={t('Reviews')}
                value={detail.reviews_count}
                tone="bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400"
              />
              <CustomerStat
                icon={Star}
                label={t('Avg Rating')}
                value={
                  detail.reviews_count > 0
                    ? `${detail.reviews_average_rating.toFixed?.(1) ?? detail.reviews_average_rating}★`
                    : '—'
                }
                tone="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
              />
            </div>

            <div className="mt-4">
              <h4 className="mb-1 text-sm font-semibold">{t('Recent reviews')}</h4>
              {detail.reviews.length > 0 ? (
                <ul className="divide-y divide-border/60 rounded-xl border">
                  {detail.reviews.map((r) => (
                    <li key={r.id} className="flex items-start gap-3 p-3">
                      <div className="mt-1 shrink-0">{r.product?.images?.[0] && (
                        <img src={assetUrl(r.product.images[0])} alt="" className="h-10 w-10 rounded-md object-cover" />
                      )}</div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <RatingStars value={r.rating} readonly size={13} />
                          <span className="text-xs font-medium text-muted-foreground">
                            {r.product?.name ?? `Product #${r.product_id}`}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-sm font-medium">{r.title ?? 'Untitled review'}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{r.body}</p>
                      </div>
                      {!r.is_approved && (
                        <Badge variant="warning" className="ml-auto shrink-0 bg-amber-100 text-amber-700">{t('Pending')}</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl border p-4 text-center text-sm text-muted-foreground">
                  This customer hasn&apos;t written any reviews yet.
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function CustomerStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Star
  label: string
  value: string | number
  tone: string
}) {
  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-2 text-lg font-extrabold tracking-tight">{value}</p>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  )
}

export function AdminReviewsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<StatusFilter>('all')
  const [rating, setRating] = useState('')
  const [page, setPage] = useState(1)
  const [reportId, setReportId] = useState<number | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [customer, setCustomer] = useState<ReviewUser | null>(null)

  const { data: stats } = useQuery({
    queryKey: ['admin-review-stats'],
    queryFn: getAdminReviewStats,
  })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-reviews', status, rating, page],
    queryFn: () =>
      getAdminReviews({
        status: status === 'all' ? undefined : status,
        rating: rating && rating !== 'all' ? Number(rating) : undefined,
        per_page: 10,
        page,
      }),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })

  const flash = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(null), 3000)
  }

  const approve = useMutation({
    mutationFn: approveReview,
    onSuccess: () => { refresh(); flash('Review approved and published.') },
  })
  const hide = useMutation({
    mutationFn: hideReview,
    onSuccess: () => { refresh(); flash('Review hidden from public view.') },
  })
  const unhide = useMutation({
    mutationFn: unhideReview,
    onSuccess: () => { refresh(); flash('Review is visible again.') },
  })
  const report = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => reportReview(id, reason),
    onSuccess: () => { refresh(); flash('Review reported.') },
  })
  const unreport = useMutation({
    mutationFn: clearReport,
    onSuccess: () => { refresh(); flash('Report cleared.') },
  })
  const remove = useMutation({
    mutationFn: deleteReviewAsAdmin,
    onSuccess: () => { refresh(); flash('Review deleted.') },
  })
  const moderateImages = useMutation({
    mutationFn: ({ id, images }: { id: number; images: string[] }) => moderateReviewImages(id, images),
    onSuccess: () => { refresh(); flash('Review image removed.') },
  })

  const handleAction = (action: string, id: number, image?: string) => {
    if (action === 'approve') approve.mutate(id)
    else if (action === 'hide') hide.mutate(id)
    else if (action === 'unhide') unhide.mutate(id)
    else if (action === 'report') {
      setReportReason('')
      setReportId(id)
    } else if (action === 'unreport') unreport.mutate(id)
    else if (action === 'delete') setDeleteId(id)
    else if (action === 'remove-image') {
      const review = data?.data.find((r) => r.id === id)
      if (review) {
        moderateImages.mutate({ id, images: (review.images ?? []).filter((img) => img !== image) })
      }
    }
  }

  const changeView = (next?: StatusFilter | string, ratingNext?: string) => {
    if (next) setStatus(next as StatusFilter)
    if (typeof ratingNext === 'string') setRating(ratingNext)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-700 p-6 text-white shadow-xl sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-yellow-400/30 blur-2xl" />
        <MessageSquareQuote className="pointer-events-none absolute -bottom-8 right-8 h-40 w-40 text-white/10" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <div className="flex items-center gap-2 text-sm font-medium text-white/80">
              <span className="flex h-6 items-center gap-1.5 rounded-full bg-white/20 px-3 text-xs font-semibold backdrop-blur">
                <ShieldCheck className="h-3.5 w-3.5" /> {t('Moderation Center')}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{t('Customer Reviews')}</h1>
            <p className="mt-1.5 text-sm text-white/80">
              {t('Approve, moderate, and manage customer feedback across every store.')}
            </p>
          </div>
          <div className="flex flex-col items-start gap-1 rounded-2xl bg-white/15 px-6 py-4 backdrop-blur">
            <span className="text-xs font-medium uppercase tracking-wider text-white/70">
              {t('Average Rating')}
            </span>
            <span className="text-3xl font-extrabold tracking-tight">
              {stats ? stats.average_rating.toFixed(1) : '—'}
            </span>
            <RatingStars value={stats?.average_rating ?? 0} readonly size={15} />
          </div>
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200/60 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10">
          <ShieldCheck className="h-4 w-4 shrink-0" /> {notice}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label={t('Total Reviews')}
          value={stats?.total ?? '—'}
          icon={MessageSquareQuote}
          tone={{ bar: 'from-orange-400 to-amber-600', icon: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400' }}
        />
        <StatCard
          label={t('Approved')}
          value={stats?.approved ?? '—'}
          sub="Live on storefronts"
          icon={ShieldCheck}
          tone={{ bar: 'from-emerald-400 to-teal-600', icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' }}
        />
        <StatCard
          label={t('Pending')}
          value={stats?.pending ?? '—'}
          sub="Awaiting review"
          icon={Star}
          tone={{ bar: 'from-amber-400 to-orange-500', icon: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400' }}
        />
        <StatCard
          label={t('Hidden')}
          value={stats?.hidden ?? '—'}
          sub="Not on storefront"
          icon={EyeOff}
          tone={{ bar: 'from-slate-400 to-slate-600', icon: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400' }}
        />
        <StatCard
          label={t('Reported')}
          value={stats?.reported ?? '—'}
          sub="Needs attention"
          icon={ShieldAlert}
          tone={{ bar: 'from-rose-400 to-red-600', icon: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400' }}
        />
      </div>

      <RatingBreakdown stats={stats} />

      <Card className="overflow-hidden border-transparent bg-white/70 shadow-sm backdrop-blur dark:bg-card/70">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => changeView(tab.value)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                  status === tab.value
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
              >
                {t(tab.label)}
              </button>
            ))}
          </div>
          <Select value={rating} onValueChange={(v) => changeView(undefined, v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('Any rating')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('Any rating')}</SelectItem>
              {RATING_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} star{n > 1 ? 's' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-4 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <ApiError error={{ message: t('Could not load reviews.') }} onRetry={refetch} />
        ) : data && data.data.length > 0 ? (
          <>
            <div className="space-y-4 p-5">
              {data.data.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onAction={handleAction}
                  onOpenCustomer={setCustomer}
                />
              ))}
            </div>
            <div className="flex items-center gap-3 px-5 py-3">
              <p className="text-xs text-muted-foreground">
                {data.total} review{data.total === 1 ? '' : 's'} · Page {data.current_page} of{' '}
                {data.last_page}
              </p>
              <div className="ml-auto">
                <PaginationFooter data={data} onPageChange={setPage} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium">{t('No reviews found')}</p>
            <p className="text-sm text-muted-foreground">
              {t('There are no reviews matching this filter yet.')}
            </p>
          </div>
        )}
      </Card>

      <Dialog open={reportId !== null} onOpenChange={(open) => !open && setReportId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-rose-600" /> {t('Report review')}
            </DialogTitle>
            <DialogDescription>
              {t('Provide a reason for flagging this review to the moderation team.')}
            </DialogDescription>
          </DialogHeader>
          <textarea
            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            placeholder={t('e.g. Spam, offensive language, fake review…')}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportId(null)}>
              {t('Cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (reportId !== null) report.mutate({ id: reportId, reason: reportReason || 'Reported by moderation team.' })
                setReportId(null)
              }}
            >
              {t('Report review')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t('Delete this review?')}
        description={t('This will permanently remove the review from the platform. This action cannot be undone.')}
        confirmLabel="Delete review"
        loading={remove.isPending}
        error={remove.error?.message ?? null}
        onConfirm={() => {
          if (deleteId !== null) remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })
        }}
      />

      <CustomerDialog user={customer} onClose={() => setCustomer(null)} />
    </div>
  )
}