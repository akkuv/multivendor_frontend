import { useState, type ComponentProps, type ComponentType, type ReactNode } from 'react'
import { assetUrl } from '@/lib/assets'
import {
  BarChart3,
  CalendarDays,
  Eye,
  FileText,
  Globe,
  IndianRupee,
  Landmark,
  Lock,
  Mail,
  MapPin,
  Package,
  Percent,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Store,
  User as UserIcon,
  Wallet,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { FormField } from '@/components/common/admin'
import {
  useAdminVendors,
  useCreateAdminVendor,
  useApproveVendor,
  useUpdateAdminVendor,
  useVendorAction,
  useAdminVendor,
} from '@/hooks/useAdmin'
import { useDebouncedUrlFilter, useUrlFilters } from '@/hooks/useUrlFilters'
import { formatCurrency, formatDate } from '@/utils/format'
import type { User, Vendor } from '@/types'
import type { VendorDetail } from '@/services/admin'
import { useTranslation } from 'react-i18next'

type AdminVendorRow = Omit<VendorDetail, 'user'> & {
  user?: Pick<User, 'id' | 'name' | 'email' | 'phone' | 'is_active'>
  created_at: string
}

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  APPROVED: 'success',
  PENDING: 'warning',
  SUSPENDED: 'destructive',
  REJECTED: 'destructive',
  INACTIVE: 'secondary',
}

function VendorStatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_VARIANTS[status] ?? 'secondary'}>{status}</Badge>
}

function IconInput({ icon: Icon, ...props }: ComponentProps<'input'> & { icon: typeof Mail }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input className="pl-8" {...props} />
    </div>
  )
}

function CreateVendorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useTranslation()
  const create = useCreateAdminVendor()
  const [form, setForm] = useState({ name: '', email: '', password: '', store_name: '', commission_rate: '' })
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  const submit = () => {
    const next: Record<string, string | undefined> = {}
    if (!form.name.trim()) next.name = 'Owner name is required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Enter a valid email'
    }
    if (!form.password) next.password = 'Password is required'
    else if (form.password.length < 8) next.password = 'Password must be at least 8 characters'
    if (!form.store_name.trim()) next.store_name = 'Store name is required'
    if (form.commission_rate && (Number(form.commission_rate) < 0 || Number(form.commission_rate) > 100)) {
      next.commission_rate = 'Commission rate must be between 0 and 100'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return

    create.mutate(
      {
        name: form.name,
        email: form.email,
        password: form.password,
        store_name: form.store_name,
        commission_rate: form.commission_rate ? Number(form.commission_rate) : undefined,
      },
      {
        onSuccess: () => {
          setForm({ name: '', email: '', password: '', store_name: '', commission_rate: '' })
          setErrors({})
          onOpenChange(false)
        },
        onError: (error) => {
          const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data
          const fieldMessage = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined
          setErrors({ form: fieldMessage ?? (error as Error).message })
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('Create Vendor')}</DialogTitle>
          <DialogDescription>{t('Create a new vendor account. It will start as pending approval.')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <FormField label={t('Owner Name')} error={errors.name}>
            <IconInput
              icon={UserIcon}
              placeholder={t('Full name of the vendor owner')}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </FormField>
          <FormField label={t('Email')} error={errors.email}>
            <IconInput
              icon={Mail}
              type="email"
              placeholder="vendor@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </FormField>
          <FormField label={t('Password')} error={errors.password}>
            <IconInput
              icon={Lock}
              type="password"
              placeholder={t('Minimum 8 characters')}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </FormField>
          <FormField label={t('Store Name')} error={errors.store_name}>
            <IconInput
              icon={Store}
              placeholder={t('e.g. Sharma Traders')}
              value={form.store_name}
              onChange={(e) => setForm({ ...form, store_name: e.target.value })}
            />
          </FormField>
          <FormField label={t('Commission Rate (%)')} error={errors.commission_rate}>
            <IconInput
              icon={Percent}
              type="number"
              min={0}
              max={100}
              placeholder="0 - 100"
              value={form.commission_rate}
              onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
            />
          </FormField>
          {errors.form ? <p className="text-sm text-destructive">{errors.form}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending ? 'Creating...' : 'Create Vendor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function VendorActions({ vendor, onView }: { vendor: Vendor; onView: () => void }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(vendor.status)
  const [commission, setCommission] = useState(vendor.commission_rate ? String(vendor.commission_rate) : '')
  const [error, setError] = useState<string>()
  const approve = useApproveVendor()
  const activate = useVendorAction('activate')
  const suspend = useVendorAction('suspend')
  const reject = useVendorAction('reject')

  const openDialog = () => {
    setStatus(vendor.status)
    setCommission(vendor.commission_rate ? String(vendor.commission_rate) : '')
    setError(undefined)
    setOpen(true)
  }

  const save = () => {
    const rate = commission.trim() === '' ? undefined : Number(commission)
    if (rate !== undefined && (Number.isNaN(rate) || rate < 0 || rate > 100)) {
      setError('Commission rate must be a number between 0 and 100.')
      return
    }
    setError(undefined)
    approve.mutate(
      { id: vendor.id, data: { status, commission_rate: rate } },
      {
        onSuccess: () => setOpen(false),
        onError: (e) => {
          const data = (e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data
          setError(data?.errors ? Object.values(data.errors)[0][0] : (e as Error).message)
        },
      },
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <Button size="sm" variant="outline" onClick={onView}>
        <Eye className="mr-1 h-3.5 w-3.5" /> {t('View')}
      </Button>
      <Button size="sm" variant="outline" onClick={openDialog}>
        {t('Set Status')}
      </Button>
      <EditVendorDetailsDialog vendor={vendor} />
      {vendor.status === 'SUSPENDED' && (
        <Button size="sm" variant="ghost" className="text-emerald-600" onClick={() => activate.mutate(vendor.id)}>
          {t('Activate')}
        </Button>
      )}
      {vendor.status === 'APPROVED' && (
        <Button size="sm" variant="ghost" className="text-amber-600" onClick={() => suspend.mutate(vendor.id)}>
          {t('Suspend')}
        </Button>
      )}
      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => reject.mutate(vendor.id)}>
        {t('Reject')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update {vendor.store_name}</DialogTitle>
            <DialogDescription>{t('Set approval status and optional commission rate.')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none">{t('Status')}</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROVED">{t('Approve')}</SelectItem>
                  <SelectItem value="PENDING">{t('Hold (Pending)')}</SelectItem>
                  <SelectItem value="SUSPENDED">{t('Suspend')}</SelectItem>
                  <SelectItem value="REJECTED">{t('Reject')}</SelectItem>
                  <SelectItem value="INACTIVE">{t('Inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none">{t('Commission Rate (%)')}</label>
              <Input
                placeholder="0 - 100"
                type="number"
                min={0}
                max={100}
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
              />
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t('Cancel')}</Button>
            <Button onClick={save} disabled={approve.isPending}>
              {approve.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function VendorDetailItem({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

function VendorStatCard({ icon: Icon, iconClass, label, value }: { icon: ComponentType<{ className?: string }>; iconClass?: string; label: string; value: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconClass ?? 'bg-primary/10'}`}>
          <Icon className={`h-5 w-5 ${iconClass ? undefined : 'text-primary'}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="truncate text-xl font-bold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function VendorDetailDialog({ id, onOpenChange }: { id: number | null; onOpenChange: (v: boolean) => void }) {
  const { t } = useTranslation()
  const { data, isLoading } = useAdminVendor(id)
  const user = data?.user
  const location =
    [data?.city, data?.state, data?.country].filter(Boolean).join(', ') || '—'

  return (
    <Dialog open={id != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        {isLoading || !data ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <Separator />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                  {data.logo ? (
                    <img src={assetUrl(data.logo)} alt={data.store_name} className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 space-y-1">
                  <DialogTitle className="truncate">{data.store_name}</DialogTitle>
                  <DialogDescription className="truncate">
                    @{data.slug}
                    {user?.email ? ` · ${user.email}` : ''}
                  </DialogDescription>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    <VendorStatusBadge status={data.status} />
                  </div>
                </div>
              </div>
              <Separator />
            </DialogHeader>

            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <VendorDetailItem icon={UserIcon} label={t('Owner')} value={user?.name ?? '—'} />
              <VendorDetailItem
                icon={Phone}
                label={t('Phone')}
                value={user?.phone ?? '—'}
              />
              <VendorDetailItem
                icon={Percent}
                label={t('Commission Rate')}
                value={`${data.commission_rate}%`}
              />
              <VendorDetailItem
                icon={CalendarDays}
                label={t('Joined')}
                value={formatDate(data.created_at)}
              />
              <VendorDetailItem icon={MapPin} label={t('Location')} value={location} />
              <VendorDetailItem icon={FileText} label={t('GSTIN')} value={data.gstin ?? '—'} />
              <VendorDetailItem icon={FileText} label={t('PAN')} value={data.pan ?? '—'} />
              <VendorDetailItem icon={Globe} label={t('Store URL')} value={<span className="break-all">/{data.slug}</span>} />
            </div>

            {data.description ? (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('Description')}</p>
                  <p className="text-sm text-muted-foreground">{data.description}</p>
                </div>
              </div>
            ) : null}

            <Separator />

            <div className="grid gap-3 sm:grid-cols-3">
              <VendorStatCard
                icon={Package}
                iconClass="bg-primary/10 text-primary"
                label={t('Products')}
                value={data.product_count ?? 0}
              />
              <VendorStatCard
                icon={ShoppingCart}
                iconClass="bg-yellow-100 text-yellow-600"
                label={t('Orders')}
                value={data.order_count ?? 0}
              />
              <VendorStatCard
                icon={IndianRupee}
                iconClass="bg-emerald-100 text-emerald-600"
                label={t('Total Sales')}
                value={formatCurrency(data.total_sales ?? 0)}
              />
            </div>

            <Separator />

            <div className="grid gap-3 md:grid-cols-2">
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">{t('Wallet')}</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('Available')}</span>
                      <span className="font-semibold">{formatCurrency(data.wallet?.available_balance ?? 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('Pending')}</span>
                      <span className="font-medium">{formatCurrency(data.wallet?.pending_balance ?? 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('Held')}</span>
                      <span className="font-medium">{formatCurrency(data.wallet?.held_balance ?? 0)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="text-muted-foreground">{t('Paid Total')}</span>
                      <span className="font-semibold">{formatCurrency(data.wallet?.paid_total ?? 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">{t('Bank Details')}</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{t('Account')}</span>
                      <span className="truncate font-medium">{data.bank?.account_name ?? '—'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{t('Number')}</span>
                      <span className="font-medium">{data.bank?.account_number ?? '—'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{t('IFSC')}</span>
                      <span className="font-medium">{data.bank?.ifsc ?? '—'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{t('Bank')}</span>
                      <span className="truncate font-medium">{data.bank?.bank_name ?? '—'}</span>
                    </div>
                    {data.pan ? (
                      <div className="flex items-center justify-between gap-3 border-t pt-2">
                        <span className="text-muted-foreground">{t('PAN')}</span>
                        <span className="font-medium">{data.pan}</span>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>

            {data.documents && data.documents.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="mb-2 text-sm font-semibold">{t('Documents')}</p>
                  <div className="flex flex-wrap gap-2">
                    {data.documents.map((doc, i) => (
                      <a
                        key={i}
                        href={doc}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Document {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Close')}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function EditVendorDetailsDialog({ vendor }: { vendor: Vendor }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const update = useUpdateAdminVendor()
  const [form, setForm] = useState({
    store_name: vendor.store_name ?? '',
    description: vendor.description ?? '',
    address_line1: vendor.address_line1 ?? '',
    address_line2: vendor.address_line2 ?? '',
    city: vendor.city ?? '',
    state: vendor.state ?? '',
    country: vendor.country ?? '',
    pincode: vendor.pincode ?? '',
    gstin: vendor.gstin ?? '',
    pan: vendor.pan ?? '',
    bank_account_name: (vendor as any).bank_account_name ?? '',
    bank_account_number: (vendor as any).bank_account_number ?? '',
    bank_ifsc: (vendor as any).bank_ifsc ?? '',
    bank_name: (vendor as any).bank_name ?? '',
    upi_id: (vendor as any).upi_id ?? '',
    commission_rate: vendor.commission_rate !== undefined && vendor.commission_rate !== null ? String(vendor.commission_rate) : '',
  })
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  const submit = () => {
    setErrors({})
    const data: Record<string, any> = { ...form }
    if (data.commission_rate === '' || data.commission_rate == null) {
      delete data.commission_rate
    } else {
      const r = Number(data.commission_rate)
      data.commission_rate = Number.isNaN(r) ? undefined : r
    }
    update.mutate(
      { id: vendor.id, data },
      {
        onSuccess: () => setOpen(false),
        onError: (error) => {
          const d = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data
          const f = d?.errors ? Object.values(d.errors)[0]?.[0] : undefined
          setErrors({ form: f ?? (error as Error).message })
        },
      },
    )
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        {t('Edit Details')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {vendor.store_name}</DialogTitle>
            <DialogDescription>{t('Update vendor profile, tax, and bank details.')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {errors.form && <p className="text-xs text-destructive">{errors.form}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t('Store Name')}>
                <Input value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} />
              </FormField>
              <FormField label={t('Commission Rate (%)')}>
                <Input type="number" min={0} max={100} value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: e.target.value })} />
              </FormField>
            </div>
            <FormField label={t('Description')}>
              <textarea className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t('Address Line 1')}>
                <Input value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} />
              </FormField>
              <FormField label={t('Address Line 2')}>
                <Input value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} />
              </FormField>
              <FormField label={t('City')}>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </FormField>
              <FormField label={t('State')}>
                <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </FormField>
              <FormField label={t('Country')}>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </FormField>
              <FormField label={t('Pincode')}>
                <Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t('GSTIN')}>
                <Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
              </FormField>
              <FormField label={t('PAN')}>
                <Input value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t('Account Holder Name')}>
                <Input value={form.bank_account_name} onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })} />
              </FormField>
              <FormField label={t('Account Number')}>
                <Input value={form.bank_account_number} onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })} />
              </FormField>
              <FormField label={t('IFSC Code')}>
                <Input value={form.bank_ifsc} onChange={(e) => setForm({ ...form, bank_ifsc: e.target.value })} />
              </FormField>
              <FormField label={t('Bank Name')}>
                <Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
              </FormField>
              <FormField label={t('UPI ID')}>
                <Input value={form.upi_id} onChange={(e) => setForm({ ...form, upi_id: e.target.value })} />
              </FormField>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t('Cancel')}</Button>
            <Button onClick={submit} disabled={update.isPending}>{update.isPending ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

const VENDOR_FILTER_KEYS = ['search', 'status', 'created_days'] as const

export function AdminVendorsPage() {
  const { t } = useTranslation()
  const {
    values: filters,
    set: setFilter,
    reset: resetFilters,
    hasActive,
    page,
    setPage,
  } = useUrlFilters(VENDOR_FILTER_KEYS)
  const { input: search, setInput: setSearch } = useDebouncedUrlFilter('search')
  const [createOpen, setCreateOpen] = useState(false)
  const [viewId, setViewId] = useState<number | null>(null)
  const { data, isLoading, isError, refetch } = useAdminVendors({
    page,
    per_page: 12,
    search: search || undefined,
    status: filters.status || undefined,
    created_days: filters.created_days ? Number(filters.created_days) : undefined,
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('Vendors')}</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> {t('Create Vendor')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('Search by store or email...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filters.status || 'ALL'} onValueChange={(v) => setFilter('status', v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('All statuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('All statuses')}</SelectItem>
            <SelectItem value="PENDING">{t('Pending')}</SelectItem>
            <SelectItem value="APPROVED">{t('Approved')}</SelectItem>
            <SelectItem value="SUSPENDED">{t('Suspended')}</SelectItem>
            <SelectItem value="REJECTED">{t('Rejected')}</SelectItem>
            <SelectItem value="INACTIVE">{t('Inactive')}</SelectItem>
          </SelectContent>
        </Select>
        {hasActive && (
          <Button variant="ghost" onClick={resetFilters}>
            <X className="mr-1 h-4 w-4" /> {t('Clear filters')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center justify-between rounded-lg border p-6 text-sm text-destructive">
          {t('Could not load vendors.')}
          <Button size="sm" variant="outline" onClick={() => refetch()}><RefreshCw className="mr-1 h-4 w-4" /> {t('Retry')}</Button>
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {(data?.data ?? []).map((row) => {
                  const vendor = row as AdminVendorRow
                  return (
                  <div key={vendor.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        {vendor.logo ? (
                          <img src={assetUrl(vendor.logo)} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <Store className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{vendor.store_name}</p>
                          <VendorStatusBadge status={vendor.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {vendor.user?.name ?? ''} · {vendor.city ?? 'N/A'} · {vendor.commission_rate}% commission
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden text-right text-sm sm:block">
                        <p className="text-xs text-muted-foreground">{t('Joined')}</p>
                        <p>{formatDate(vendor.created_at)}</p>
                      </div>
                      <VendorActions vendor={vendor} onView={() => setViewId(vendor.id)} />
                    </div>
                  </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {data && data.last_page > 1 && (
            <div className="flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
              <span>Page {data.current_page} of {data.last_page} ({data.total} total)</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('Previous')}</Button>
                <Button variant="outline" size="sm" disabled={page >= data.last_page} onClick={() => setPage(page + 1)}>{t('Next')}</Button>
              </div>
            </div>
          )}

          {data?.total === 0 && <p className="py-16 text-center text-sm text-muted-foreground">{t('No vendors found.')}</p>}
        </>
      )}

      <CreateVendorDialog open={createOpen} onOpenChange={setCreateOpen} />
      <VendorDetailDialog id={viewId} onOpenChange={(v) => { if (!v) setViewId(null) }} />
    </div>
  )
}