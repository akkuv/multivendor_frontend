import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import {
  BadgeCheck,
  Check,
  ChevronRight,
  EyeOff,
  Flag,
  Hash,
  MessageSquareQuote,
  ShieldAlert,
  Star,
  Store,
  Trash2,
  User as UserIcon,
  UserX,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getAdminVendors,
} from '@/services/admin'
import {
  approveVendorReview,
  clearVendorReviewReport,
  deleteVendorReviewAsAdmin,
  getAdminVendorReviews,
  hideVendorReview,
  reportVendorReview,
  unhideVendorReview,
} from '@/services/vendorReview'
import type { VendorReview } from '@/types'
import { RatingStars } from '@/components/common/RatingStars'
import { ApiError, ConfirmDialog, PaginationFooter } from '@/components/common/admin'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDateTime } from '@/utils/format'
import { useTranslation } from 'react-i18next'

function ToneChip({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  )
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  gradient,
  iconClass,
}: {
  label: string
  value: number | string
  sub?: string
  icon: typeof Flag
  gradient: string
  iconClass: string
}) {
  return (
    <Card className="group relative overflow-hidden border-transparent bg-white/70 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:bg-card/70">
      <div className={`absolute inset-x-0 top-0 h-1 ${gradient}`} />
      <div className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClass} transition duration-300 group-hover:scale-110`}
          >
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-2.5 text-2xl font-extrabold tracking-tight">{value}</p>
        {sub && <p className="mt-0.5 text-xs font-medium text-muted-foreground">{sub}</p>}
      </div>
    </Card>
  )
}

const SENTIMENT: Record<number, { label: string; chip: string; bar: string }> = {
  5: { label: 'Excellent', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400', bar: 'from-emerald-400 to-teal-600' },
  4: { label: 'Great', chip: 'bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-400', bar: 'from-teal-400 to-orange-600' },
  3: { label: 'Average', chip: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400', bar: 'from-amber-400 to-orange-500' },
  2: { label: 'Poor', chip: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400', bar: 'from-orange-400 to-red-600' },
  1: { label: 'Bad', chip: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400', bar: 'from-rose-400 to-red-700' },
}

function VendorReviewCard({
  review,
  onAction,
  onDelete,
  onOpen,
}: {
  review: VendorReview
  onAction: (action: string, id: number) => void
  onDelete: (review: VendorReview) => void
  onOpen: (review: VendorReview) => void
}) {
  const { t } = useTranslation()
  return (
    <li className="relative overflow-hidden rounded-xl border border-border/60 bg-card/40 transition duration-200 hover:border-amber-200 hover:bg-card/70">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${SENTIMENT[review.rating]?.bar ?? SENTIMENT[3].bar}`} />
      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => onOpen(review)}
            className="group flex min-w-0 items-start gap-3 rounded-xl text-left transition"
            title={t('View review details')}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <RatingStars value={review.rating} readonly />
                <span className="text-sm font-semibold transition group-hover:text-amber-600">
                  {review.title || 'Untitled review'}
                </span>
                {review.is_verified && <BadgeCheck className="h-4 w-4 text-emerald-600" />}
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 opacity-0 transition group-hover:opacity-100 dark:bg-amber-500/15 dark:text-amber-400">
                  View details <ChevronRight className="h-3 w-3" />
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <UserIcon className="h-3.5 w-3.5" />
                  {review.user?.name ?? 'Customer'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Store className="h-3.5 w-3.5" />
                  {review.vendor?.store_name ?? `Vendor #${review.vendor_id}`}
                </span>
                <span>{formatDateTime(review.created_at)}</span>
              </div>
            </div>
          </button>
          <div className="flex flex-wrap items-center gap-1">
            {!review.is_approved && (
              <Button size="sm" variant="outline" onClick={() => onAction('approve', review.id)}>
                <Check className="h-3.5 w-3.5" /> {t('Approve')}
              </Button>
            )}
            {review.is_hidden ? (
              <Button size="sm" variant="outline" onClick={() => onAction('unhide', review.id)}>
                <EyeOff className="h-3.5 w-3.5" /> {t('Unhide')}
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => onAction('hide', review.id)}>
                <EyeOff className="h-3.5 w-3.5" /> {t('Hide')}
              </Button>
            )}
            {review.reported_at ? (
              <Button size="sm" variant="outline" onClick={() => onAction('unreport', review.id)}>
                <Flag className="h-3.5 w-3.5" /> {t('Clear report')}
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => onAction('report', review.id)}>
                <Flag className="h-3.5 w-3.5" /> {t('Report')}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => onDelete(review)}
            >
              <Trash2 className="h-3.5 w-3.5" /> {t('Delete')}
            </Button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <ToneChip
            label={SENTIMENT[review.rating]?.label ?? '—'}
            className={`${SENTIMENT[review.rating]?.chip ?? 'bg-slate-100 text-slate-700 ring-slate-600/20'}`}
          />
          {!review.is_approved && <ToneChip label={t('Pending')} className="bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400" />}
          {review.is_hidden && <ToneChip label={t('Hidden')} className="bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400" />}
          {review.reported_at && <ToneChip label={t('Reported')} className="bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400" />}
        </div>

        {review.report_reason && (
          <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-700 dark:bg-orange-500/10 dark:text-orange-400">
            <Flag className="h-3.5 w-3.5 shrink-0" />
            Reported: {review.report_reason}
          </p>
        )}
        {review.body && <p className="mt-2.5 text-sm leading-relaxed text-foreground/90">{review.body}</p>}
      </div>
    </li>
  )
}

function VendorReviewDetailDialog({
  review,
  onClose,
  onAction,
  onDelete,
}: {
  review: VendorReview | null
  onClose: () => void
  onAction: (action: string, id: number) => void
  onDelete: (review: VendorReview) => void
}) {
  const { t } = useTranslation()
  return (
    <Dialog open={review !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        {review && (
          <>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-orange-600 to-fuchsia-700 p-6 text-white shadow-lg">
              <div className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
              <Star className="pointer-events-none absolute -bottom-4 -right-4 h-20 w-20 rotate-12 text-white/10" />
              <div className="relative flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-xl font-extrabold backdrop-blur">
                  {review.rating}
                  <Star className="ml-0.5 h-4 w-4 fill-amber-300 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="flex flex-wrap items-center gap-2 text-white">
                    <MessageSquareQuote className="h-4 w-4 text-white/70" />
                    {review.title || 'Untitled review'}
                  </DialogTitle>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-white/80">
                    <span className="inline-flex items-center gap-1">
                      <UserIcon className="h-3.5 w-3.5" />
                      {review.user?.name ?? 'Customer'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Store className="h-3.5 w-3.5" />
                      {review.vendor?.store_name ?? `Vendor #${review.vendor_id}`}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <ToneChip label={SENTIMENT[review.rating]?.label ?? '—'} className={SENTIMENT[review.rating]?.chip ?? ''} />
                    {!review.is_approved && <ToneChip label={t('Pending')} className="bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400" />}
                    {review.is_approved && !review.is_hidden && <ToneChip label={t('Approved')} className="bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400" />}
                    {review.is_hidden && <ToneChip label={t('Hidden')} className="bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400" />}
                    {review.reported_at && <ToneChip label={t('Reported')} className="bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400" />}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border bg-muted/30 p-4">
              <RatingStars value={review.rating} readonly size={16} />
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
                {review.body || 'No review text was provided.'}
              </p>
            </div>

            <dl className="mt-4 space-y-2.5 text-sm">
              <DialogRow
                label={t('Review ID')}
                value={`#${review.id}`}
                icon={<Hash className="h-3.5 w-3.5" />}
              />
              <DialogRow label={t('Customer')} value={review.user?.name ?? '—'} icon={<UserIcon className="h-3.5 w-3.5" />} />
              <DialogRow label={t('Store')} value={review.vendor?.store_name ?? `Vendor #${review.vendor_id}`} icon={<Store className="h-3.5 w-3.5" />} />
              <DialogRow
                label={t('Verified purchase')}
                value={review.is_verified ? 'Yes' : 'No'}
                icon={<BadgeCheck className="h-3.5 w-3.5" />}
              />
              <DialogRow label={t('Submitted')} value={formatDateTime(review.created_at)} icon={<Star className="h-3.5 w-3.5" />} />
              {review.reported_at && (
                <DialogRow label={t('Reported on')} value={formatDateTime(review.reported_at)} icon={<Flag className="h-3.5 w-3.5" />} />
              )}
            </dl>

            {review.report_reason && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-orange-200/60 bg-orange-50 px-3 py-2 text-xs text-orange-700 dark:bg-orange-500/10">
                <Flag className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{review.report_reason}</span>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2">
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
                  <EyeOff className="mr-1 h-3.5 w-3.5" /> {t('Hide')}
                </Button>
              )}
              {review.reported_at ? (
                <Button size="sm" variant="outline" onClick={() => onAction('unreport', review.id)}>
                  <Flag className="mr-1 h-3.5 w-3.5" /> {t('Clear report')}
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
                onClick={() => onDelete(review)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" /> {t('Delete')}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DialogRow({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="inline-flex shrink-0 items-center gap-1.5 text-muted-foreground">
        {icon} {label}
      </dt>
      <dd className="truncate text-right font-medium">{value}</dd>
    </div>
  )
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All reviews' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'reported', label: 'Reported' },
] as const

const RATING_OPTIONS = [5, 4, 3, 2, 1]

export function AdminVendorReviewsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<string>('all')
  const [vendorId, setVendorId] = useState<string>('all')
  const [rating, setRating] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [reportId, setReportId] = useState<number | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [deleting, setDeleting] = useState<VendorReview | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const stats = useQuery({
    queryKey: ['admin-vendor-reviews-stats'],
    queryFn: () => getAdminVendorReviews({ per_page: 500 }),
  })

  const { data, isError, refetch } = useQuery({
    queryKey: ['admin-vendor-reviews', status, vendorId, rating, page],
    queryFn: () =>
      getAdminVendorReviews({
        status: status === 'all' ? undefined : (status as 'pending' | 'approved' | 'hidden' | 'reported'),
        vendor_id: vendorId === 'all' ? undefined : Number(vendorId),
        rating: rating === 'all' ? undefined : Number(rating),
        page,
        per_page: 20,
      }),
  })

  const vendors = useQuery({
    queryKey: ['admin-vendors-filter'],
    queryFn: () => getAdminVendors({ per_page: 100 }),
    enabled: true,
  })

  const all = stats.data?.data ?? []
  const statsCounts = {
    total: all.length,
    pending: all.filter((r) => !r.is_approved).length,
    hidden: all.filter((r) => r.is_hidden).length,
    reported: all.filter((r) => r.reported_at).length,
  }

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-vendor-reviews'] })
    queryClient.invalidateQueries({ queryKey: ['admin-vendor-reviews-stats'] })
  }

  const approve = useMutation({ mutationFn: approveVendorReview, onSuccess: refresh })
  const hide = useMutation({ mutationFn: hideVendorReview, onSuccess: refresh })
  const unhide = useMutation({ mutationFn: unhideVendorReview, onSuccess: refresh })
  const report = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => reportVendorReview(id, reason),
    onSuccess: () => {
      setReportId(null)
      setReportReason('')
      refresh()
    },
  })
  const unreport = useMutation({ mutationFn: clearVendorReviewReport, onSuccess: refresh })
  const remove = useMutation({
    mutationFn: deleteVendorReviewAsAdmin,
    onSuccess: () => {
      setDeleting(null)
      refresh()
    },
  })

  const handleAction = (action: string, id: number) => {
    if (action === 'approve') approve.mutate(id)
    else if (action === 'hide') hide.mutate(id)
    else if (action === 'unhide') unhide.mutate(id)
    else if (action === 'report') {
      setSelectedId(null)
      setReportId(id)
    } else if (action === 'unreport') unreport.mutate(id)
  }

  const busy =
    approve.isPending || hide.isPending || unhide.isPending || unreport.isPending || remove.isPending

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-orange-600 to-orange-600 p-6 text-white shadow-xl sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-fuchsia-400/30 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <div className="flex items-center gap-2 text-sm font-medium text-white/80">
              <span className="flex h-6 items-center gap-1.5 rounded-full bg-white/20 px-3 text-xs font-semibold backdrop-blur">
                <MessageSquareQuote className="h-3.5 w-3.5" />
                {t('Moderation')}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {t('Vendor Reviews')}
            </h1>
            <p className="mt-1.5 text-sm text-white/80">
              {t('Review, moderate and manage customer feedback across all stores.')}
            </p>
          </div>
        </div>
      </div>

      {stats.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t('Total Reviews')}
            value={statsCounts.total}
            sub="Across all stores"
            icon={MessageSquareQuote}
            gradient="from-orange-400 to-orange-600"
            iconClass="bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400"
          />
          <StatCard
            label={t('Pending Approval')}
            value={statsCounts.pending}
            sub="Awaiting review"
            icon={EyeOff}
            gradient="from-amber-400 to-orange-500"
            iconClass="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
          />
          <StatCard
            label={t('Hidden')}
            value={statsCounts.hidden}
            sub="Not visible to buyers"
            icon={UserX}
            gradient="from-rose-400 to-red-600"
            iconClass="bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
          />
          <StatCard
            label={t('Reported')}
            value={statsCounts.reported}
            sub="Flagged for review"
            icon={ShieldAlert}
            gradient="from-orange-400 to-amber-600"
            iconClass="bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400"
          />
        </div>
      )}

      <Card className="overflow-hidden border-transparent bg-white/70 shadow-sm backdrop-blur dark:bg-card/70">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold">{t('Reviews Queue')}</h2>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} title={t('Refresh')}>
            <Check className="mr-1 h-4 w-4" /> {t('Refresh')}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b px-5 py-3">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={vendorId}
            onValueChange={(v) => {
              setVendorId(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t('All stores')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All stores')}</SelectItem>
              {vendors.data?.data.map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>
                  {v.store_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={rating}
            onValueChange={(v) => {
              setRating(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder={t('Any rating')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('Any rating')}</SelectItem>
              {RATING_OPTIONS.map((r) => (
                <SelectItem key={r} value={String(r)}>
                  {r} star{r > 1 ? 's' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(status !== 'all' || vendorId !== 'all' || rating !== 'all') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setStatus('all')
                setVendorId('all')
                setRating('all')
                setPage(1)
              }}
            >
              <Trash2 className="mr-1 h-4 w-4" /> {t('Clear filters')}
            </Button>
          )}
        </div>

        <div>
          {isError && !data ? (
            <ApiError error={{ message: t('Could not load reviews.') }} onRetry={refetch} />
          ) : data && data.data.length > 0 ? (
            <ul className="space-y-3 p-5">
              {data.data.map((review) => (
                <VendorReviewCard
                  key={review.id}
                  review={review}
                  onAction={handleAction}
                  onDelete={setDeleting}
                  onOpen={(r) => setSelectedId(r.id)}
                />
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60">
                <MessageSquareQuote className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium">
                {status !== 'all' || vendorId !== 'all' || rating !== 'all'
                  ? 'No matching reviews'
                  : 'No reviews yet'}
              </p>
              <p className="text-sm text-muted-foreground">
                {status !== 'all' || vendorId !== 'all' || rating !== 'all'
                  ? 'Try adjusting your filters.'
                  : 'Customer reviews will appear here.'}
              </p>
            </div>
          )}
        </div>

        {data && data.total > 0 && (
          <div className="border-t px-5 py-3">
            <PaginationFooter
              data={data}
              onPageChange={(p) => {
                setPage(p)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          </div>
        )}
      </Card>

      <Dialog open={reportId !== null} onOpenChange={(open) => !open && setReportId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Report vendor review')}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder={t('Reason for reporting (e.g. spam, abusive)')}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportId(null)} disabled={report.isPending}>
              {t('Cancel')}
            </Button>
            <Button
              disabled={!reportReason || report.isPending}
              onClick={() => reportId !== null && report.mutate({ id: reportId, reason: reportReason })}
            >
              <Flag className="mr-1 h-4 w-4" /> {t('Report')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t('Delete vendor review')}
        description={
          deleting
            ? `Delete the review titled "${deleting.title || 'Untitled review'}"? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        loading={remove.isPending || busy}
        error={remove.error?.message ?? null}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />

      <VendorReviewDetailDialog
        review={data?.data.find((r) => r.id === selectedId) ?? null}
        onClose={() => setSelectedId(null)}
        onAction={handleAction}
        onDelete={(r) => {
          setSelectedId(null)
          setDeleting(r)
        }}
      />
    </div>
  )
}
