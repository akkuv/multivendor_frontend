import { useState } from 'react'
import {
  BadgeCheck,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  HandCoins,
  Landmark,
  Lock,
  Plus,
  RefreshCw,
  Smartphone,
  Wallet as WalletIcon,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ApiError, EmptyState, FormField } from '@/components/common/admin'
import { useRequestVendorPayout, useVendorPayouts, useVendorWallet } from '@/hooks/useVendor'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { VendorPayoutStatusValue } from '@/types'
import { useTranslation } from 'react-i18next'

interface StatusConfig {
  chip: string
  dot: string
  icon: typeof Clock
  label: string
}

const STATUS_CONFIG: Record<VendorPayoutStatusValue, StatusConfig> = {
  PENDING: {
    chip: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400',
    dot: 'bg-amber-500',
    icon: Clock,
    label: 'Awaiting review',
  },
  APPROVED: {
    chip: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400',
    dot: 'bg-yellow-500',
    icon: BadgeCheck,
    label: 'Approved · payout in progress',
  },
  PAID: {
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
    label: 'Paid out',
  },
  REJECTED: {
    chip: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400',
    dot: 'bg-rose-500',
    icon: XCircle,
    label: 'Rejected',
  },
}

const METHOD_CONFIG: Record<string, { label: string; chip: string; icon: typeof Landmark }> = {
  bank_transfer: {
    label: 'Bank transfer',
    chip: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400',
    icon: Landmark,
  },
  upi: {
    label: 'UPI',
    chip: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400',
    icon: Smartphone,
  },
}

function StatusChip({ status }: { status: VendorPayoutStatusValue }) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${config.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
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

function payoutId(p: { id: number }) {
  return `#${p.id}`
}

function errorMessage(err: unknown) {
  return typeof err === 'object' && err !== null && 'message' in err
    ? String((err as { message: unknown }).message)
    : null
}

export function VendorPayoutsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [requestOpen, setRequestOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('bank_transfer')
  const [accountHolder, setAccountHolder] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifsc, setIfsc] = useState('')
  const [upi, setUpi] = useState('')
  const [note, setNote] = useState('')

  const { data, isLoading, isError, refetch } = useVendorPayouts(page, 12)
  const { data: wallet } = useVendorWallet()
  const requestMutation = useRequestVendorPayout()

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return

    const accountDetails =
      method === 'upi'
        ? { upi_id: upi }
        : { account_holder: accountHolder, account_number: accountNumber, ifsc_code: ifsc }

    requestMutation.mutate(
      {
        amount: numericAmount,
        method,
        account_details: accountDetails,
        note: note.trim() || undefined,
      },
      { onSuccess: () => setRequestOpen(false) },
    )
  }

  const canSubmit =
    Number(amount) > 0 &&
    (method === 'upi' ? upi.trim() !== '' : accountHolder.trim() !== '' && accountNumber.trim() !== '' && ifsc.trim() !== '')

  const available = wallet ? Number(wallet.available_balance) : null

  return (
    <div className="space-y-6">
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
        <div className="pointer-events-none absolute -bottom-20 left-24 h-40 w-40 rounded-full bg-fuchsia-400/30 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <div className="flex items-center gap-2 text-sm font-medium text-white/80">
              <span className="flex h-6 items-center gap-1.5 rounded-full bg-white/20 px-3 text-xs font-semibold backdrop-blur">
                <HandCoins className="h-3.5 w-3.5" />
                {t('Payouts')}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {t('Withdraw your earnings')}
            </h1>
            <p className="mt-1.5 text-sm text-white/80">
              {t('Request and track withdrawals of your wallet balance.')}
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-4 gap-1.5 shadow-lg"
              onClick={() => setRequestOpen(true)}
            >
              <Plus className="h-4 w-4" /> {t('Request payout')}
            </Button>
          </div>
          <div className="flex flex-col items-start gap-2 rounded-2xl bg-white/15 px-6 py-4 backdrop-blur">
            <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/70">
              <WalletIcon className="h-3.5 w-3.5" /> {t('Available for payout')}
            </span>
            <span className="text-3xl font-extrabold tracking-tight">
              {available !== null ? formatCurrency(available) : '—'}
            </span>
            {wallet ? (
              <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/70">
                <span>Pending {formatCurrency(Number(wallet.pending_balance))}</span>
                <span className="inline-flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Held {formatCurrency(Number(wallet.held_balance))}
                </span>
              </span>
            ) : null}
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
        <ApiError error={{ message: t('Could not load payouts.') }} onRetry={refetch} />
      ) : (
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
            label={t('Pending requests')}
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
            label={t('Total balance')}
            value={formatCurrency(Number(wallet.total_balance))}
            sub="Available + pending + held"
            icon={Banknote}
            gradient="from-yellow-400 to-amber-600"
            iconClass="bg-yellow-100 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-400"
          />
        </div>
      )}

      <Card className="overflow-hidden border-transparent bg-white/70 shadow-sm backdrop-blur dark:bg-card/70">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <HandCoins className="h-5 w-5 text-primary" /> {t('Payout Requests')}
            {!isLoading && data ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {data.total} total
              </span>
            ) : null}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => refetch()} title={t('Refresh')}>
            <RefreshCw className="mr-1 h-4 w-4" /> {t('Refresh')}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : !data || data.data.length === 0 ? (
            <EmptyState message="No payout requests yet. Request your first payout from the button above." />
          ) : (
            <div className="divide-y divide-border/60">
              {data.data.map((p) => {
                const methodConfig = METHOD_CONFIG[p.method] ?? METHOD_CONFIG.bank_transfer
                const Icon = methodConfig.icon
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${methodConfig.chip}`}
                        title={methodConfig.label}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{payoutId(p)}</p>
                          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {methodConfig.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Requested {formatDateTime(p.requested_at ?? p.created_at)}
                        </p>
                        {p.request_note ? (
                          <p
                            className="max-w-[260px] truncate text-xs text-muted-foreground"
                            title={p.request_note}
                          >
                            &ldquo;{p.request_note}&rdquo;
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <p
                        className={`text-base font-extrabold tracking-tight ${
                          p.status === 'PAID'
                            ? 'text-emerald-600'
                            : p.status === 'REJECTED'
                              ? 'text-muted-foreground line-through'
                              : p.status === 'APPROVED'
                                ? 'text-yellow-600'
                                : 'text-amber-600'
                        }`}
                      >
                        {formatCurrency(Number(p.amount))}
                      </p>
                      <StatusChip status={p.status} />
                      {p.approved_at || p.paid_at ? (
                        <p className="text-[11px] text-muted-foreground">
                          {p.paid_at ? `Paid ${formatDateTime(p.paid_at)}` : `Approved ${formatDateTime(p.approved_at)}`}
                        </p>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
        {data && data.total > 0 ? (
          <div className="flex items-center justify-between border-t px-5 py-3 text-sm text-muted-foreground">
            <span>
              {data.total} request{data.total === 1 ? '' : 's'} · Page {data.current_page} of{' '}
              {Math.max(1, data.last_page)}
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
                disabled={page >= data.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <Dialog open={requestOpen} onOpenChange={(open) => !open && setRequestOpen(false)}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('Request Payout')}</DialogTitle>
            <DialogDescription>
              Available balance:{' '}
              <span className="font-semibold text-emerald-600">
                {wallet ? formatCurrency(Number(wallet.available_balance)) : '—'}
              </span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRequest} className="space-y-4">
            <FormField label={t('Amount (₹)')}>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('e.g. 5000')}
                required
              />
              {wallet && Number(amount) > Number(wallet.available_balance) ? (
                <p className="text-xs text-destructive">
                  {t('Amount exceeds your available balance.')}
                </p>
              ) : null}
            </FormField>

            <FormField label={t('Method')}>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">{t('Bank transfer')}</SelectItem>
                  <SelectItem value="upi">{t('UPI')}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {method === 'upi' ? (
              <FormField label={t('UPI ID')}>
                <Input
                  value={upi}
                  onChange={(e) => setUpi(e.target.value)}
                  placeholder="yourname@bank"
                />
              </FormField>
            ) : (
              <div className="space-y-4">
                <FormField label={t('Account holder name')}>
                  <Input
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder={t('Full name')}
                  />
                </FormField>
                <FormField label={t('Account number')}>
                  <Input
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={t('Bank account number')}
                  />
                </FormField>
                <FormField label={t('IFSC code')}>
                  <Input
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value)}
                    placeholder={t('e.g. HDFC0001234')}
                  />
                </FormField>
              </div>
            )}

            <FormField label={t('Note (optional)')}>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('Any note for the payout request')}
                rows={2}
              />
            </FormField>

            {requestMutation.error ? (
              <p className="text-sm text-destructive">{errorMessage(requestMutation.error)}</p>
            ) : null}

            <Separator />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRequestOpen(false)}
                disabled={requestMutation.isPending}
              >
                {t('Cancel')}
              </Button>
              <Button type="submit" disabled={!canSubmit || requestMutation.isPending}>
                {requestMutation.isPending ? 'Submitting...' : 'Request payout'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}