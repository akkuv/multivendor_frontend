import { useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Landmark,
  RefreshCw,
  Search,
  Wallet as WalletIcon,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ApiError } from '@/components/common/admin'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useAdminWallet,
  useAdminWalletTransaction,
  useAdminWalletTransactions,
} from '@/hooks/useAdmin'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { WalletTransaction, WalletTransactionTypeValue } from '@/types'
import { useTranslation } from 'react-i18next'

const TYPE_TONE: Record<
  WalletTransactionTypeValue,
  { chip: string; dot: string; icon: typeof ArrowDownLeft }
> = {
  RECHARGE: { chip: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400', dot: 'bg-amber-500', icon: CircleDollarSign },
  ORDER_PAYMENT: { chip: 'bg-slate-100 text-slate-700 ring-slate-600/20', dot: 'bg-slate-400', icon: Banknote },
  CREDIT: { chip: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400', dot: 'bg-emerald-500', icon: ArrowDownLeft },
  DEBIT: { chip: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400', dot: 'bg-rose-500', icon: ArrowUpRight },
  REFUND: { chip: 'bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-400', dot: 'bg-teal-500', icon: ArrowDownLeft },
  ADJUSTMENT: { chip: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400', dot: 'bg-amber-500', icon: X },
  COMMISSION: { chip: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400', dot: 'bg-orange-500', icon: CircleDollarSign },
  WITHDRAWAL: { chip: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400', dot: 'bg-orange-500', icon: ArrowUpRight },
  ORDER_PAYOUT: { chip: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400', dot: 'bg-yellow-500', icon: Landmark },
}

const TYPE_LABEL_KEYS: Record<WalletTransactionTypeValue, string> = {
  RECHARGE: 'Wallet Recharge',
  ORDER_PAYMENT: 'Order Payment',
  CREDIT: 'Credit',
  DEBIT: 'Debit',
  REFUND: 'Refund',
  ADJUSTMENT: 'Adjustment',
  COMMISSION: 'Commission',
  WITHDRAWAL: 'Withdrawal',
  ORDER_PAYOUT: 'Payout',
}

const ALL_TYPES = Object.keys(TYPE_LABEL_KEYS) as WalletTransactionTypeValue[]

function isCreditTransaction(tx: WalletTransaction): boolean {
  return ['RECHARGE', 'REFUND', 'CREDIT', 'ADJUSTMENT', 'COMMISSION', 'ORDER_PAYOUT'].includes(
    tx.type,
  )
}

function StatusChip({ status }: { status: string }) {
  if (status === 'COMPLETED') return null
  const tone =
    status === 'PENDING'
      ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400'
      : 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ring-inset ${tone}`}
    >
      {status}
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

function TransactionDetailDialog({
  transactionId,
  onClose,
}: {
  transactionId: number | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { data: tx, isLoading, isError, refetch } = useAdminWalletTransaction(transactionId)

  return (
    <Dialog open={transactionId != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        {isLoading || !tx ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : isError ? (
          <div className="flex items-center justify-between p-4 text-sm text-destructive">
            {t('Could not load transaction details.')}
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-1 h-4 w-4" /> {t('Retry')}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                {t(TYPE_LABEL_KEYS[tx.type] ?? tx.type)}
                <StatusChip status={tx.status} />
              </DialogTitle>
              <DialogDescription>
                {tx.description || t('Admin wallet transaction')}
              </DialogDescription>
            </DialogHeader>

            <Separator />

            <div className="rounded-2xl border bg-muted/30 px-5 py-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('Amount')}
              </p>
              <p
                className={`mt-1 text-3xl font-extrabold tracking-tight ${
                  isCreditTransaction(tx) ? 'text-emerald-600' : 'text-destructive'
                }`}
              >
                {isCreditTransaction(tx) ? '+' : '-'}
                {formatCurrency(Math.abs(tx.amount))}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {tx.wallet.currency} · {t('Balance after')}: {formatCurrency(tx.balance_after)}
              </p>
            </div>

            <dl className="space-y-2.5 text-sm">
              <DetailRow label={t('Transaction ID')} value={`#${tx.id}`} />
              <DetailRow label={t('Type')} value={t(TYPE_LABEL_KEYS[tx.type] ?? tx.type)} />
              <DetailRow label={t('Status')} value={tx.status} />
              <DetailRow label={t('Balance before')} value={formatCurrency(tx.balance_before)} />
              <DetailRow label={t('Balance after')} value={formatCurrency(tx.balance_after)} />
              {tx.reference && (
                <DetailRow
                  label={t('Reference ({{type}})', { type: tx.reference.type })}
                  value={[tx.reference.label, tx.reference.summary].filter(Boolean).join(' — ') || '—'}
                />
              )}
              {tx.reference_id != null && !tx.reference && (
                <DetailRow label={t('Reference id')} value={`#${tx.reference_id}`} />
              )}
              <DetailRow label={t('Date')} value={formatDateTime(tx.created_at)} />
            </dl>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="truncate text-right font-medium">{value}</dd>
    </div>
  )
}

export function AdminWalletPage() {
  const { t } = useTranslation()
  const { data: wallet, isLoading, isError, refetch } = useAdminWallet()
  const [page, setPage] = useState(1)
  const [type, setType] = useState<string>('')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')

  const { data: txPage, isLoading: txLoading, isError: txError, refetch: refetchTx } =
    useAdminWalletTransactions({
      page,
      perPage: 12,
      type: type || undefined,
      q: debounced || undefined,
    })

  const [selected, setSelected] = useState<number | null>(null)

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
        <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-teal-400/30 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <div className="flex items-center gap-2 text-sm font-medium text-white/80">
              <span className="flex h-6 items-center gap-1.5 rounded-full bg-white/20 px-3 text-xs font-semibold backdrop-blur">
                <WalletIcon className="h-3.5 w-3.5" />
                {t('Platform Wallet')}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{t('Wallet')}</h1>
            <p className="mt-1.5 text-sm text-white/80">
              {t('Platform balance and transaction history.')}
            </p>
          </div>
          <div className="flex flex-col items-start gap-1 rounded-2xl bg-white/15 px-6 py-4 backdrop-blur">
            <span className="text-xs font-medium uppercase tracking-wider text-white/70">
              {t('Total Balance')}
            </span>
            <span className="text-3xl font-extrabold tracking-tight">
              {wallet ? formatCurrency(Number(wallet.total_balance)) : '—'}
            </span>
            <span className="text-xs text-white/70">
              {wallet?.currency ?? ''} · {wallet?.status === 'ACTIVE' ? t('Active') : (wallet?.status ?? '')}
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : isError || !wallet ? (
        <ApiError error={{ message: t('Could not load wallet.') }} onRetry={refetch} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label={t('Available Balance')}
            value={formatCurrency(Number(wallet.available_balance))}
            sub={`${wallet.currency} · ${t('Ready to use')}`}
            icon={WalletIcon}
            gradient="from-emerald-400 to-teal-600"
            iconClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
          />
          <StatCard
            label={t('Pending')}
            value={formatCurrency(Number(wallet.pending_balance))}
            sub={t('Held for in-process transactions')}
            icon={Clock}
            gradient="from-amber-400 to-orange-500"
            iconClass="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
          />
          <StatCard
            label={t('Total Balance')}
            value={formatCurrency(Number(wallet.total_balance))}
            sub={`${wallet.currency} · ${wallet.status === 'ACTIVE' ? t('Active') : wallet.status}`}
            icon={BadgeCheck}
            gradient="from-teal-400 to-orange-600"
            iconClass="bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400"
          />
        </div>
      )}

      <Card className="overflow-hidden border-transparent bg-white/70 shadow-sm backdrop-blur dark:bg-card/70">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold">{t('Transaction History')}</h2>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { refetch(); refetchTx() }}
            title={t('Refresh')}
          >
            <RefreshCw className="mr-1 h-4 w-4" /> {t('Refresh')}
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 border-b px-5 py-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t('Search description...')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
                window.setTimeout(() => setDebounced(e.target.value), 300)
              }}
            />
          </div>
          <Select
            value={type}
            onValueChange={(v) => {
              setType(v === 'ALL' ? '' : v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t('All types')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('All types')}</SelectItem>
              {ALL_TYPES.map((typeValue) => (
                <SelectItem key={typeValue} value={typeValue}>
                  {t(TYPE_LABEL_KEYS[typeValue] ?? typeValue)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(type || debounced) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setType(''); setSearch(''); setDebounced(''); setPage(1) }}
            >
              <X className="mr-1 h-4 w-4" /> {t('Clear')}
            </Button>
          )}
        </div>

        <div>
          {txLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : txError ? (
            <div className="flex items-center justify-between p-6 text-sm text-destructive">
              {t('Could not load transactions.')}
              <Button size="sm" variant="outline" onClick={() => refetchTx()}>
                <RefreshCw className="mr-1 h-4 w-4" /> {t('Retry')}
              </Button>
            </div>
          ) : txPage && txPage.data.length > 0 ? (
            <div className="divide-y divide-border/60">
              {txPage.data.map((tx) => {
                const credit = isCreditTransaction(tx)
                const tone = TYPE_TONE[tx.type]
                return (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => setSelected(tx.id)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition duration-200 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
                    title={t('View transaction details')}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.chip}`}
                      >
                        <tone.icon className="h-4.5 w-4.5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold">
                            {t(TYPE_LABEL_KEYS[tx.type] ?? tx.type)}
                          </p>
                          <StatusChip status={tx.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(tx.created_at)}
                        </p>
                        {tx.description && (
                          <p className="truncate text-xs text-muted-foreground">{tx.description}</p>
                        )}
                        {tx.reference_id != null && (
                          <p className="text-[11px] text-muted-foreground/70">
                            Ref #{tx.reference_id}
                          </p>
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
                          {t('Bal')} {formatCurrency(tx.balance_after)}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60">
                <WalletIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium">
                {type || debounced ? t('No matching transactions') : t('No transactions yet')}
              </p>
              <p className="text-sm text-muted-foreground">
                {type || debounced
                  ? t('Try adjusting your search or filter.')
                  : t('Platform wallet transactions will appear here.')}
              </p>
            </div>
          )}
        </div>

        {txPage && txPage.total > 0 && (
          <div className="flex items-center justify-between border-t px-5 py-3 text-sm text-muted-foreground">
            <span>
              {t('{{count}} transactions · Page {{page}} of {{total}} · Click a row for details', {
                count: txPage.total,
                page: txPage.current_page,
                total: totalPages,
              })}
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
                {t('Next')} <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <TransactionDetailDialog
        transactionId={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
