import { useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  HandCoins,
  Landmark,
  Lock,
  RefreshCw,
  Wallet as WalletIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError, EmptyState } from '@/components/common/admin'
import { useVendorWalletDashboard } from '@/hooks/useVendor'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { VendorWalletTransaction } from '@/types'
import { useTranslation } from 'react-i18next'
import { tStatus } from '@/i18n/status'

const TYPE_LABELS: Record<string, string> = {
  COMMISSION: 'Commission',
  COMMISSION_REVERSAL: 'Commission reversal',
  PAYOUT_HOLD: 'Payout hold',
  PAYOUT_RELEASE: 'Payout release',
  PAYOUT_PAID: 'Payout paid',
  ADJUSTMENT: 'Adjustment',
}

const TYPE_TONE: Record<string, { chip: string; dot: string; icon: typeof ArrowDownLeft }> = {
  COMMISSION: { chip: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400', dot: 'bg-emerald-500', icon: CircleDollarSign },
  COMMISSION_REVERSAL: { chip: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400', dot: 'bg-rose-500', icon: ArrowUpRight },
  PAYOUT_HOLD: { chip: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400', dot: 'bg-amber-500', icon: Lock },
  PAYOUT_RELEASE: { chip: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400', dot: 'bg-yellow-500', icon: Landmark },
  PAYOUT_PAID: { chip: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400', dot: 'bg-amber-500', icon: Banknote },
  ADJUSTMENT: { chip: 'bg-slate-100 text-slate-700 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400', dot: 'bg-slate-400', icon: ArrowDownLeft },
}

const CREDIT_TYPES = new Set(['COMMISSION', 'PAYOUT_RELEASE', 'ADJUSTMENT'])

function isCredit(tx: VendorWalletTransaction) {
  return CREDIT_TYPES.has(tx.type)
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
  value: string
  sub?: string
  icon: typeof Clock
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

export function VendorWalletPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useVendorWalletDashboard(page, 12)

  const wallet = data?.wallet
  const txPage = data?.transactions
  const totalPages = txPage ? Math.max(1, txPage.last_page) : 1

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-teal-600 p-6 text-white shadow-xl sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <div className="flex items-center gap-2 text-sm font-medium text-white/80">
              <span className="flex h-6 items-center gap-1.5 rounded-full bg-white/20 px-3 text-xs font-semibold backdrop-blur">
                <WalletIcon className="h-3.5 w-3.5" />
                {t('Vendor Wallet')}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{t('Wallet')}</h1>
            <p className="mt-1.5 text-sm text-white/80">
              {t('Your earnings from commissions and payouts.')}
            </p>
          </div>
          <div className="flex flex-col items-start gap-1 rounded-2xl bg-white/15 px-6 py-4 backdrop-blur">
            <span className="text-xs font-medium uppercase tracking-wider text-white/70">
              {t('Total Balance')}
            </span>
            <span className="text-3xl font-extrabold tracking-tight">
              {wallet ? formatCurrency(Number(wallet.total_balance)) : '—'}
            </span>
            <span className="text-xs text-white/70">{wallet?.currency ?? 'INR'}</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : isError || !wallet ? (
        <ApiError error={{ message: t('Could not load wallet.') }} onRetry={refetch} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t('Available')}
              value={formatCurrency(Number(wallet.available_balance))}
              sub="Ready to withdraw"
              icon={WalletIcon}
              gradient="from-emerald-400 to-teal-600"
              iconClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
            />
            <StatCard
              label={t('Pending')}
              value={formatCurrency(Number(wallet.pending_balance))}
              sub="Clearing for settlement"
              icon={Clock}
              gradient="from-amber-400 to-orange-500"
              iconClass="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
            />
            <StatCard
              label={t('Held')}
              value={formatCurrency(Number(wallet.held_balance))}
              sub="Held for returns/claims"
              icon={Lock}
              gradient="from-rose-400 to-red-500"
              iconClass="bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
            />
            <StatCard
              label={t('Paid out')}
              value={formatCurrency(Number(wallet.paid_total))}
              sub="Withdrawn to date"
              icon={HandCoins}
              gradient="from-yellow-400 to-amber-600"
              iconClass="bg-yellow-100 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-400"
            />
          </div>

          {data.pending_settlement > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
              <span>
                You have <strong>{formatCurrency(Number(data.pending_settlement))}</strong> pending
                settlement. It will clear and become available soon.
              </span>
              <Button asChild variant="outline" size="sm">
                <a href="/vendor/payouts">{t('Request payout')}</a>
              </Button>
            </div>
          ) : null}
        </>
      )}

      <Card className="overflow-hidden border-transparent bg-white/70 shadow-sm backdrop-blur dark:bg-card/70">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <WalletIcon className="h-5 w-5 text-primary" /> {t('Transaction History')}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => refetch()} title={t('Refresh')}>
            <RefreshCw className="mr-1 h-4 w-4" /> {t('Refresh')}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : txPage && txPage.data.length > 0 ? (
            <div className="divide-y divide-border/60">
              {txPage.data.map((tx) => {
                const credit = isCredit(tx)
                const tone = TYPE_TONE[tx.type] ?? TYPE_TONE.ADJUSTMENT
                return (
                  <div key={tx.id} className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.chip}`}
                      >
                        <tone.icon className="h-4.5 w-4.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {t(TYPE_LABELS[tx.type] ?? tStatus(t, tx.type))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(tx.created_at)}
                        </p>
                        {tx.description && (
                          <p className="truncate text-xs text-muted-foreground">{tx.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="text-right">
                        <p
                          className={`text-base font-extrabold tracking-tight ${
                            credit ? 'text-emerald-600' : 'text-destructive'
                          }`}
                        >
                          {credit ? '+' : '-'}
                          {formatCurrency(Math.abs(tx.amount))}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Bal {formatCurrency(tx.balance_after)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            isError ? (
              <div className="flex items-center justify-between p-6 text-sm text-destructive">
                {t('Could not load transactions.')}
                <Button size="sm" variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="mr-1 h-4 w-4" /> {t('Retry')}
                </Button>
              </div>
            ) : (
              <EmptyState message="No wallet transactions yet." />
            )
          )}
        </CardContent>
        {txPage && txPage.total > 0 ? (
          <div className="flex items-center justify-between border-t px-5 py-3 text-sm text-muted-foreground">
            <span>
              {txPage.total} transaction{txPage.total === 1 ? '' : 's'} · Page {txPage.current_page}{' '}
              of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> {t('Previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= txPage.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  )
}