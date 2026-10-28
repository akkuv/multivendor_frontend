import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Eye,
  RefreshCw,
  Search,
  Wallet,
  X,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ApiError } from '@/components/common/admin'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useAdminCommissions,
  useAdminPayouts,
  useApprovePayout,
  useMarkPayoutPaid,
  useRejectPayout,
} from '@/hooks/useAdmin'
import { useDebouncedUrlFilter, useUrlFilters } from '@/hooks/useUrlFilters'
import { formatCurrency, formatDate } from '@/utils/format'
import type { AdminPayout, VendorPayoutStatus } from '@/services/admin'
import { useTranslation } from 'react-i18next'

const STATUS_STYLES: Record<
  VendorPayoutStatus,
  { label: string; chip: string; dot: string; text: string }
> = {
  PENDING: {
    label: 'Pending',
    chip: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400',
    dot: 'bg-amber-500',
    text: 'text-amber-600',
  },
  APPROVED: {
    label: 'Approved',
    chip: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400',
    dot: 'bg-amber-500',
    text: 'text-amber-600',
  },
  PAID: {
    label: 'Paid',
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600',
  },
  REJECTED: {
    label: 'Rejected',
    chip: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400',
    dot: 'bg-rose-500',
    text: 'text-rose-600',
  },
}

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
}

type PayoutAction = 'approve' | 'mark-paid' | 'reject' | 'view'

const ACTIONABLE: Record<VendorPayoutStatus, PayoutAction[]> = {
  PENDING: ['approve', 'reject'],
  APPROVED: ['mark-paid'],
  PAID: [],
  REJECTED: [],
}

function initials(name: string | undefined) {
  if (!name) return 'V'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('')
}

function PayoutStatusChip({ status }: { status: VendorPayoutStatus }) {
  const s = STATUS_STYLES[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
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
  active = false,
  onSelect,
}: {
  label: string
  value: string
  sub?: string
  icon: typeof Clock
  gradient: string
  iconClass: string
  active?: boolean
  onSelect?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!onSelect}
      className={`group relative block w-full overflow-hidden border-transparent bg-white/70 text-left shadow-sm backdrop-blur transition duration-300 dark:bg-card/70 ${
        onSelect ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg' : 'cursor-default'
      } ${active ? 'ring-2 ring-primary' : ''}`}
    >
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
    </button>
  )
}

function EstimateBadge({ actions }: { actions: PayoutAction[] }) {
  const { t } = useTranslation()
  if (actions.includes('approve')) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
        {t('Action needed')}
      </span>
    )
  }
  if (actions.includes('mark-paid')) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
        {t('Ready to pay')}
      </span>
    )
  }
  return null
}

const COMMISSION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  SETTLED: 'Settled',
  REVERSED: 'Reversed',
}

const COMMISSION_STATUS_CHIPS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400',
  SETTLED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400',
  REVERSED: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400',
}

function CommissionStatusChip({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${COMMISSION_STATUS_CHIPS[status] ?? 'bg-muted text-muted-foreground ring-border'}`}
    >
      {COMMISSION_STATUS_LABELS[status] ?? status}
    </span>
  )
}

function PayoutsHero({
  title,
  subtitle,
  tab,
  onTabChange,
  headlineLabel,
  headlineValue,
  headlineFoot,
}: {
  title: string
  subtitle: string
  tab: 'payouts' | 'commissions'
  onTabChange: (next: 'payouts' | 'commissions') => void
  headlineLabel: string
  headlineValue: string
  headlineFoot: string
}) {
  const { t } = useTranslation()
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-orange-600 to-orange-700 p-6 text-white shadow-xl sm:p-8">
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
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              {t('Payouts Center')}
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-1.5 text-sm text-white/80">{subtitle}</p>
          <div className="mt-4 flex rounded-xl bg-white/15 p-1 backdrop-blur">
            {(['payouts', 'commissions'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => onTabChange(key)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                  tab === key ? 'bg-white text-amber-700 shadow' : 'text-white/80 hover:text-white'
                }`}
              >
                {key === 'payouts' ? 'Payout Requests' : 'Commissions'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-start gap-1 rounded-2xl bg-white/15 px-6 py-4 backdrop-blur">
          <span className="text-xs font-medium uppercase tracking-wider text-white/70">
            {headlineLabel}
          </span>
          <span className="text-3xl font-extrabold tracking-tight">{headlineValue}</span>
          <span className="text-xs text-white/70">{headlineFoot}</span>
        </div>
      </div>
    </div>
  )
}

function CommissionsTab() {
  const { t } = useTranslation()
  const {
    values: filters,
    set: setFilter,
    reset: resetFilters,
    hasActive,
    page,
    setPage,
  } = useUrlFilters(['commission_status', 'created_days'])

  const { data, isLoading, isError, refetch } = useAdminCommissions({
    page,
    per_page: 12,
    status: filters.commission_status || undefined,
    created_days: filters.created_days ? Number(filters.created_days) : undefined,
  })

  const summary = data?.summary
  const commissions = data?.commissions
  const rows = commissions?.data ?? []

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('Total commission')}
            </p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight">
              {formatCurrency(summary.total_commission)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('Total net payable')}
            </p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight">
              {formatCurrency(summary.total_net_payable)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('Pending commission')}
            </p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight">{summary.pending}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('Pending net payable')}
            </p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight">
              {formatCurrency(summary.pending_amount)}
            </p>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Select
            value={filters.commission_status || 'ALL'}
            onValueChange={(v) => setFilter('commission_status', v)}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t('All statuses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('All statuses')}</SelectItem>
              <SelectItem value="PENDING">{t('Pending')}</SelectItem>
              <SelectItem value="SETTLED">{t('Settled')}</SelectItem>
              <SelectItem value="REVERSED">{t('Reversed')}</SelectItem>
            </SelectContent>
          </Select>
          {hasActive && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X className="mr-1 h-4 w-4" /> {t('Clear filters')}
            </Button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-1 h-4 w-4" /> {t('Refresh')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <ApiError error={{ message: t('Could not load commissions.') }} onRetry={refetch} />
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {t('No commission records found.')}
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((c) => (
            <Card key={c.id} className="grid grid-cols-12 items-center gap-x-4 gap-y-2 px-5 py-4">
              <div className="col-span-12 flex min-w-0 items-center gap-3 sm:col-span-4">
                <Avatar className="h-10 w-10 rounded-xl ring-1 ring-border">
                  {c.vendor?.logo ? (
                    <AvatarImage src={c.vendor.logo} alt={c.vendor.store_name} />
                  ) : null}
                  <AvatarFallback className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-xs font-bold text-white">
                    {initials(c.vendor?.store_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{c.vendor?.store_name ?? 'Vendor'}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.vendorOrder?.vendor_order_number ?? `Commission #${c.id}`}
                  </p>
                </div>
              </div>

              <div className="col-span-6 sm:col-span-2">
                <CommissionStatusChip status={c.status} />
              </div>

              <div className="col-span-6 text-sm sm:col-span-2">
                <p className="font-medium">{formatCurrency(Number(c.eligible_amount))}</p>
                <p className="text-xs text-muted-foreground">
                  at {Number(c.commission_rate)}% · {formatDate(c.created_at)}
                </p>
              </div>

              <div className="col-span-12 sm:col-span-2">
                <p className="text-lg font-extrabold tracking-tight">
                  {formatCurrency(Number(c.commission_amount))}
                </p>
                <p className="text-xs text-muted-foreground">
                  net {formatCurrency(Number(c.net_payable))}
                </p>
              </div>

              <div className="col-span-12 sm:col-span-2 sm:text-right">
                {c.status === 'REVERSED' && c.reversal_reason && (
                  <p className="text-xs text-rose-600">{c.reversal_reason}</p>
                )}
                {c.status === 'PENDING' && c.return_window_ends_at && (
                  <p className="text-xs text-muted-foreground">
                    Return window until {formatDate(c.return_window_ends_at)}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {commissions && commissions.last_page > 1 && (
        <div className="flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
          <span>
            Page {commissions.current_page} of {commissions.last_page} ({commissions.total} total)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              {t('Previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= commissions.last_page}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('Next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

const PAYOUT_FILTER_KEYS = ['payout_status', 'payout_search', 'created_days'] as const

export function AdminPayoutsPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'commissions' ? 'commissions' : 'payouts'

  const setTab = (next: 'payouts' | 'commissions') => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (next === 'commissions') {
          params.set('tab', 'commissions')
        } else {
          params.delete('tab')
        }
        return params
      },
      { replace: true },
    )
  }

  const {
    values: filters,
    set: setFilter,
    reset: resetFilters,
    hasActive,
    page,
    setPage,
  } = useUrlFilters(PAYOUT_FILTER_KEYS)
  const { input: search, setInput: setSearch } = useDebouncedUrlFilter('payout_search')
  const [actionFor, setActionFor] = useState<{ payout: AdminPayout; action: PayoutAction } | null>(null)
  const [note, setNote] = useState('')

  const status = filters.payout_status as VendorPayoutStatus | ''

  const { data, isLoading, isError, refetch } = useAdminPayouts({
    page,
    per_page: 12,
    status: status || undefined,
    created_days: filters.created_days ? Number(filters.created_days) : undefined,
  })

  const approve = useApprovePayout()
  const markPaid = useMarkPayoutPaid()
  const reject = useRejectPayout()

  const runAction = () => {
    if (!actionFor) return
    const { payout, action } = actionFor
    const args = { id: payout.id, note: note || undefined }
    const mutate = action === 'approve' ? approve : action === 'mark-paid' ? markPaid : reject
    mutate.mutate(args, {
      onSuccess: () => {
        setActionFor(null)
        setNote('')
      },
    })
  }

  const pendingMutation = approve.isPending || markPaid.isPending || reject.isPending

  const payouts = data?.payouts
  const summary = data?.summary
  const term = search.trim().toLowerCase()
  const filtered = term
    ? (payouts?.data ?? []).filter(
        (p) =>
          p.vendor?.store_name.toLowerCase().includes(term) ||
          p.vendor?.user?.name.toLowerCase().includes(term) ||
          p.vendor?.user?.email.toLowerCase().includes(term),
      )
    : (payouts?.data ?? [])

  return (
    <div className="space-y-6">
      <PayoutsHero
        title={tab === 'commissions' ? 'Commission Ledger' : 'Payout Requests'}
        subtitle={
          tab === 'commissions'
            ? 'Commission earned per vendor order and what is still owed to vendors.'
            : 'Review, approve and process vendor payout requests.'
        }
        tab={tab}
        onTabChange={setTab}
        headlineLabel="Total Payout Amount"
        headlineValue={formatCurrency(summary?.total_amount ?? 0)}
        headlineFoot={`across ${payouts?.total ?? 0} request${payouts?.total === 1 ? '' : 's'}`}
      />

      {tab === 'commissions' ? (
        <CommissionsTab />
      ) : (
        <>
      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            label={t('Pending')}
            value={String(summary.pending)}
            sub={formatCurrency(summary.pending_amount)}
            icon={Clock}
            gradient="from-amber-400 to-orange-500"
            iconClass="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
            active={status === 'PENDING'}
            onSelect={() => setFilter('payout_status', status === 'PENDING' ? 'ALL' : 'PENDING')}
          />
          <StatCard
            label={t('Approved')}
            value={String(summary.approved)}
            icon={Banknote}
            gradient="from-amber-400 to-amber-600"
            iconClass="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
            active={status === 'APPROVED'}
            onSelect={() => setFilter('payout_status', status === 'APPROVED' ? 'ALL' : 'APPROVED')}
          />
          <StatCard
            label={t('Paid')}
            value={String(summary.paid)}
            icon={CheckCircle2}
            gradient="from-emerald-400 to-teal-600"
            iconClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
            active={status === 'PAID'}
            onSelect={() => setFilter('payout_status', status === 'PAID' ? 'ALL' : 'PAID')}
          />
          <StatCard
            label={t('Rejected')}
            value={String(summary.rejected)}
            icon={XCircle}
            gradient="from-rose-400 to-rose-600"
            iconClass="bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
            active={status === 'REJECTED'}
            onSelect={() => setFilter('payout_status', status === 'REJECTED' ? 'ALL' : 'REJECTED')}
          />
          <StatCard
            label={t('Total Amount')}
            value={formatCurrency(summary.total_amount)}
            icon={CircleDollarSign}
            gradient="from-fuchsia-400 to-orange-600"
            iconClass="bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t('Search by store, owner or email...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={status || 'ALL'} onValueChange={(v) => setFilter('payout_status', v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('All statuses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('All statuses')}</SelectItem>
              <SelectItem value="PENDING">{t('Pending')}</SelectItem>
              <SelectItem value="APPROVED">{t('Approved')}</SelectItem>
              <SelectItem value="PAID">{t('Paid')}</SelectItem>
              <SelectItem value="REJECTED">{t('Rejected')}</SelectItem>
            </SelectContent>
          </Select>
          {hasActive && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X className="mr-1 h-4 w-4" /> {t('Clear filters')}
            </Button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-1 h-4 w-4" /> {t('Refresh')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center justify-between rounded-2xl border bg-card/60 p-6 text-sm text-destructive">
          {t('Could not load payouts.')}
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-1 h-4 w-4" /> {t('Retry')}
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {filtered.map((payout) => {
              const actions = ACTIONABLE[payout.status] ?? []
              const st = STATUS_STYLES[payout.status]
              const canApprove = actions.includes('approve')
              const canThank = actions.includes('mark-paid')
              return (
                <Card
                  key={payout.id}
                  className="group overflow-hidden border-transparent bg-white/80 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-lg dark:bg-card/70 dark:hover:border-amber-500/40"
                >
                  <div className="grid grid-cols-12 items-center gap-x-4 gap-y-3 px-5 pt-5 pb-4">
                    <div
                      className="col-span-12 flex min-w-0 cursor-pointer items-center gap-3 sm:col-span-4"
                      onClick={() => { setActionFor({ payout, action: 'view' }); setNote('') }}
                    >
                      <Avatar className="h-12 w-12 rounded-xl ring-1 ring-border">
                        {payout.vendor?.logo ? (
                          <AvatarImage src={payout.vendor.logo} alt={payout.vendor.store_name} />
                        ) : null}
                        <AvatarFallback className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-sm font-bold text-white">
                          {initials(payout.vendor?.store_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold">
                            {payout.vendor?.store_name ?? 'Vendor'}
                          </p>
                          <EstimateBadge actions={actions} />
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                          {payout.vendor?.user?.name ?? '—'}
                        </p>
                        <p className="truncate text-xs text-muted-foreground/80">
                          {payout.vendor?.user?.email}
                        </p>
                      </div>
                    </div>

                    <div className="col-span-6 flex items-center sm:col-span-2">
                      <PayoutStatusChip status={payout.status} />
                    </div>

                    <div className="col-span-6 sm:col-span-2">
                      <p className="text-sm font-medium">{formatDate(payout.requested_at)}</p>
                      <p className="text-xs text-muted-foreground">
                        {METHOD_LABELS[payout.method] ?? payout.method}
                      </p>
                    </div>

                    <div className="col-span-6 sm:col-span-2">
                      <p className={`text-xl font-extrabold tracking-tight ${st.text}`}>
                        {formatCurrency(Number(payout.amount))}
                      </p>
                      <p className="text-xs text-muted-foreground">#{payout.id}</p>
                    </div>

                    <div className="col-span-12 flex flex-wrap items-center justify-start gap-2 sm:col-span-2 sm:justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-muted-foreground"
                        onClick={() => { setActionFor({ payout, action: 'view' }); setNote('') }}
                      >
                        <Eye className="mr-1.5 h-4 w-4" /> {t('Payout Details')}
                      </Button>
                    </div>
                  </div>

                  {(canApprove || canThank) && (
                  <div className="flex flex-wrap items-center justify-end gap-2 border-t px-5 py-3">
                    {canApprove && (
                      <>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm hover:from-amber-700 hover:to-orange-700"
                          onClick={() => { setActionFor({ payout, action: 'approve' }); setNote('') }}
                        >
                          <CheckCircle2 className="mr-1.5 h-4 w-4" /> {t('Approve Payout')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-500/30 dark:hover:bg-rose-500/10"
                          onClick={() => { setActionFor({ payout, action: 'reject' }); setNote('') }}
                        >
                          <XCircle className="mr-1.5 h-4 w-4" /> {t('Reject Payout')}
                        </Button>
                      </>
                    )}
                    {canThank && (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm hover:from-amber-700 hover:to-orange-700"
                        onClick={() => { setActionFor({ payout, action: 'mark-paid' }); setNote('') }}
                      >
                        <Wallet className="mr-1.5 h-4 w-4" /> {t('Mark Payout Paid')}
                      </Button>
                    )}
                  </div>
                  )}
                </Card>
              )
            })}
          </div>

          {payouts && payouts.last_page > 1 && (
            <div className="flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
              <span>
                Page {payouts.current_page} of {payouts.last_page} ({payouts.total} total)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  {t('Previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= payouts.last_page}
                  onClick={() => setPage(page + 1)}
                >
                  {t('Next')}
                </Button>
              </div>
            </div>
          )}

          {payouts && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60">
                <Banknote className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium">{t('No payout requests found')}</p>
              <p className="text-sm text-muted-foreground">{t('Try adjusting your search or filters.')}</p>
            </div>
          )}
        </>
      )}

      {tab === 'payouts' && (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-orange-600 to-orange-700 p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/80">
              {t('Awaiting payout approval')}
            </p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight">
              {formatCurrency(summary?.pending_amount ?? 0)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-white/80">{t('Pending requests')}</p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight">{summary?.pending ?? 0}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="bg-white/20 text-white backdrop-blur hover:bg-white/30"
              onClick={() => setFilter('payout_status', 'PENDING')}
            >
              Review pending <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      )}

      <Dialog open={!!actionFor} onOpenChange={(open) => { if (!open) setActionFor(null) }}>
        {/* payout action dialog */}
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {actionFor?.action === 'approve'
                ? 'Approve Payout'
                : actionFor?.action === 'mark-paid'
                  ? 'Mark Payout as Paid'
                  : actionFor?.action === 'reject'
                    ? 'Reject Payout'
                    : 'Payout Details'}
            </DialogTitle>
            <DialogDescription>
              {actionFor
                ? `${actionFor.payout.vendor?.store_name} · ${formatCurrency(Number(actionFor.payout.amount))}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border bg-accent/40 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('Method')}</span>
                <span>{actionFor ? METHOD_LABELS[actionFor.payout.method] ?? actionFor.payout.method : ''}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">{t('Status')}</span>
                <span className={`font-semibold ${actionFor ? STATUS_STYLES[actionFor.payout.status].text : ''}`}>
                  {actionFor ? STATUS_STYLES[actionFor.payout.status].label : ''}
                </span>
              </div>
              {actionFor?.payout.account_details &&
                Object.entries(actionFor.payout.account_details).map(([k, v]) => (
                  <div key={k} className="mt-1 flex justify-between gap-2">
                    <span className="text-muted-foreground capitalize">{k.replaceAll('_', ' ')}</span>
                    <span className="text-right">{String(v)}</span>
                  </div>
                ))}
            </div>
            {actionFor?.payout.status === 'PENDING' && actionFor.action !== 'view' && (
              <div className="space-y-1.5">
                <Label>{t('Note (optional)')}</Label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('Internal note for the vendor...')}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionFor(null)} disabled={pendingMutation}>
              {actionFor?.action === 'view' ? 'Close' : 'Cancel'}
            </Button>
            {actionFor && actionFor.action !== 'view' && (
              <Button
                onClick={runAction}
                disabled={pendingMutation}
                variant={actionFor.action === 'reject' ? 'destructive' : 'default'}
              >
                {pendingMutation
                  ? 'Saving...'
                  : actionFor.action === 'approve'
                    ? 'Approve Payout'
                    : actionFor.action === 'mark-paid'
                      ? 'Mark Payout Paid'
                      : 'Reject Payout'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
      )}
    </div>
  )
}
