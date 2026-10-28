import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  Link2,
  MapPin,
  Package,
  Plug,
  RefreshCw,
  Save,
  ShieldCheck,
  Truck,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  useAdminShiprocketPickupLocations,
  useAdminShiprocketSettings,
  useTestAdminShiprocketConnection,
  useUpdateAdminShiprocketSettings,
} from '@/hooks/useAdmin'
import { toast } from '@/lib/toast'
import type { ShiprocketPickupLocation, ShiprocketSettings } from '@/services/admin'
import { useTranslation } from 'react-i18next'

export function AdminShippingSettingsPage() {
  const { data, isLoading, error, refetch } = useAdminShiprocketSettings()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return <ApiError error={error} onRetry={refetch} />
  }

  if (!data) {
    return null
  }

  // Remounting on a settings change keeps the draft in sync with the server
  // without a setState-in-effect cascade.
  return <ShippingSettingsForm settings={data} />
}

function ShippingSettingsForm({ settings }: { settings: ShiprocketSettings }) {
  const { t } = useTranslation()
  const updateMutation = useUpdateAdminShiprocketSettings()
  const testMutation = useTestAdminShiprocketConnection()

  const [form, setForm] = useState<ShiprocketSettings>(settings)
  const [saved, setSaved] = useState<ShiprocketSettings>(settings)
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const [testFailed, setTestFailed] = useState(false)
  const [pickupDraft, setPickupDraft] = useState('')

  const secretsDirty = password.trim() !== '' || token.trim() !== '' || webhookSecret.trim() !== ''
  const dirty = secretsDirty || JSON.stringify(sanitize(form)) !== JSON.stringify(sanitize(saved))

  const pickupLocations = useMemo<string[]>(() => form.pickup_locations ?? [], [form])
  const useLivePickupList = pickupLocations.length === 0

  const set = (patch: Partial<ShiprocketSettings>) => setForm((f) => ({ ...f, ...patch }))

  const onSave = () => {
    const patch: Parameters<typeof updateMutation.mutate>[0] = {
      enabled: form.enabled,
      environment: form.environment,
      base_url: form.base_url?.trim() || null,
      email: form.email?.trim() || null,
      default_pickup_location: form.default_pickup_location?.trim() || null,
      pickup_locations: form.pickup_locations ?? [],
    }
    if (password.trim()) patch.password = password.trim()
    if (token.trim()) patch.token = token.trim()
    if (webhookSecret.trim()) patch.webhook_secret = webhookSecret.trim()

    updateMutation.mutate(patch, {
      onSuccess: (settings) => {
        setForm(settings)
        setSaved(settings)
        setPassword('')
        setToken('')
        setWebhookSecret('')
        toast({
          variant: 'success',
          title: t('Saved'),
          description: t('Shipping settings updated.'),
        })
      },
    })
  }

  const onTestConnection = () => {
    setTestMessage('')
    setTestFailed(false)
    testMutation.mutate(undefined, {
      onSuccess: (result) => {
        setTestMessage(
          `${t('Connected to {{url}}.', { url: result.base_url })}${result.token_generated ? ` ${t('Token verified.')}` : ` ${t('No token returned.')}`}`,
        )
      },
      onError: (e) => {
        setTestFailed(true)
        setTestMessage((e as Error).message)
      },
    })
  }

  const addPickupLocation = () => {
    const value = pickupDraft.trim()
    if (!value || pickupLocations.includes(value)) {
      return
    }
    set({ pickup_locations: [...pickupLocations, value] })
    setPickupDraft('')
  }

  const removePickupLocation = (name: string) =>
    set({ pickup_locations: pickupLocations.filter((l) => l !== name) })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{t('Shipping Settings')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('Connect Shiprocket to generate AWBs, schedule pickups and track parcels. Credentials are encrypted and never sent back to the browser.')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" /> {t('Shiprocket Connection')}
          </CardTitle>
          <CardDescription>
            {t('Turn shipping off to keep fulfilment in local (manual) mode without calling Shiprocket.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MethodRow
            title={t('Enable Shiprocket shipping')}
            description={t('When disabled, shipments are created in local mode with a placeholder tracking number.')}
            checked={form.enabled}
            onCheckedChange={(v) => set({ enabled: v })}
          />

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t('Environment')}</Label>
              <Select
                value={form.environment}
                onValueChange={(v) => set({ environment: v as ShiprocketSettings['environment'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select environment')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">{t('Test mode')}</SelectItem>
                  <SelectItem value="production">{t('Production')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("Test mode keeps you on Shiprocket's sandbox account.")}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>{t('API base URL')}</Label>
              <Input
                placeholder={form.base_url_default}
                value={form.base_url ?? ''}
                onChange={(e) => set({ base_url: e.target.value || null })}
              />
              <p className="text-xs text-muted-foreground">
                {t('Leave blank to use {{url}}.', { url: form.base_url_default })}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t('Account email')}</Label>
              <Input
                type="email"
                placeholder={t('ops@yourstore.com')}
                value={form.email ?? ''}
                onChange={(e) => set({ email: e.target.value || null })}
              />
              <p className="text-xs text-muted-foreground">
                {t('Used to request a bearer token when no token is stored.')}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>{t('Password')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="password"
                  placeholder={form.password_set ? '••••••••••••••••' : t('Not set')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <SecretStatus set={form.password_set} />
              </div>
              <p className="text-xs text-muted-foreground">{t('Leave blank to keep the stored password.')}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5" /> {t('API token')}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="password"
                placeholder={form.token_set ? '••••••••••••••••' : t('Not set')}
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <SecretStatus set={form.token_set} />
            </div>
            <p className="text-xs text-muted-foreground">
              {t('Optional. When set, the token is used instead of email + password authentication.')}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> {t('Webhook & Pickup')}
          </CardTitle>
          <CardDescription>
            {t('The webhook secret is required for inbound tracking updates. Pickup locations must match names registered on your Shiprocket account.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('Webhook secret')}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="password"
                placeholder={form.webhook_secret_set ? '••••••••••••••••' : t('Not set')}
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
              />
              <SecretStatus set={form.webhook_secret_set} />
            </div>
            <WebhookHint url={form.webhook_url} />
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {t('Default pickup location')}
            </Label>
            <Input
              placeholder={t('Primary')}
              value={form.default_pickup_location ?? ''}
              onChange={(e) => set({ default_pickup_location: e.target.value || null })}
            />
            <p className="text-xs text-muted-foreground">
              {t('Used on every new Shiprocket order unless the vendor has their own city on file.')}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>{t('Known pickup locations')}</Label>
            <div className="flex flex-wrap gap-2">
              {pickupLocations.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  {t('None saved yet. Add the names registered on your Shiprocket account.')}
                </span>
              ) : (
                pickupLocations.map((location) => (
                  <span
                    key={location}
                    className="inline-flex items-center gap-1 rounded-full border bg-muted px-2.5 py-1 text-xs font-medium"
                  >
                    {location}
                    <button
                      type="button"
                      aria-label={t('Remove {{name}}', { name: location })}
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removePickupLocation(location)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={t('Add a pickup location')}
                value={pickupDraft}
                onChange={(e) => setPickupDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addPickupLocation()
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addPickupLocation}>
                {t('Add')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5 text-primary" /> {t('Connection Check')}
          </CardTitle>
          <CardDescription>
            {t('Verify the stored credentials and fetch your live pickup locations from Shiprocket.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={onTestConnection} disabled={testMutation.isPending}>
              <Plug className="mr-1 h-4 w-4" />
              {testMutation.isPending ? t('Testing...') : t('Test Connection')}
            </Button>
            {testMessage && (
              <span className={testFailed ? 'text-sm text-destructive' : 'text-sm text-emerald-600'}>
                {testMessage}
              </span>
            )}
          </div>

          <PickupLocationSync
            enabled={useLivePickupList}
            onAdopt={(locations) => {
              set({ pickup_locations: locations })
              if (!form.default_pickup_location && locations[0]) {
                set({ default_pickup_location: locations[0] })
              }
            }}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={updateMutation.isPending || !dirty}>
          <Save className="mr-1 h-4 w-4" />
          {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}

function PickupLocationSync({
  enabled,
  onAdopt,
}: {
  enabled: boolean
  onAdopt: (locations: string[]) => void
}) {
  const { t } = useTranslation()
  const { data, isFetching, error, refetch } = useAdminShiprocketPickupLocations(enabled)

  if (!enabled) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('Pickup locations are already configured. Remove them all to sync live from Shiprocket again.')}
      </p>
    )
  }

  const names = (data ?? []).map((location) => locationName(location)).filter(Boolean)

  return (
    <div className="rounded-lg border bg-muted/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium">
          <RefreshCw className={isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          {t('Live pickup locations')}
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {t('Refresh')}
        </Button>
      </div>

      {error ? (
        <p className="mt-2 text-sm text-destructive">
          {(error as Error).message || t('Unable to reach Shiprocket. Check the credentials above.')}
        </p>
      ) : names.length > 0 ? (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('{{count}} location(s) found on your Shiprocket account.', { count: names.length })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {names.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs font-medium"
              >
                <Package className="h-3 w-3" />
                {name}
              </span>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => onAdopt(names)}>
            {t('Use these locations')}
          </Button>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          {isFetching ? t('Loading locations...') : t('No pickup locations found on this Shiprocket account.')}
        </p>
      )}
    </div>
  )
}

function MethodRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function SecretStatus({ set }: { set: boolean }) {
  const { t } = useTranslation()
  return set ? (
    <span className="inline-flex shrink-0 items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
      <CheckCircle2 className="h-3 w-3" /> {t('Set')}
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
      <XCircle className="h-3 w-3" /> {t('Not set')}
    </span>
  )
}

function WebhookHint({ url }: { url: string }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  return (
    <div className="flex flex-wrap items-center gap-2 rounded border bg-muted/40 px-2.5 py-2">
      <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
      <code className="flex-1 truncate text-xs">{url}</code>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          void navigator.clipboard?.writeText(url)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
      >
        {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? t('Copied') : t('Copy')}
      </Button>
      <a
        href="https://app.shiprocket.in/settings/api"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        {t('Shiprocket webhook docs')}
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  )
}

function locationName(location: ShiprocketPickupLocation): string {
  return location.pickup_location ?? location.name ?? ''
}

function sanitize(s: ShiprocketSettings): Omit<
  ShiprocketSettings,
  | 'id'
  | 'base_url_default'
  | 'password_set'
  | 'token_set'
  | 'webhook_secret_set'
  | 'webhook_url'
> {
  return {
    enabled: s.enabled,
    environment: s.environment,
    base_url: s.base_url ?? null,
    email: s.email ?? null,
    default_pickup_location: s.default_pickup_location ?? null,
    pickup_locations: s.pickup_locations ?? [],
  }
}