import { useState, type ComponentType, type ReactNode } from 'react'
import { assetUrl } from '@/lib/assets'
import {
  Ban,
  CalendarDays,
  CheckCircle2,
  Eye,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShoppingCart,
  Wallet,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { EmptyState, PaginationFooter } from '@/components/common/admin'
import {
  useAdminUsers,
  useBlockAdminUser,
  useUnblockAdminUser,
  useAdminUser,
} from '@/hooks/useAdmin'
import { useDebouncedUrlFilter, useUrlFilters } from '@/hooks/useUrlFilters'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import type { User } from '@/types'
import { useTranslation } from 'react-i18next'

const ROLE_VARIANTS: Record<string, 'secondary' | 'success' | 'warning'> = {
  CUSTOMER: 'secondary',
  VENDOR: 'success',
  SUPER_ADMIN: 'warning',
}

function RoleBadge({ role }: { role: string }) {
  return <Badge variant={ROLE_VARIANTS[role] ?? 'secondary'}>{role}</Badge>
}

function StatusBadge({ user }: { user: User }) {
  const { t } = useTranslation()
  if (user.is_active === false) return <Badge variant="destructive">{t('Blocked')}</Badge>
  return <Badge variant="success">{t('Active')}</Badge>
}

interface UserDetailOrder {
  id: number
  order_number: string
  total: number
  order_status: string
  payment_status: string
  created_at: string
}

const ORDER_VARIANTS: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  PENDING: 'warning',
  PROCESSING: 'secondary',
  SHIPPED: 'secondary',
  DELIVERED: 'success',
  CANCELLED: 'destructive',
  FAILED: 'destructive',
  REFUNDED: 'secondary',
}

const PAYMENT_VARIANTS: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  PAID: 'success',
  PENDING: 'warning',
  FAILED: 'destructive',
  REFUNDED: 'secondary',
}

function UserOrderStatusBadge({ status }: { status: string }) {
  return <Badge variant={ORDER_VARIANTS[status] ?? 'secondary'}>{status}</Badge>
}

function UserPaymentStatusBadge({ status }: { status: string }) {
  return <Badge variant={PAYMENT_VARIANTS[status] ?? 'secondary'}>{status}</Badge>
}

function DetailItem({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

function UserDetailDialog({ id, onOpenChange }: { id: number | null; onOpenChange: (v: boolean) => void }) {
  const { t } = useTranslation()
  const { data, isLoading } = useAdminUser(id)
  const block = useBlockAdminUser()
  const unblock = useUnblockAdminUser()
  const user = data?.user
  const orders = (data?.orders ?? []) as UserDetailOrder[]
  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('')
    : 'U'

  return (
    <Dialog open={id != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        {isLoading || !data || !user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
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
                <Avatar className="h-14 w-14 rounded-xl">
                  {user.avatar ? <AvatarImage src={assetUrl(user.avatar)} alt={user.name} /> : null}
                  <AvatarFallback className="rounded-xl bg-primary/10 text-lg font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 space-y-1">
                  <DialogTitle className="truncate">{user.name}</DialogTitle>
                  <DialogDescription className="truncate">{user.email}</DialogDescription>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    <RoleBadge role={user.role} />
                    <StatusBadge user={user} />
                  </div>
                </div>
              </div>
              <Separator />
            </DialogHeader>

            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <DetailItem
                icon={Mail}
                label={t('Email')}
                value={<span className="break-all">{user.email}</span>}
              />
              <DetailItem icon={Phone} label={t('Phone')} value={user.phone ?? '—'} />
              <DetailItem
                icon={CalendarDays}
                label={t('Joined')}
                value={formatDate(user.created_at)}
              />
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {user.is_active ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Ban className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('Status')}</p>
                  <p className="font-medium text-foreground">{user.is_active ? t('Active') : t('Blocked')}</p>
                </div>
              </div>
              {user.wallet ? (
                <DetailItem
                  icon={Wallet}
                  label={t('Wallet Balance')}
                  value={formatCurrency(user.wallet.available_balance)}
                />
              ) : null}
            </div>

            <Separator />

            <div className="grid gap-3 sm:grid-cols-2">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('Total Orders')}</p>
                    <p className="text-xl font-bold leading-tight">{data.order_count}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <Wallet className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('Total Spent')}</p>
                    <p className="text-xl font-bold leading-tight">{formatCurrency(data.total_spent)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {orders.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">{t('Recent Orders')}</p>
                    <p className="text-xs text-muted-foreground">{t('{{count}} total', { count: data.order_count })}</p>
                  </div>
                  <div className="divide-y rounded-lg border">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{order.order_number}</p>
                            <UserOrderStatusBadge status={order.order_status} />
                            <UserPaymentStatusBadge status={order.payment_status} />
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
                        </div>
                        <p className="shrink-0 font-semibold">{formatCurrency(order.total)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <DialogFooter className="gap-2 pt-2">
              {user.is_active === false ? (
                <Button onClick={() => unblock.mutate(user.id)} disabled={unblock.isPending} className="min-w-28">
                  {t('Unblock User')}
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  disabled={block.isPending || user.role === 'SUPER_ADMIN'}
                  onClick={() => block.mutate(user.id)}
                  className="min-w-28"
                >
                  {t('Block User')}
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Close')}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

const USER_FILTER_KEYS = ['search', 'role', 'active', 'created_days'] as const

export function AdminUsersPage() {
  const { t } = useTranslation()
  const {
    values: filters,
    set: setFilter,
    reset: resetFilters,
    hasActive,
    page,
    setPage,
  } = useUrlFilters(USER_FILTER_KEYS)
  const { input: search, setInput: setSearch } = useDebouncedUrlFilter('search')
  const [viewId, setViewId] = useState<number | null>(null)
  const { data, isLoading, isError, refetch } = useAdminUsers({
    page,
    per_page: 15,
    search: search || undefined,
    role: filters.role || undefined,
    active: filters.active === 'true' ? true : filters.active === 'false' ? false : undefined,
    created_days: filters.created_days ? Number(filters.created_days) : undefined,
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('Users')}</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('Search by name or email...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filters.role || 'ALL'} onValueChange={(v) => setFilter('role', v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('All roles')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('All roles')}</SelectItem>
            <SelectItem value="CUSTOMER">{t('Customer')}</SelectItem>
            <SelectItem value="VENDOR">{t('Vendor')}</SelectItem>
            <SelectItem value="SUPER_ADMIN">{t('Super Admin')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.active || 'ALL'} onValueChange={(v) => setFilter('active', v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('All statuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('All statuses')}</SelectItem>
            <SelectItem value="true">{t('Active')}</SelectItem>
            <SelectItem value="false">{t('Blocked')}</SelectItem>
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
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center justify-between rounded-lg border p-6 text-sm text-destructive">
          {t('Could not load users.')}
          <Button size="sm" variant="outline" onClick={() => refetch()}><RefreshCw className="mr-1 h-4 w-4" /> {t('Retry')}</Button>
        </div>
      ) : data && data.data.length === 0 ? (
        <EmptyState message={t('No users found.')} />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {data?.data.map((user) => (
                  <div key={user.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                    <button
                      type="button"
                      onClick={() => setViewId(user.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left transition-colors hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:px-2"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        {user.avatar ? (
                          <img src={assetUrl(user.avatar)} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <span className="text-sm font-medium">{user.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{user.name}</p>
                          <RoleBadge role={user.role} />
                          <StatusBadge user={user} />
                        </div>
                        <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </button>
                    <div className="flex items-center gap-3">
                      <p className="hidden text-sm text-muted-foreground sm:block">{formatDate(user.created_at)}</p>
                      <Button size="sm" variant="outline" onClick={() => setViewId(user.id)}>
                        <Eye className="mr-1 h-3.5 w-3.5" /> {t('View')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <PaginationFooter data={data as never} onPageChange={setPage} />
        </>
      )}

      <UserDetailDialog id={viewId} onOpenChange={(v) => { if (!v) setViewId(null) }} />
    </div>
  )
}