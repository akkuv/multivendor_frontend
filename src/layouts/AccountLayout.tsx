import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  Bell,
  BellRing,
  LayoutDashboard,
  MapPin,
  Package,
  RotateCcw,
  Star,
  Store,
  Truck,
  Wallet,
  Waves,
  LifeBuoy,
  MessageSquareText,
  Store as StoreIcon,
  type LucideIcon,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useMyOrders } from '@/hooks/useOrders'
import { useWallet } from '@/hooks/useWallet'
import { useCustomerProductQueriesUnreadCount } from '@/hooks/useSupport'
import { useMyNotificationsUnreadCount } from '@/hooks/useNotifications'
import { formatCurrency } from '@/utils/format'
import { useWebsiteContent } from '@/hooks/useWebsite'
import { useTranslation } from 'react-i18next'

const NAV: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/account', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/account/orders', label: 'My Orders', icon: Package },
  { to: '/account/track', label: 'Track Order', icon: Truck },
  { to: '/account/returns', label: 'My Returns', icon: RotateCcw },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  { to: '/account/wallet', label: 'Wallet', icon: Wallet },
  { to: '/account/support', label: 'Support', icon: LifeBuoy },
  { to: '/account/product-queries', label: 'Product Queries', icon: MessageSquareText },
  { to: '/account/reviews', label: 'My Reviews', icon: Star },
  { to: '/account/vendor-reviews', label: 'Vendor Reviews', icon: Store },
  { to: '/account/notifications', label: 'Notifications', icon: BellRing },
  { to: '/account/wishlist-notifications', label: 'Wishlist Alerts', icon: Bell },
]

export function AccountLayout() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)

  const { data: website } = useWebsiteContent()
  const storeName = website?.navbar?.logo?.text?.trim() || 'Store'

  const { data: ordersPage } = useMyOrders(!!user)
  const { data: wallet } = useWallet(!!user)

  const { data: productQueriesUnread } = useCustomerProductQueriesUnreadCount()
  const { data: notificationsUnread } = useMyNotificationsUnreadCount()
  const ordersCount = ordersPage?.data?.length ?? 0
  const totalBalance = wallet?.total_balance ?? 0

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U'

  const last4 = user?.id != null ? String(user.id).slice(-4).padStart(4, '0') : '0000'
  const maskedNumber = `···· ···· ···· ${last4}`

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="lg:grid lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-5">
            <div className="group animate-fade-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5f430d] via-orange-900 to-amber-800 p-5 text-white shadow-xl shadow-orange-900/40 ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-orange-700/50">
              <div className="pointer-events-none absolute -left-8 -top-10 h-40 w-40 rounded-full bg-orange-500/30 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-12 right-0 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-2xl" />
              <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute right-10 top-3 h-px w-24 rotate-45 bg-white/20" />
              <div className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 animate-card-shine bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              <div className="relative flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar className="h-9 w-9 shrink-0 border border-white/30 bg-white/10">
                    <AvatarFallback className="bg-white/15 text-xs font-bold text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold leading-tight">{user?.name}</p>
                    <p className="truncate text-[11px] text-white/60">{user?.email}</p>
                  </div>
                </div>
                <Waves className="h-4 w-4 shrink-0 text-white/60" />
              </div>

              <div className="relative mt-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-9 shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-yellow-200 via-yellow-400 to-amber-500 shadow-inner">
                    <div className="grid h-full w-full grid-cols-2 grid-rows-2">
                      <div className="border-r border-b border-amber-700/30" />
                      <div className="border-b border-amber-700/30" />
                      <div className="border-r border-amber-700/30" />
                      <div />
                    </div>
                  </div>
                  <span className="font-mono text-xs tracking-[0.18em] text-white/80">{maskedNumber}</span>
                </div>
                <span className="shrink-0 rounded-md border border-white/20 bg-white/10 px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.18em]">
                  {storeName}
                </span>
              </div>

              <div className="relative mt-4 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
                    {t('Wallet Balance')}
                  </p>
                  <p className="mt-0.5 font-display text-2xl font-extrabold leading-tight tracking-tight drop-shadow-sm">
                    {formatCurrency(totalBalance)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">{t('Orders')}</p>
                  <p className="mt-0.5 text-lg font-bold">{ordersCount}</p>
                </div>
              </div>

              <div className="relative mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
                <span className="truncate font-display text-[11px] font-bold uppercase tracking-[0.3em]">
                  {storeName}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-white/70">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]" />
                  {t('Active member')}
                </span>
              </div>
            </div>

            <nav className="rounded-2xl border bg-card p-2 shadow-sm">
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('My Account')}
              </p>
              <ul className="space-y-1">
                {NAV.map(({ to, label, icon: Icon, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                        )
                      }
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{t(label)}</span>

                      {to === '/account/product-queries' && (productQueriesUnread ?? 0) > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold leading-none text-destructive-foreground">
                          {(productQueriesUnread ?? 0) > 99 ? '99+' : productQueriesUnread}
                        </span>
                      )}
                      {to === '/account/notifications' && (notificationsUnread?.count ?? 0) > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold leading-none text-destructive-foreground">
                          {(notificationsUnread?.count ?? 0) > 99 ? '99+' : notificationsUnread?.count}
                        </span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <Link
              to="/shop"
              className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <StoreIcon className="h-4 w-4" /> {t('Continue shopping')}
            </Link>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="scrollbar-none -mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary',
                  )
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {t(label)}
              </NavLink>
            ))}
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  )
}