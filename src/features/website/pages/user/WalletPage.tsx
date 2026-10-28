import { useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  RotateCcw,
  Wallet as WalletIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useWallet,
  useWalletTransaction,
  useWalletTransactions,
  useConfirmRecharge,
  useRechargeWallet,
} from '@/hooks/useWallet'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { loadRazorpayScript, openRazorpayCheckout } from '@/services/razorpay'
import { AccountSubPageHeader } from '@/components/common/AccountSubPageHeader'
import type { WalletTransaction, WalletTransactionTypeValue } from '@/types'
import { useTranslation } from 'react-i18next'
import { tStatus } from '@/i18n/status'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'credit', label: 'Credit' },
  { value: 'debit', label: 'Debit' },
  { value: 'refund', label: 'Refund' },
  { value: 'recharge', label: 'Recharge' },
] as const

const TYPE_LABELS: Record<WalletTransactionTypeValue, string> = {
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

function isCreditTransaction(tx: WalletTransaction): boolean {
  return ['RECHARGE', 'REFUND', 'CREDIT', 'ADJUSTMENT', 'COMMISSION', 'ORDER_PAYOUT'].includes(
    tx.type,
  )
}

export function WalletPage() {
  const { t } = useTranslation()
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const { data: wallet, isLoading } = useWallet(!!token)
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit' | 'refund' | 'recharge'>('all')
  const [page, setPage] = useState(1)
  const { data: txPage, isLoading: txLoading } = useWalletTransactions(filter, page, !!token)

  const [addOpen, setAddOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [addError, setAddError] = useState('')
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [rechargeOrder, setRechargeOrder] = useState<{
    order_id: string
    amount: number
    currency: string
    key: string
  } | null>(null)
  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null)

  const rechargeMutation = useRechargeWallet()
  const confirmMutation = useConfirmRecharge()

  const handleAddMoney = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      setAddError('Enter a valid amount.')
      return
    }
    setAddError('')

    try {
      const result = await rechargeMutation.mutateAsync({ amount: value })
      setRechargeOrder(result.razorpay)
      await openCheckout(result.razorpay)
    } catch (err) {
      setAddError((err as Error).message)
    }
  }

  const openCheckout = async (order: NonNullable<typeof rechargeOrder>) => {
    const loaded = await loadRazorpayScript()

    if (!loaded) {
      setVerifyOpen(true)
      return
    }

    openRazorpayCheckout({
      key: order.key,
      amount: order.amount,
      currency: order.currency,
      order_id: order.order_id,
      name: user?.name ?? 'My Wallet',
      description: t('Add money to wallet'),
      handler: async (payload) => {
        try {
          await confirmMutation.mutateAsync(payload)
          setAddOpen(false)
          setAmount('')
          setRechargeOrder(null)
        } catch (err) {
          setAddError((err as Error).message)
        }
      },
      modal: { ondismiss: () => setRechargeOrder(null) },
    })
  }

  const handleManualVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    try {
      await confirmMutation.mutateAsync({
        razorpay_order_id: rechargeOrder?.order_id ?? '',
        razorpay_payment_id: String(form.get('payment_id')),
        razorpay_signature: String(form.get('signature')),
      })
      setVerifyOpen(false)
      setAddOpen(false)
      setAmount('')
      setRechargeOrder(null)
    } catch (err) {
      setAddError((err as Error).message)
    }
  }

  const totalTransactions = txPage?.total ?? 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <AccountSubPageHeader
        icon={WalletIcon}
        title={t('My Wallet')}
        subtitle={t('Recharge, spend and track every rupee.')}
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> {t('Add Money')}
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="space-y-2 p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <WalletIcon className="h-4 w-4 text-primary" /> {t('Available Balance')}
              </div>
              <p className="text-3xl font-bold">
                {formatCurrency(Number(wallet?.available_balance ?? 0))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-amber-500" /> {t('Pending')}
              </div>
              <p className="text-xl font-semibold text-amber-600">
                {formatCurrency(Number(wallet?.pending_balance ?? 0))}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('Held for in-process payments')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BadgeCheck className="h-4 w-4 text-emerald-600" /> {t('Total Balance')}
              </div>
              <p className="text-xl font-semibold">{formatCurrency(Number(wallet?.total_balance ?? 0))}</p>
              <p className="text-xs text-muted-foreground">
                {wallet?.currency} · {wallet?.status === 'ACTIVE' ? 'Active' : wallet?.status}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('Transaction History')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={filter}
            onValueChange={(value) => {
              setFilter(value as typeof filter)
              setPage(1)
            }}
          >
            <TabsList className="w-full justify-start">
              {FILTERS.map((f) => (
                <TabsTrigger key={f.value} value={f.value}>
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Separator className="my-4" />

          {txLoading ? (
            <Skeleton className="h-40 rounded-lg" />
          ) : txPage && txPage.data.length > 0 ? (
            <div>
              <div className="divide-y">
                {txPage.data.map((tx) => {
                  const credit = isCreditTransaction(tx)
                  return (
                    <button
                      key={tx.id}
                      type="button"
                      className="flex w-full items-center justify-between gap-3 py-4 text-left hover:bg-accent/40"
                      onClick={() => setSelectedTx(tx)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full ${
                            credit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {credit ? (
                            <ArrowDownLeft className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {t(TYPE_LABELS[tx.type] ?? tStatus(t, tx.type))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(tx.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {tx.status !== 'COMPLETED' && (
                          <Badge variant="outline">{tx.status}</Badge>
                        )}
                        <span
                          className={`font-semibold ${
                            credit ? 'text-emerald-600' : 'text-destructive'
                          }`}
                        >
                          {credit ? '+' : '-'}
                          {formatCurrency(Math.abs(tx.amount))}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {totalTransactions > (txPage?.per_page ?? 15) && (
                <div className="mt-4 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" /> {t('Previous')}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {txPage.current_page} of {txPage.last_page}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= (txPage?.last_page ?? 1)}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 text-center">
              <RotateCcw className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">{t('No transactions yet')}</p>
              <p className="text-sm text-muted-foreground">{t('Add money or place an order to get started.')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Add Money to Wallet')}</DialogTitle>
            <DialogDescription>
              {t('Top up your wallet to pay for orders instantly using your wallet balance.')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMoney}>
            <div className="space-y-1.5">
              <Label>{t('Amount')}</Label>
              <Input
                inputMode="numeric"
                placeholder={t('e.g. 500')}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
            {addError && <p className="mt-2 text-sm text-destructive">{addError}</p>}
            <DialogFooter className="mt-6">
              <Button type="submit" disabled={rechargeMutation.isPending}>
                {rechargeMutation.isPending ? 'Initiating...' : 'Proceed to Pay'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Complete Payment')}</DialogTitle>
            <DialogDescription>
              Razorpay checkout could not be loaded. Use the test payment details below to
              verify the payment.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleManualVerify}>
            <div className="space-y-3">
              <div className="rounded-md border bg-accent/40 p-3 text-sm">
                <p className="font-medium">{t('Razorpay order')}</p>
                <p className="font-mono text-xs text-muted-foreground">{rechargeOrder?.order_id}</p>
                <p className="mt-1 font-medium">
                  {formatCurrency(Number(rechargeOrder?.amount ?? 0) / 100)}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>{t('Payment ID')}</Label>
                <Input name="payment_id" placeholder={t('pay_test_123')} required />
              </div>
              <div className="space-y-1.5">
                <Label>{t('Signature')}</Label>
                <Input name="signature" placeholder={t('rzp_signature')} required />
              </div>
            </div>
            {addError && <p className="mt-2 text-sm text-destructive">{addError}</p>}
            <DialogFooter className="mt-6">
              <Button type="submit" disabled={confirmMutation.isPending}>
                {confirmMutation.isPending ? 'Verifying...' : 'Verify Payment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TxDetailDialog
        transaction={selectedTx}
        open={!!selectedTx}
        onOpenChange={(open) => {
          if (!open) setSelectedTx(null)
        }}
      />
    </div>
  )
}

function TxDetailDialog({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: WalletTransaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const { data: detail, isLoading } = useWalletTransaction(open && transaction ? transaction.id : null)

  const tx = detail ?? transaction

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Transaction Details')}</DialogTitle>
          <DialogDescription>
            {tx?.created_at ? formatDateTime(tx.created_at) : ' '}
          </DialogDescription>
        </DialogHeader>
        {isLoading && !tx ? (
          <Skeleton className="h-40 rounded-lg" />
        ) : tx ? (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full ${
                  isCreditTransaction(tx) ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {isCreditTransaction(tx) ? (
                  <ArrowDownLeft className="h-5 w-5" />
                ) : (
                  <ArrowUpRight className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="font-semibold">{t(TYPE_LABELS[tx.type] ?? tStatus(t, tx.type))}</p>
                <p className="text-xs text-muted-foreground">{tx.description ?? '—'}</p>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('Amount')}</span>
              <span className={isCreditTransaction(tx) ? 'text-emerald-600' : 'text-destructive'}>
                {isCreditTransaction(tx) ? '+' : '-'} {formatCurrency(Math.abs(tx.amount))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('Status')}</span>
              <Badge variant={tx.status === 'COMPLETED' ? 'default' : tx.status === 'PENDING' ? 'secondary' : 'destructive'}>
                {tx.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('Transaction Type')}</span>
              <span>{tx.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('Balance Before')}</span>
              <span>{formatCurrency(tx.balance_before)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('Balance After')}</span>
              <span>{formatCurrency(tx.balance_after)}</span>
            </div>
            {tx.reference_type && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('Reference')}</span>
                <span className="text-right">
                  {tx.reference_type.replace('App\\Models\\', '')} #{tx.reference_id}
                </span>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}