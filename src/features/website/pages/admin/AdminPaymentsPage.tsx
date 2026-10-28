import { useEffect, useState } from 'react'
import { CheckCircle2, CreditCard, KeyRound, Plug, Save, ShieldCheck, Truck, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ApiError } from '@/components/common/admin'
import {
  useAdminPaymentSettings,
  useTestAdminRazorpay,
  useUpdateAdminPaymentSettings,
} from '@/hooks/useAdmin'
import type { PaymentSettings } from '@/types'
import { useTranslation } from 'react-i18next'

export function AdminPaymentsPage() {
  const { t } = useTranslation()
  const { data, isLoading, error, refetch } = useAdminPaymentSettings()
  const updateMutation = useUpdateAdminPaymentSettings()
  const testConnection = useTestAdminRazorpay()

  const [form, setForm] = useState<PaymentSettings | null>(null)
  const [saved, setSaved] = useState<PaymentSettings | null>(null)
  const [saveMessage, setSaveMessage] = useState('')
  const [keySecret, setKeySecret] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [testMessage, setTestMessage] = useState('')

  useEffect(() => {
    if (data) {
      setForm((prev) => prev ?? data)
      setSaved(data)
    }
  }, [data])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return <ApiError error={error} onRetry={refetch} />
  }

  if (!form) {
    return null
  }

  const set = (patch: Partial<PaymentSettings>) => setForm((f) => (f ? { ...f, ...patch } : f))
  const secretsDirty = keySecret.trim() !== '' || webhookSecret.trim() !== ''
  const dirty = secretsDirty || JSON.stringify(sanitize(form)) !== JSON.stringify(sanitize(saved ?? form))

  const onSave = () => {
    setSaveMessage('')
    const patch: Parameters<typeof updateMutation.mutate>[0] = {
      razorpay_enabled: form.razorpay_enabled,
      cod_enabled: form.cod_enabled,
      wallet_enabled: form.wallet_enabled,
      razorpay_key_id: form.razorpay_key_id,
      razorpay_mode: form.razorpay_mode,
      cod_min_amount: Number(form.cod_min_amount) || 0,
      cod_max_amount: form.cod_max_amount ? Number(form.cod_max_amount) : null,
      cod_fee: Number(form.cod_fee) || 0,
      free_delivery_threshold: form.free_delivery_threshold ? Number(form.free_delivery_threshold) : null,
      currency: form.currency,
    }
    if (keySecret.trim()) patch.razorpay_key_secret = keySecret.trim()
    if (webhookSecret.trim()) patch.razorpay_webhook_secret = webhookSecret.trim()
    updateMutation.mutate(patch, {
      onSuccess: (settings) => {
        setForm(settings)
        setSaved(settings)
        setKeySecret('')
        setWebhookSecret('')
        setSaveMessage(t('Payment settings saved.'))
      },
      onError: (e) => setSaveMessage((e as Error).message),
    })
  }

  const onTestConnection = () => {
    setTestMessage('')
    testConnection.mutate(
      {
        razorpay_key_id: form.razorpay_key_id,
        razorpay_key_secret: keySecret.trim() || undefined,
      },
      {
        onSuccess: (result) => {
          setTestMessage(
            `${result.connected ? t('Connection successful') : t('Connection failed')}: ${result.message}`,
          )
          // Persist the tested keys so the wallet recharge flow can use them
          // without an extra "Save Settings" click.
          if (result.connected) {
            onSave()
          }
        },
        onError: (e) => setTestMessage((e as Error).message),
      },
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{t('Payment Settings')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('Control which payment methods customers can use at checkout.')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" /> {t('Enabled Payment Methods')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MethodRow
            title={t('Razorpay')}
            description={t('UPI, Cards, Net Banking and other Razorpay-supported methods.')}
            checked={form.razorpay_enabled}
            onCheckedChange={(v) => set({ razorpay_enabled: v })}
          />
          <MethodRow
            title={t('Cash on Delivery')}
            description={t('Customers pay the delivery agent when the order arrives.')}
            checked={form.cod_enabled}
            onCheckedChange={(v) => set({ cod_enabled: v })}
          />
          <MethodRow
            title={t('Wallet')}
            description={t('Pay with the customer wallet balance.')}
            checked={form.wallet_enabled}
            onCheckedChange={(v) => set({ wallet_enabled: v })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" /> {t('Razorpay Configuration')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t('Mode')}</Label>
              <Select value={form.razorpay_mode} onValueChange={(v) => set({ razorpay_mode: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">{t('Test mode')}</SelectItem>
                  <SelectItem value="live">{t('Live mode')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t('Switch to live only when you are ready to accept real payments.')}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>{t('Key ID')}</Label>
              <Input
                type="text"
                placeholder={form.razorpay_key_id || t('rzp_test_...')}
                value={form.razorpay_key_id ?? ''}
                onChange={(e) => set({ razorpay_key_id: e.target.value || null })}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">{t('Your Razorpay Key ID from the Dashboard.')}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-muted-foreground" /> {t('Key Secret')}
                <SecretStatus set={form.razorpay_key_secret_set} />
              </Label>
              <Input
                type="password"
                placeholder={form.razorpay_key_secret_set ? '••••••••••••••••' : t('Not set')}
                value={keySecret}
                onChange={(e) => setKeySecret(e.target.value)}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                {t('Leave blank to keep the current secret. Stored encrypted.')}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" /> {t('Webhook Secret')}
                <SecretStatus set={form.razorpay_webhook_secret_set} />
              </Label>
              <Input
                type="password"
                placeholder={form.razorpay_webhook_secret_set ? '••••••••••••••••' : t('Not set')}
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                {t('Used to verify Razorpay webhook signatures. Stored encrypted.')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onTestConnection}
              disabled={testConnection.isPending}
            >
              <Plug className="mr-1 h-4 w-4" />
              {testConnection.isPending ? t('Testing...') : t('Test Connection')}
            </Button>
            {testMessage && (
              <span
                className={
                  testConnection.isError || testMessage.startsWith(t('Connection failed'))
                    ? 'text-sm text-destructive'
                    : 'text-sm text-emerald-600'
                }
              >
                {testMessage}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('COD Configuration')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>{t('Minimum order amount')}</Label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.cod_min_amount}
                onChange={(e) => set({ cod_min_amount: Number(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                {t('Orders below this amount cannot use COD.')}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>{t('Maximum order amount')}</Label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.cod_max_amount ?? ''}
                placeholder={t('No limit')}
                onChange={(e) =>
                  set({ cod_max_amount: e.target.value === '' ? null : Number(e.target.value) || 0 })
                }
              />
              <p className="text-xs text-muted-foreground">{t('Leave empty for no limit.')}</p>
            </div>
            <div className="space-y-1.5">
              <Label>{t('COD fee')}</Label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.cod_fee}
                onChange={(e) => set({ cod_fee: Number(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">{t('Flat fee charged to the customer.')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" /> {t('Free Delivery')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:max-w-xs">
            <div className="space-y-1.5">
              <Label>{t('Free delivery above order subtotal')}</Label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.free_delivery_threshold ?? ''}
                placeholder={t('Disabled')}
                onChange={(e) =>
                  set({ free_delivery_threshold: e.target.value === '' ? null : Number(e.target.value) || 0 })
                }
              />
              <p className="text-xs text-muted-foreground">
                {t('Shipping becomes free for every vendor when the cart subtotal reaches this amount. Leave empty to disable.')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={onSave} disabled={!dirty || updateMutation.isPending}>
          <Save className="mr-1 h-4 w-4" /> {updateMutation.isPending ? t('Saving...') : t('Save Settings')}
        </Button>
        {saveMessage && <span className="text-sm">{saveMessage}</span>}
      </div>
      <Separator />
      <p className="text-sm text-muted-foreground">
        {t('Changing these settings takes effect immediately and is reflected at checkout.')}
      </p>
    </div>
  )

  function MethodRow({
    title,
    description,
    checked,
    onCheckedChange,
  }: {
    title: string
    description: string
    checked: boolean
    onCheckedChange: (v: boolean) => void
  }) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-md border p-4">
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    )
  }
}

function SecretStatus({ set }: { set: boolean }) {
  const { t } = useTranslation()
  return set ? (
    <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
      <CheckCircle2 className="h-3 w-3" /> {t('Set')}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
      <XCircle className="h-3 w-3" /> {t('Not set')}
    </span>
  )
}

function sanitize(s: PaymentSettings): Omit<PaymentSettings, 'id' | 'created_at' | 'updated_at'> {
  return {
    razorpay_enabled: s.razorpay_enabled,
    cod_enabled: s.cod_enabled,
    wallet_enabled: s.wallet_enabled,
    razorpay_key_id: s.razorpay_key_id,
    razorpay_key_secret_set: s.razorpay_key_secret_set,
    razorpay_webhook_secret_set: s.razorpay_webhook_secret_set,
    razorpay_mode: s.razorpay_mode,
    cod_min_amount: Number(s.cod_min_amount),
    cod_max_amount: s.cod_max_amount ? Number(s.cod_max_amount) : null,
    cod_fee: Number(s.cod_fee),
    free_delivery_threshold: s.free_delivery_threshold ? Number(s.free_delivery_threshold) : null,
    currency: s.currency,
  }
}