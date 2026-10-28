import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Globe,
  MapPin,
  Package,
  Pencil,
  Phone,
  Plus,
  Trash2,
  Wallet,
  ChevronRight,
  Star,
  Store,
  Bell,
  History,
  RotateCcw,
  Sparkles,
  Mail,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { useMyOrders } from '@/hooks/useOrders'
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useUpdateAddress,
} from '@/hooks/useAddresses'
import { useWallet } from '@/hooks/useWallet'
import { formatCurrency, formatDate, formatDateTime, orderGrandTotal } from '@/utils/format'
import type { Address, Order, Product } from '@/types'
import type { AddressPayload } from '@/services/address'
import { AddressForm, addressTypeIcon, type AddressFormValues } from '@/components/account/address-form'
import { useQuery } from '@tanstack/react-query'
import { getRecentlyViewed, getBuyAgain } from '@/services/cx'
import { ProductCard } from '@/components/ProductCard'
import { useTranslation } from 'react-i18next'

function ProductPanel({
  title,
  icon: Icon,
  products,
  loading,
  empty,
}: {
  title: string
  icon: LucideIcon
  products: Product[]
  loading: boolean
  empty: string
}) {
  const { t } = useTranslation()

  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
        <Icon className="h-5 w-5 text-primary" /> {t(title)}
      </h2>
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
          ))}
        </div>
      ) : products.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">{t(empty)}</p>
      )}
    </div>
  )
}

export function AccountPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { data: orders, isLoading: ordersLoading } = useMyOrders(!!user)
  const { data: addresses, isLoading: addressesLoading } = useAddresses(!!user)
  const { data: wallet } = useWallet(!!user)
  const createAddress = useCreateAddress()
  const updateAddress = useUpdateAddress()
  const deleteAddress = useDeleteAddress()
  const [addressFormOpen, setAddressFormOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)

  const openCreateAddress = () => {
    setEditingAddress(null)
    setAddressFormOpen(true)
  }

  const openEditAddress = (addr: Address) => {
    setEditingAddress(addr)
    setAddressFormOpen(true)
  }

  const closeAddressForm = () => {
    setAddressFormOpen(false)
    setEditingAddress(null)
  }

  const handleSaveAddress = (values: AddressFormValues) => {
    const payload = values as AddressPayload
    if (editingAddress) {
      updateAddress.mutate(
        { id: editingAddress.id, data: payload },
        { onSuccess: closeAddressForm },
      )
    } else {
      createAddress.mutate(payload, { onSuccess: closeAddressForm })
    }
  }

  const addressFormBusy = createAddress.isPending || updateAddress.isPending

  const { data: recentlyViewed, isLoading: rvLoading } = useQuery({
    queryKey: ['recently-viewed'],
    queryFn: getRecentlyViewed,
    enabled: !!user,
  })
  const { data: buyAgain, isLoading: baLoading } = useQuery({
    queryKey: ['buy-again'],
    queryFn: getBuyAgain,
    enabled: !!user,
  })

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U'

  const orderCount = orders?.data?.length ?? 0
  const addressCount = addresses?.length ?? 0
  const walletBalance = Number(wallet?.available_balance ?? 0)
  const pendingBalance = Number(wallet?.pending_balance ?? 0)

  const quickLinks = [
    {
      to: '/account/reviews',
      icon: Star,
      title: t('My Reviews'),
      desc: 'Reviews for products you bought',
      tint: 'bg-gold-soft text-[#8a6a1f] ring-[#c9a25a]/30 group-hover:bg-gold group-hover:text-[#1a1308]',
    },
    {
      to: '/account/vendor-reviews',
      icon: Store,
      title: t('Vendor Reviews'),
      desc: 'Reviews for stores you ordered from',
      tint: 'from-yellow-100 to-yellow-50 text-yellow-600 group-hover:from-yellow-500 group-hover:to-orange-600 group-hover:text-white',
    },
    {
      to: '/account/wishlist-notifications',
      icon: Bell,
      title: t('Wishlist Alerts'),
      desc: 'Price drops & back-in-stock updates',
      tint: 'from-amber-100 to-amber-50 text-amber-600 group-hover:from-amber-400 group-hover:to-orange-500 group-hover:text-white',
    },
    {
      to: '/account/returns',
      icon: RotateCcw,
      title: t('My Returns'),
      desc: 'Track returns and refund requests',
      tint: 'from-[#f7e8e4] to-[#fbeef0] text-claret group-hover:from-claret group-hover:to-[#6b1f35] group-hover:text-white',
    },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="animate-fade-up relative overflow-hidden rounded-2xl border border-[#e6c97e]/25 bg-gold p-6 text-[#1a1308] shadow-lg shadow-[#c9a25a]/25 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-32 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-[#7a5c1e]/25 bg-white/20 shadow-lg">
              <AvatarFallback className="bg-white/25 font-display text-xl font-bold text-[#1a1308]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-[#1a1308]/70">{t('Welcome back')}</p>
              <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {user?.name}
              </h1>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-primary-foreground/80">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {user?.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />{' '}
                  {t('Member since {{date}}', { date: formatDate(user?.created_at) })}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
            <Link
              to="/account/wallet"
              className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur transition-colors hover:bg-white/20"
            >
              <p className="text-xs font-medium text-primary-foreground/80">{t('Wallet')}</p>
              <p className="mt-0.5 font-display text-base font-bold leading-snug">{formatCurrency(walletBalance)}</p>
              {pendingBalance > 0 && (
                <p className="text-[11px] text-primary-foreground/75">
                  {t('{{amount}} pending', { amount: formatCurrency(pendingBalance) })}
                </p>
              )}
            </Link>
            <Link
              to="/account/orders"
              className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur transition-colors hover:bg-white/20"
            >
              <p className="text-xs font-medium text-primary-foreground/80">{t('Orders')}</p>
              <p className="mt-0.5 font-display text-lg font-bold">{orderCount}</p>
              <p className="text-[11px] text-primary-foreground/75">{t('total placed')}</p>
            </Link>
            <Link
              to="/account/addresses"
              className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur transition-colors hover:bg-white/20"
            >
              <p className="text-xs font-medium text-primary-foreground/80">{t('Addresses')}</p>
              <p className="mt-0.5 font-display text-lg font-bold">{addressCount}</p>
              <p className="text-[11px] text-primary-foreground/75">{t('saved')}</p>
            </Link>
          </div>
        </div>
      </div>

      <div className="animate-fade-up-delay-1 mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map(({ to, icon: Ic, title, desc, tint }) => (
          <Link
            key={to}
            to={to}
            className="group relative rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
          >
            <div
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br transition-all duration-300 group-hover:scale-110 group-hover:shadow-md',
                tint,
              )}
            >
              <Ic className="h-5 w-5" />
            </div>
            <p className="mt-3 font-semibold">{t(title)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t(desc)}</p>
            <ChevronRight className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary opacity-0 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-100" />
          </Link>
        ))}
      </div>

      <Tabs defaultValue="orders" className="mt-8">
        <TabsList className="h-auto gap-1 rounded-xl p-1">
          <TabsTrigger value="orders">{t('Orders')}</TabsTrigger>
          <TabsTrigger value="addresses">{t('Addresses')}</TabsTrigger>
          <TabsTrigger value="wallet">{t('Wallet')}</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Package className="h-5 w-5 text-primary" /> {t('Recent Orders')}
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/account/orders">
                {t('View all')} <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : orders && orders.data.length > 0 ? (
              orders.data.map((order: Order) => (
                <Card key={order.id} className="overflow-hidden transition-shadow hover:shadow-md">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <Link
                          to={`/account/orders/${order.id}`}
                          className="font-semibold hover:text-primary hover:underline"
                        >
                          {order.order_number}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(order.created_at)} ·{' '}
                          {t('{{count}} item(s)', { count: order.items.length })}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-semibold">{formatCurrency(orderGrandTotal(order))}</span>
                        <Badge variant={order.order_status === 'DELIVERED' ? 'success' : 'secondary'}>
                          {order.order_status}
                        </Badge>
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/account/orders/${order.id}`}>
                            {t('View')} <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center px-6 py-14 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Package className="h-8 w-8" />
                  </div>
                  <p className="font-display text-lg font-bold">{t('No orders yet')}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('Start browsing and your orders will show up here.')}
                  </p>
                  <Button asChild className="mt-5">
                    <Link to="/shop">{t('Start Shopping')}</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="addresses">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <MapPin className="h-5 w-5 text-primary" /> {t('Shipping Address')}
            </h2>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/account/addresses">
                  {t('Manage all')} <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button size="sm" onClick={openCreateAddress}>
                <Plus className="mr-1 h-4 w-4" /> {t('Add Address')}
              </Button>
            </div>
          </div>

          {addressesLoading ? (
            <Skeleton className="h-32 rounded-xl" />
          ) : addresses && addresses.length > 0 ? (
            <div className="space-y-3">
              {addresses.map((addr) => {
                const TypeIcon = addressTypeIcon(addr.type)
                return (
                  <Card key={addr.id} className="transition-shadow hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{addr.name}</p>
                            {addr.type && (
                              <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-medium uppercase">
                                {addr.type}
                              </Badge>
                            )}
                            {addr.is_default && (
                              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-medium">
                                {t('Default')}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            {addr.phone}
                          </p>
                          <p className="mt-0.5 flex items-start gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>
                              {addr.address_line1}
                              {addr.address_line2 ? `, ${addr.address_line2}` : ''}
                              {addr.landmark ? `, ${addr.landmark}` : ''}, {addr.city},{' '}
                              {addr.state} - {addr.pincode}
                            </span>
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Globe className="h-3.5 w-3.5 shrink-0" />
                            {addr.country}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            title={t('Edit address')}
                            onClick={() => openEditAddress(addr)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title={t('Delete address')}
                            disabled={deleteAddress.isPending}
                            onClick={() => deleteAddress.mutate(addr.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center px-6 py-14 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MapPin className="h-8 w-8" />
                </div>
                <p className="font-display text-lg font-bold">{t('No saved addresses')}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('Add a shipping address to make checkout faster.')}
                </p>
                <Button onClick={openCreateAddress} className="mt-5">
                  <Plus className="mr-1 h-4 w-4" /> {t('Add Your First Address')}
                </Button>
              </CardContent>
            </Card>
          )}

          {addressFormOpen && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <MapPin className="h-5 w-5 text-primary" />
                  {editingAddress ? t('Edit Address') : t('Add New Address')}
                </h3>
                <AddressForm
                  key={editingAddress?.id ?? 'new'}
                  initial={editingAddress ?? undefined}
                  isPending={addressFormBusy}
                  onSave={handleSaveAddress}
                  onCancel={closeAddressForm}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="wallet">
          <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
            <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('Wallet Balance')}</p>
                  <p className="font-display text-2xl font-bold">{formatCurrency(walletBalance)}</p>
                  {pendingBalance > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {t('{{amount}} pending', { amount: formatCurrency(pendingBalance) })}
                    </p>
                  )}
                </div>
              </div>
              <Button asChild>
                <Link to="/account/wallet">{t('Open Wallet')}</Link>
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-12 space-y-10">
        <ProductPanel
          title={t('Recently viewed')}
          icon={History}
          products={recentlyViewed ?? []}
          loading={rvLoading}
          empty="You have not viewed any products yet."
        />
        <ProductPanel
          title={t('Buy again')}
          icon={RotateCcw}
          products={buyAgain ?? []}
          loading={baLoading}
          empty="Products from your past orders will appear here."
        />
      </div>
    </div>
  )
}
