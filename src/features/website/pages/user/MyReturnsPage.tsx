import { useState } from 'react'
import { assetUrl } from '@/lib/assets'
import { Link } from 'react-router-dom'
import {
  Camera,
  Check,
  ChevronRight,
  PackageX,
  RotateCcw,
  Undo2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyReturns, useWithdrawReturn } from '@/hooks/useReturns'
import { AccountSubPageHeader } from '@/components/common/AccountSubPageHeader'
import type { MyReturn, MyReturnStatusValue } from '@/types'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { useTranslation } from 'react-i18next'
import { tStatus } from '@/i18n/status'

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'> = {
  REQUESTED: 'warning',
  APPROVED: 'secondary',
  REJECTED: 'destructive',
  PICKUP_SCHEDULED: 'secondary',
  PICKED_UP: 'secondary',
  RECEIVED: 'secondary',
  INSPECTING: 'secondary',
  APPROVED_FOR_REFUND: 'warning',
  REFUNDED: 'success',
  CLOSED: 'outline',
}

const WITHDRAWABLE: MyReturnStatusValue[] = [
  'REQUESTED',
  'APPROVED',
  'PICKUP_SCHEDULED',
  'PICKED_UP',
  'RECEIVED',
  'INSPECTING',
  'APPROVED_FOR_REFUND',
]

function canWithdraw(status: MyReturnStatusValue): boolean {
  return WITHDRAWABLE.includes(status)
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function Timeline({ item }: { item: MyReturn }) {
  const { t } = useTranslation()
  const steps: { label: string; at: string | null }[] = [
    { label: t('Requested'), at: item.created_at },
    { label: t('Confirmed by seller'), at: item.status === 'APPROVED' ? item.updated_at : null },
    { label: t('Pickup scheduled'), at: item.pickup_scheduled_at },
    { label: t('Picked up'), at: item.picked_up_at },
    { label: t('Received at warehouse'), at: item.received_at },
    { label: t('Inspecting'), at: item.inspecting_at },
    {
      label: item.status === 'REJECTED' ? 'Return rejected' : 'Approved for refund',
      at: item.approved_for_refund_at,
    },
    { label: item.status === 'REJECTED' ? 'Closed' : 'Refunded', at: item.refunded_at ?? item.closed_at },
  ]

  return (
    <ol className="relative ml-2 space-y-0 border-l-2 border-border/60 pl-6">
      {steps.map((step, i) => {
        const done = !!step.at
        return (
          <li key={i} className="relative py-2.5">
            <div
              className={`absolute -left-[25px] top-2.5 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                done
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground'
              }`}
            >
              {done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
            </div>
            <div className={done ? '' : 'text-muted-foreground'}>
              <p className="text-sm font-medium">{step.label}</p>
              {done && <p className="text-xs text-muted-foreground">{formatDateTime(step.at)}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function MyReturnsPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useMyReturns()
  const withdraw = useWithdrawReturn()
  const [withdrawing, setWithdrawing] = useState<MyReturn | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  const message =
    withdrawing && withdraw.error && 'message' in withdraw.error
      ? String((withdraw.error as { message: unknown }).message)
      : null

  const returns = data ?? []
  const inProgressCount = returns.filter(
    (r) => !['REFUNDED', 'REJECTED', 'CLOSED'].includes(r.status),
  ).length
  const refundedCount = returns.filter((r) => r.status === 'REFUNDED').length
  const rejectedCount = returns.filter((r) => r.status === 'REJECTED').length

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <AccountSubPageHeader
        icon={RotateCcw}
        title={t('My Returns')}
        subtitle={t('Track the status of your return and refund requests.')}
        actions={
          returns.length > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {returns.length} return{returns.length > 1 ? 's' : ''}
            </span>
          ) : undefined
        }
      />

      {returns.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label={t('Total returns')} value={returns.length} />
          <StatCard label={t('In progress')} value={inProgressCount} />
          <StatCard label={t('Refunded')} value={refundedCount} />
          <StatCard label={t('Rejected')} value={rejectedCount} />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : !data || returns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <PackageX className="h-8 w-8" />
            </div>
            <p className="font-display text-xl font-bold">{t('No returns yet')}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {t('You can request a return from a delivered order\'s details page.')}
            </p>
            <Button asChild className="mt-5">
              <Link to="/account">{t('View my orders')}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {returns.map((r) => (
            <Card key={r.id} className="overflow-hidden transition-all hover:shadow-md">
              <div className="p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  {r.order_item?.product_image ? (
                    <img
                      src={assetUrl(r.order_item.product_image)}
                      alt={r.order_item.product_name}
                      className="h-16 w-16 shrink-0 rounded-lg border object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                      <PackageX className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {r.order_item?.product_name ?? 'Item'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Order {r.order?.order_number ?? r.order_id} · Return #{r.id}
                        </p>
                      </div>
                      <Badge variant={STATUS_BADGE[r.status] ?? 'secondary'}>
                        {tStatus(t, r.status)}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-sm">
                      <span className="text-muted-foreground">{t('Qty:')} </span>
                      {r.quantity} × {formatCurrency(r.order_item?.unit_price ?? 0)}
                    </p>
                  </div>
                </div>

                <Separator className="my-3" />

                <p className="text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Reason:{' '}
                  </span>
                  <span className="font-medium">{r.reason ?? '—'}</span>
                </p>
                {r.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {r.description}
                  </p>
                ) : null}

                {r.images && r.images.length > 0 ? (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Camera className="h-3.5 w-3.5" />
                    {r.images.length} photo{r.images.length > 1 ? 's' : ''} attached
                  </div>
                ) : null}

                {r.status_notes ? (
                  <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    {r.status_notes}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Requested {formatDateTime(r.created_at)}</span>
                  {canWithdraw(r.status) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setWithdrawing(r)}
                      disabled={withdraw.isPending}
                    >
                      <Undo2 className="mr-1 h-3.5 w-3.5" /> {t('Withdraw request')}
                    </Button>
                  ) : null}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                className="flex w-full items-center justify-between border-t bg-muted/30 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50"
              >
                <span>{expanded === r.id ? 'Hide timeline' : 'View status timeline'}</span>
                <ChevronRight
                  className={`h-3.5 w-3.5 transition-transform ${
                    expanded === r.id ? 'rotate-90' : ''
                  }`}
                />
              </button>
              {expanded === r.id ? (
                <div className="border-t p-4 sm:p-5">
                  <Timeline item={r} />
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={withdrawing != null}
        onOpenChange={(open) => !open && setWithdrawing(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Withdraw return request?')}</DialogTitle>
            <DialogDescription>
              This will cancel your return for{' '}
              {withdrawing?.order_item?.product_name ?? 'this item'}. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {message ? <p className="text-sm text-destructive">{message}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawing(null)} disabled={withdraw.isPending}>
              {t('Keep request')}
            </Button>
            <Button
              variant="destructive"
              disabled={withdraw.isPending}
              onClick={() =>
                withdrawing &&
                withdraw.mutate(withdrawing.id, { onSuccess: () => setWithdrawing(null) })
              }
            >
              {withdraw.isPending ? 'Withdrawing…' : 'Withdraw'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}