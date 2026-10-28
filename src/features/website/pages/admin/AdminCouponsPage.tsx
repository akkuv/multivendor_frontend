import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  CalendarClock,
  Eye,
  Pencil,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Ticket,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
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
  createAdminCoupon,
  deleteAdminCoupon,
  getAdminCategories,
  getAdminCoupon,
  getAdminCoupons,
  getAdminProducts,
  getAdminVendors,
  getCouponHistory,
  getCouponUsage,
  toggleAdminCoupon,
  updateAdminCoupon,
} from '@/services/admin'
import { getAdminBrands } from '@/services/catalog'
import { ApiError, ConfirmDialog, FormField, PaginationFooter } from '@/components/common/admin'
import { formatCurrency, formatDate } from '@/utils/format'
import type { Coupon, CouponPayload } from '@/types'
import { useTranslation } from 'react-i18next'

function intOrNull(value: FormDataEntryValue | null): number | null {
  const s = String(value ?? '').trim()
  return s === '' ? null : Number(s)
}

function strOrNull(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? '').trim()
  return s === '' ? null : s
}

function couponState(coupon: Pick<Coupon, 'is_active' | 'expires_at'>): {
  label: string
  className: string
} {
  if (!coupon.is_active) {
    return {
      label: 'Inactive',
      className: 'bg-slate-100 text-slate-600 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400',
    }
  }
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    return {
      label: 'Expired',
      className: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400',
    }
  }
  return {
    label: 'Active',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400',
  }
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
  icon: typeof Ticket
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

interface RestrictionOption {
  id: number
  label: string
}

function RestrictionGroup({
  title,
  options,
  value,
  onChange,
}: {
  title: string
  options: RestrictionOption[]
  value: number[]
  onChange: (next: number[]) => void
}) {
  const { t } = useTranslation()
  const toggleOption = (id: number) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  return (
    <div className="rounded-lg border p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title} <span className="font-normal normal-case">({t('{{count}} selected', { count: value.length })})</span>
      </p>
      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t('No options available.')}</p>
      ) : (
        <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
          {options.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted/60"
            >
              <input
                type="checkbox"
                checked={value.includes(option.id)}
                onChange={() => toggleOption(option.id)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="truncate">{t(option.label)}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function CouponFormDialog({
  detail,
  vendors,
  products,
  brands,
  categories,
  isSaving,
  error,
  onSave,
}: {
  detail: Coupon | null
  vendors: RestrictionOption[]
  products: RestrictionOption[]
  brands: RestrictionOption[]
  categories: RestrictionOption[]
  isSaving: boolean
  error: unknown
  onSave: (payload: CouponPayload) => void
}) {
  const { t } = useTranslation()
  const editing = detail !== null
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED'>(detail?.type ?? 'PERCENTAGE')
  const [vendorId, setVendorId] = useState(detail?.vendor_id ? String(detail.vendor_id) : 'all')
  const [firstOrderOnly, setFirstOrderOnly] = useState(Boolean(detail?.first_order_only))
  const [isActive, setIsActive] = useState(detail?.is_active ?? true)
  const [productIds, setProductIds] = useState<number[]>(detail?.product_ids ?? [])
  const [categoryIds, setCategoryIds] = useState<number[]>(detail?.category_ids ?? [])
  const [brandIds, setBrandIds] = useState<number[]>(detail?.brand_ids ?? [])
  const [vendorIds, setVendorIds] = useState<number[]>(detail?.vendor_ids ?? [])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    onSave({
      code: String(fd.get('code') ?? '').trim().toUpperCase(),
      type,
      value: Number(fd.get('value') ?? 0),
      min_amount: Number(fd.get('min_amount') ?? 0) || 0,
      max_discount: type === 'PERCENTAGE' ? intOrNull(fd.get('max_discount')) : null,
      starts_at: strOrNull(fd.get('starts_at')),
      expires_at: strOrNull(fd.get('expires_at')),
      usage_limit: intOrNull(fd.get('usage_limit')),
      per_user_limit: intOrNull(fd.get('per_user_limit')),
      first_order_only: firstOrderOnly,
      is_active: isActive,
      vendor_id: vendorId === 'all' ? null : Number(vendorId),
      product_ids: productIds,
      category_ids: categoryIds,
      brand_ids: brandIds,
      vendor_ids: vendorIds,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label={t('Coupon Code')}>
          <Input
            name="code"
            required
            defaultValue={detail?.code ?? ''}
            placeholder={t('e.g. FLAT200')}
            className="font-mono uppercase"
          />
        </FormField>
        <FormField label={t('Type')}>
          <Select value={type} onValueChange={(v) => setType(v as 'PERCENTAGE' | 'FIXED')}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENTAGE">{t('Percentage (%)')}</SelectItem>
              <SelectItem value="FIXED">{t('Fixed amount (₹)')}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label={type === 'PERCENTAGE' ? 'Discount (%)' : 'Discount (₹)'}>
          <Input
            name="value"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={detail?.value ?? ''}
            placeholder={type === 'PERCENTAGE' ? t('e.g. 15') : t('e.g. 200')}
          />
        </FormField>
        <FormField label={t('Min Order Value')}>
          <Input
            name="min_amount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={detail?.min_amount ?? ''}
            placeholder={t('e.g. 999')}
          />
        </FormField>
        {type === 'PERCENTAGE' && (
          <FormField label={t('Max Discount (₹)')}>
            <Input
              name="max_discount"
              type="number"
              step="0.01"
              min="0"
              defaultValue={detail?.max_discount ?? ''}
              placeholder={t('e.g. 500')}
            />
          </FormField>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label={t('Starts At')}>
          <Input
            name="starts_at"
            type="datetime-local"
            defaultValue={detail?.starts_at ? detail.starts_at.slice(0, 16) : ''}
          />
        </FormField>
        <FormField label={t('Expires At')}>
          <Input
            name="expires_at"
            type="datetime-local"
            defaultValue={detail?.expires_at ? detail.expires_at.slice(0, 16) : ''}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label={t('Usage Limit')}>
          <Input
            name="usage_limit"
            type="number"
            min="1"
            defaultValue={detail?.usage_limit ?? ''}
            placeholder={t('Leave blank for unlimited')}
          />
        </FormField>
        <FormField label={t('Per-User Limit')}>
          <Input
            name="per_user_limit"
            type="number"
            min="1"
            defaultValue={detail?.per_user_limit ?? ''}
            placeholder={t('e.g. 1')}
          />
        </FormField>
      </div>

      <FormField label={t('Store')}>
        <Select value={vendorId} onValueChange={setVendorId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('Platform-wide')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('Platform-wide (all stores)')}</SelectItem>
            {vendors.map((v) => (
              <SelectItem key={v.id} value={String(v.id)}>
                {t(v.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={firstOrderOnly} onCheckedChange={setFirstOrderOnly} />
          {t('First order only')}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={isActive} onCheckedChange={setIsActive} />
          {t('Active')}
        </label>
      </div>

      <details className="rounded-lg border p-3 text-sm">
        <summary className="cursor-pointer font-medium text-muted-foreground">
          Restrictions (products, categories, brands, stores)
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <RestrictionGroup
            title={t('Vendors')}
            options={vendors}
            value={vendorIds}
            onChange={setVendorIds}
          />
          <RestrictionGroup
            title={t('Categories')}
            options={categories}
            value={categoryIds}
            onChange={setCategoryIds}
          />
          <RestrictionGroup title={t('Brands')} options={brands} value={brandIds} onChange={setBrandIds} />
          <RestrictionGroup
            title={t('Products')}
            options={products}
            value={productIds}
            onChange={setProductIds}
          />
        </div>
      </details>

      {error ? (
        <p className="text-sm text-destructive">
          {String((error as { message?: unknown }).message ?? 'Failed to save coupon.')}
        </p>
      ) : null}

      <DialogFooter>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : editing ? 'Save Changes' : 'Create Coupon'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function AdminCouponsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [activeFilter, setActiveFilter] = useState('ALL')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<Coupon | null>(null)
  const [usageFor, setUsageFor] = useState<Coupon | null>(null)
  const [usagePage, setUsagePage] = useState(1)

  const stats = useQuery({
    queryKey: ['admin', 'coupons-stats'],
    queryFn: () => getAdminCoupons({ per_page: 500 }),
  })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'coupons', debounced, typeFilter, activeFilter, page],
    queryFn: () =>
      getAdminCoupons({
        search: debounced || undefined,
        type: typeFilter === 'ALL' ? undefined : typeFilter,
        is_active: activeFilter === 'ALL' ? undefined : activeFilter === 'ACTIVE',
        page,
        per_page: 10,
      }),
  })

  const detail = useQuery({
    queryKey: ['admin', 'coupon-detail', editingId],
    queryFn: () => getAdminCoupon(editingId as number),
    enabled: editingId !== null && formOpen,
  })

  const vendors = useQuery({
    queryKey: ['admin', 'vendors-coupons'],
    queryFn: () => getAdminVendors({ per_page: 100 }),
    enabled: formOpen,
  })
  const products = useQuery({
    queryKey: ['admin', 'products-coupons'],
    queryFn: () => getAdminProducts({ per_page: 100 }),
    enabled: formOpen,
  })
  const brands = useQuery({
    queryKey: ['admin', 'brands-coupons'],
    queryFn: () => getAdminBrands({ per_page: 100 }),
    enabled: formOpen,
  })
  const categories = useQuery({
    queryKey: ['admin', 'categories-coupons'],
    queryFn: () => getAdminCategories(),
    enabled: formOpen,
  })

  const usage = useQuery({
    queryKey: ['admin', 'coupon-usage', usageFor?.id],
    queryFn: () => getCouponUsage(usageFor!.id),
    enabled: usageFor !== null,
  })
  const history = useQuery({
    queryKey: ['admin', 'coupon-history', usageFor?.id, usagePage],
    queryFn: () => getCouponHistory(usageFor!.id, usagePage),
    enabled: usageFor !== null,
  })

  const all = useMemo(() => stats.data?.data ?? [], [stats.data])
  const counts = useMemo(() => {
    // oxlint-disable-next-line react/purity -- clock is intentionally time-based
    const now = Date.now()
    let activeCount = 0
    let expiredCount = 0
    for (const coupon of all) {
      if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) {
        expiredCount += 1
      } else if (coupon.is_active) {
        activeCount += 1
      }
    }
    const redemptions = all.reduce((sum, coupon) => sum + (coupon.used_count ?? 0), 0)
    return { total: all.length, active: activeCount, expired: expiredCount, redemptions }
  }, [all])

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'coupons-stats'] })
  }

  const createMutation = useMutation({
    mutationFn: createAdminCoupon,
    onSuccess: () => {
      setFormOpen(false)
      refresh()
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CouponPayload }) => updateAdminCoupon(id, data),
    onSuccess: () => {
      setFormOpen(false)
      refresh()
    },
  })
  const toggleMutation = useMutation({ mutationFn: toggleAdminCoupon, onSuccess: refresh })
  const deleteMutation = useMutation({
    mutationFn: deleteAdminCoupon,
    onSuccess: () => {
      setDeleting(null)
      refresh()
    },
  })

  const openCreate = () => {
    setEditingId(null)
    setFormOpen(true)
  }

  const openEdit = (coupon: Coupon) => {
    setEditingId(coupon.id)
    setFormOpen(true)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const saveError = createMutation.error || updateMutation.error

  const openUsage = (coupon: Coupon) => {
    setUsageFor(coupon)
    setUsagePage(1)
  }

  const vendorOptions = useMemo(
    () => vendors.data?.data.map((v) => ({ id: v.id, label: v.store_name })) ?? [],
    [vendors.data],
  )
  const productOptions = useMemo(
    () => products.data?.data.map((p) => ({ id: p.id, label: p.name })) ?? [],
    [products.data],
  )
  const brandOptions = useMemo(
    () => brands.data?.data.map((b) => ({ id: b.id, label: b.name })) ?? [],
    [brands.data],
  )
  const categoryOptions = useMemo(
    () => categories.data?.data.map((c) => ({ id: c.id, label: c.name })) ?? [],
    [categories.data],
  )

  const filterActive = debounced || typeFilter !== 'ALL' || activeFilter !== 'ALL'

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-600 via-amber-600 to-amber-700 p-6 text-white shadow-xl sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-orange-400/30 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <div className="flex items-center gap-2 text-sm font-medium text-white/80">
              <span className="flex h-6 items-center gap-1.5 rounded-full bg-white/20 px-3 text-xs font-semibold backdrop-blur">
                <Ticket className="h-3.5 w-3.5" />
                {t('Discounts')}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{t('Coupons')}</h1>
            <p className="mt-1.5 text-sm text-white/80">
              {t('Create and manage discount coupons across the marketplace.')}
            </p>
          </div>
          <Button
            size="sm"
            className="bg-white text-yellow-700 hover:bg-yellow-50"
            onClick={openCreate}
          >
            <Plus className="mr-1 h-4 w-4" /> {t('Add Coupon')}
          </Button>
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
            label={t('Total Coupons')}
            value={counts.total}
            sub="Across all stores"
            icon={Ticket}
            gradient="from-yellow-400 to-amber-600"
            iconClass="bg-yellow-100 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-400"
          />
          <StatCard
            label={t('Active')}
            value={counts.active}
            sub="Valid right now"
            icon={Percent}
            gradient="from-emerald-400 to-teal-600"
            iconClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
          />
          <StatCard
            label={t('Expired')}
            value={counts.expired}
            sub="Past end date"
            icon={CalendarClock}
            gradient="from-rose-400 to-red-600"
            iconClass="bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
          />
          <StatCard
            label={t('Redemptions')}
            value={counts.redemptions}
            sub="Total times used"
            icon={RefreshCw}
            gradient="from-amber-400 to-orange-500"
            iconClass="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
          />
        </div>
      )}

      <Card className="overflow-hidden border-transparent bg-white/70 shadow-sm backdrop-blur dark:bg-card/70">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold">{t('All Coupons')}</h2>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} title={t('Refresh')}>
            <RefreshCw className="mr-1 h-4 w-4" /> {t('Refresh')}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b px-5 py-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t('Search by code...')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
                window.setTimeout(() => setDebounced(e.target.value), 300)
              }}
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('All types')}</SelectItem>
              <SelectItem value="PERCENTAGE">{t('Percentage')}</SelectItem>
              <SelectItem value="FIXED">{t('Fixed amount')}</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={activeFilter}
            onValueChange={(v) => {
              setActiveFilter(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('Any status')}</SelectItem>
              <SelectItem value="ACTIVE">{t('Active')}</SelectItem>
              <SelectItem value="INACTIVE">{t('Inactive')}</SelectItem>
            </SelectContent>
          </Select>
          {filterActive && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDebounced('')
                setSearch('')
                setTypeFilter('ALL')
                setActiveFilter('ALL')
                setPage(1)
              }}
            >
              <X className="mr-1 h-4 w-4" /> {t('Clear')}
            </Button>
          )}
        </div>

        <div>
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <ApiError error={{ message: t('Could not load coupons.') }} onRetry={refetch} />
          ) : data && data.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">{t('Code')}</th>
                    <th className="px-5 py-3 font-medium">{t('Discount')}</th>
                    <th className="px-5 py-3 font-medium">{t('Min Spend')}</th>
                    <th className="px-5 py-3 font-medium">{t('Usage')}</th>
                    <th className="px-5 py-3 font-medium">{t('Valid Until')}</th>
                    <th className="px-5 py-3 font-medium">{t('Store')}</th>
                    <th className="px-5 py-3 font-medium">{t('Status')}</th>
                    <th className="px-5 py-3 text-right font-medium">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((coupon) => {
                    const state = couponState(coupon)
                    return (
                      <tr key={coupon.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-5 py-3">
                          <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold tracking-wide">
                            {coupon.code}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-semibold">
                          {coupon.type === 'PERCENTAGE'
                            ? `${coupon.value}%`
                            : formatCurrency(coupon.value)}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {coupon.min_amount ? formatCurrency(coupon.min_amount) : '—'}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-muted-foreground">
                            {coupon.used_count}
                            {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                          </span>
                          {coupon.usage_limit !== null && coupon.usage_limit > 0 && (
                            <span className="ml-2 text-xs text-muted-foreground/70">
                              {Math.round(((coupon.used_count ?? 0) / coupon.usage_limit) * 100)}%
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {coupon.expires_at ? formatDate(coupon.expires_at) : 'No expiry'}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {coupon.vendor_id ? `Store ${coupon.vendor_id}` : 'Platform-wide'}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ring-inset ${state.className}`}
                          >
                            {t(state.label)}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Switch
                              checked={coupon.is_active}
                              disabled={toggleMutation.isPending}
                              onCheckedChange={() => toggleMutation.mutate(coupon.id)}
                              title={coupon.is_active ? 'Disable coupon' : 'Enable coupon'}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              title={t('View usage')}
                              onClick={() => openUsage(coupon)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title={t('Edit')}
                              onClick={() => openEdit(coupon)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              title={t('Delete')}
                              onClick={() => setDeleting(coupon)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60">
                <Ticket className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium">
                {filterActive ? 'No matching coupons' : 'No coupons yet'}
              </p>
              <p className="text-sm text-muted-foreground">
                {filterActive
                  ? 'Try adjusting your search or filters.'
                  : 'Create your first coupon to start offering discounts.'}
              </p>
            </div>
          )}
        </div>

        {data && data.total > 0 && (
          <div className="border-t px-5 py-3">
            <PaginationFooter data={data} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId !== null ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
            <DialogDescription>
              {editingId !== null
                ? 'Update the coupon details and restrictions below.'
                : 'Fill in the details to create a new discount coupon.'}
            </DialogDescription>
          </DialogHeader>
          {editingId !== null && detail.isLoading && !detail.data ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <CouponFormDialog
              key={editingId ?? 'create'}
              detail={editingId !== null ? (detail.data ?? null) : null}
              vendors={vendorOptions}
              products={productOptions}
              brands={brandOptions}
              categories={categoryOptions}
              isSaving={isSaving}
              error={saveError}
              onSave={(payload) => {
                if (editingId !== null) {
                  updateMutation.mutate({ id: editingId, data: payload })
                } else {
                  createMutation.mutate(payload)
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={usageFor !== null} onOpenChange={(open) => !open && setUsageFor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {usageFor ? (
                <>
                  <span className="mr-2 rounded-md bg-muted px-2 py-0.5 font-mono text-sm font-semibold">
                    {usageFor.code}
                  </span>
                  {t('Usage')}
                </>
              ) : (
                'Coupon Usage'
              )}
            </DialogTitle>
            <DialogDescription>{t('Redemption statistics and history.')}</DialogDescription>
          </DialogHeader>

          {usage.isLoading || history.isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : usage.error ? (
            <ApiError error={{ message: t('Could not load coupon usage.') }} />
          ) : usage.data ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('Redemptions')}
                  </p>
                  <p className="mt-1 text-xl font-extrabold">{usage.data.redeemed_count}</p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('Users')}
                  </p>
                  <p className="mt-1 text-xl font-extrabold">{usage.data.distinct_users}</p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('Total Discount')}
                  </p>
                  <p className="mt-1 text-xl font-extrabold">
                    {formatCurrency(usage.data.total_discount)}
                  </p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('Remaining')}
                  </p>
                  <p className="mt-1 text-xl font-extrabold">
                    {usage.data.remaining === null ? '∞' : usage.data.remaining}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-2 text-sm font-semibold">{t('Redemption History')}</p>
                {history.data && history.data.data.length > 0 ? (
                  <ul className="divide-y divide-border/60 rounded-lg border">
                    {history.data.data.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {item.user?.name ?? 'Unknown customer'}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {item.order_number
                              ? `Order ${item.order_number} · ${formatDate(item.created_at)}`
                              : formatDate(item.created_at)}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-emerald-600">
                          −{formatCurrency(item.discount_amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-lg border py-8 text-center text-sm text-muted-foreground">
                    {t('This coupon has not been redeemed yet.')}
                  </p>
                )}
              </div>

              {history.data && history.data.total > 0 && (
                <PaginationFooter data={history.data} onPageChange={setUsagePage} />
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t('Delete Coupon')}
        description={`Delete coupon "${deleting?.code}"? This will permanently remove it and its usage history.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        error={deleteMutation.error?.message ?? null}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  )
}