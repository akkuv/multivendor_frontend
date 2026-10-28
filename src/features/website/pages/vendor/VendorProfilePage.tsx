import { useEffect, useState } from 'react'
import { assetUrl } from '@/lib/assets'
import {
  BadgeCheck,
  Building2,
  Globe,
  Hash,
  Mail,
  MapPin,
  Package,
  Percent,
  Save,
  Store,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { FormField, ApiError, ImageField } from '@/components/common/admin'
import { RatingStars } from '@/components/common/RatingStars'
import { useUpdateVendorProfile, useVendorProfile } from '@/hooks/useVendor'
import { cn } from '@/utils/cn'
import { useTranslation } from 'react-i18next'

const STATUS_CONFIG: Record<string, { chip: string; dot: string; label: string }> = {
  APPROVED: {
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    label: 'Approved',
  },
  PENDING: {
    chip: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400',
    dot: 'bg-amber-500',
    label: 'Pending approval',
  },
  REJECTED: {
    chip: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400',
    dot: 'bg-rose-500',
    label: 'Rejected',
  },
  SUSPENDED: {
    chip: 'bg-slate-100 text-slate-700 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400',
    dot: 'bg-slate-500',
    label: 'Suspended',
  },
  INACTIVE: {
    chip: 'bg-slate-100 text-slate-700 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400',
    dot: 'bg-slate-500',
    label: 'Inactive',
  },
}

function errorMessage(err: unknown) {
  return typeof err === 'object' && err !== null && 'message' in err
    ? String((err as { message: unknown }).message)
    : null
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Hash
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-semibold">{value || '—'}</p>
      </div>
    </div>
  )
}

export function VendorProfilePage() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useVendorProfile()
  const updateMutation = useUpdateVendorProfile()

  const [form, setForm] = useState({
    store_name: '',
    description: '',
    logo: '',
    banner: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    gstin: '',
  })

  useEffect(() => {
    if (data) {
      setForm({
        store_name: data.store_name ?? '',
        description: data.description ?? '',
        logo: data.logo ?? '',
        banner: data.banner ?? '',
        address_line1: data.address_line1 ?? '',
        address_line2: data.address_line2 ?? '',
        city: data.city ?? '',
        state: data.state ?? '',
        country: data.country ?? '',
        pincode: data.pincode ?? '',
        gstin: data.gstin ?? '',
      })
    }
  }, [data])

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({
      store_name: form.store_name || undefined,
      description: form.description || null,
      logo: form.logo || null,
      banner: form.banner || null,
      address_line1: form.address_line1 || undefined,
      address_line2: form.address_line2 || null,
      city: form.city || undefined,
      state: form.state || undefined,
      country: form.country || undefined,
      pincode: form.pincode || undefined,
      gstin: form.gstin || null,
    })
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (isError) {
    return <ApiError error={{ message: t('Could not load profile.') }} onRetry={refetch} />
  }

  const status = STATUS_CONFIG[data.status] ?? STATUS_CONFIG.INACTIVE
  const location = [form.city, form.state, form.country].filter(Boolean).join(', ') || '—'

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 p-6 text-white shadow-xl sm:p-8">
        {(data.banner || form.banner) ? (
          <img
            src={assetUrl(form.banner ?? data.banner ?? undefined)}
            alt={t('Store banner')}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="flex items-end gap-4">
            {form.logo || data.logo ? (
              <img
                src={assetUrl(form.logo ?? data.logo ?? undefined)}
                alt={t('Store logo')}
                className="h-20 w-20 rounded-2xl border-4 border-white/30 object-cover shadow-lg sm:h-24 sm:w-24"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white/30 bg-white/15 backdrop-blur sm:h-24 sm:w-24">
                <Store className="h-10 w-10 text-white" />
              </div>
            )}
            <div className="pb-0.5">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset backdrop-blur',
                  status.chip,
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                {status.label}
              </span>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                {form.store_name || 'Your store'}
              </h1>
              <p className="text-sm text-white/75">@{data.slug}</p>
            </div>
          </div>
          <div className="relative z-10 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              <Percent className="h-3.5 w-3.5" /> Commission {data.commission_rate ?? 0}%
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              <Package className="h-3.5 w-3.5" /> {data.products_count ?? 0} products
            </span>
            {data.rating_avg != null && data.rating_avg > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                <RatingStars value={data.rating_avg} readonly size={13} className="[&_svg]:text-white" />
                <span>{data.rating_avg.toFixed(1)}</span>
                <span className="text-white/70">({data.rating_count ?? 0})</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-6">
          <Card className="overflow-hidden border-transparent bg-white/70 shadow-sm backdrop-blur dark:bg-card/70">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-primary" /> {t('About the store')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <Fact
                icon={Hash}
                label={t('Store ID')}
                value={form.store_name ? `#${data.id}` : '—'}
              />
              <Fact icon={Globe} label={t('Website slug')} value={`@${data.slug}`} />
              <Fact
                icon={Percent}
                label={t('Commission rate')}
                value={`${data.commission_rate ?? 0}%`}
              />
              <Fact
                icon={Package}
                label={t('Products')}
                value={String(data.products_count ?? 0)}
              />
              <Fact
                icon={Mail}
                label={t('Contact email')}
                value={data.user?.email ?? '—'}
              />
              {data.description ? (
                <div className="rounded-xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
                  {data.description}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-transparent bg-white/70 shadow-sm backdrop-blur dark:bg-card/70">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BadgeCheck className="h-4 w-4 text-primary" /> {t('Registered details')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <Fact icon={MapPin} label={t('Location')} value={location} />
              {data.gstin ? (
                <Fact icon={Hash} label={t('GSTIN')} value={data.gstin} />
              ) : (
                <Fact icon={Hash} label={t('GSTIN')} value={t('Not provided')} />
              )}
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="overflow-hidden border-transparent bg-white/70 shadow-sm backdrop-blur dark:bg-card/70">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Store className="h-5 w-5 text-primary" /> {t('Store Details')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                <FormField label={t('Store name')}>
                  <Input value={form.store_name} onChange={set('store_name')} placeholder={t('My Store')} />
                </FormField>
                <FormField label={t('GSTIN')}>
                  <Input value={form.gstin} onChange={set('gstin')} placeholder={t('GST number')} />
                </FormField>
                <ImageField label={t('Logo URL')} value={form.logo} onChange={(v) => setForm((prev) => ({ ...prev, logo: v }))} placeholder="https://..." />
                <ImageField label={t('Banner URL')} value={form.banner} onChange={(v) => setForm((prev) => ({ ...prev, banner: v }))} placeholder="https://..." />
                <div className="sm:col-span-2">
                  <FormField label={t('Description')}>
                    <Textarea
                      value={form.description}
                      onChange={set('description')}
                      rows={4}
                      placeholder={t('Describe your store...')}
                    />
                  </FormField>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-transparent bg-white/70 shadow-sm backdrop-blur dark:bg-card/70">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-5 w-5 text-primary" /> {t('Business Address')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                <FormField label={t('Address line 1')}>
                  <Input
                    value={form.address_line1}
                    onChange={set('address_line1')}
                    placeholder={t('Street address')}
                  />
                </FormField>
                <FormField label={t('Address line 2')}>
                  <Input
                    value={form.address_line2}
                    onChange={set('address_line2')}
                    placeholder={t('Apartment, suite, etc.')}
                  />
                </FormField>
                <FormField label={t('City')}>
                  <Input value={form.city} onChange={set('city')} placeholder={t('City')} />
                </FormField>
                <FormField label={t('State')}>
                  <Input value={form.state} onChange={set('state')} placeholder={t('State')} />
                </FormField>
                <FormField label={t('Country')}>
                  <Input value={form.country} onChange={set('country')} placeholder={t('Country')} />
                </FormField>
                <FormField label={t('Pincode')}>
                  <Input value={form.pincode} onChange={set('pincode')} placeholder={t('Pincode')} />
                </FormField>
              </CardContent>
            </Card>

            <div className="sticky bottom-4 z-10 rounded-2xl border border-primary/15 bg-background/90 p-4 shadow-lg backdrop-blur">
              {updateMutation.isSuccess ? (
                <p className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <BadgeCheck className="h-3.5 w-3.5" /> {t('Profile updated successfully.')}
                </p>
              ) : updateMutation.isError ? (
                <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                  {errorMessage(updateMutation.error)}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {t('Changes are applied to your storefront in real time.')}
                </p>
                <Button type="submit" disabled={updateMutation.isPending} className="gap-2">
                  <Save className="h-4 w-4" />
                  {updateMutation.isPending ? 'Saving...' : 'Save changes'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}