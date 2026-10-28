import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  RotateCcw,
  Truck,
  Wallet,
  LogOut,
  MessageCircleQuestion,
  MessageSquareText,
  HandCoins,
  BarChart3,
  Bell,
  Store,
  LifeBuoy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VendorNotificationBell } from '@/components/vendor/VendorNotificationBell'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'
import { useVendorProfile, useVendorNotificationsUnreadCount } from '@/hooks/useVendor'
import { useVendorOrderQueriesUnreadCount, useVendorProductQueriesUnreadCount } from '@/hooks/useSupport'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

const links = [
  { to: '/vendor', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/vendor/products', label: 'Products', icon: Package, end: false },
  { to: '/vendor/orders', label: 'Orders', icon: ShoppingBag, end: false },
  { to: '/vendor/returns', label: 'Returns', icon: RotateCcw, end: false },
  { to: '/vendor/shipments', label: 'Shipments', icon: Truck, end: false },
  { to: '/vendor/questions', label: 'Questions', icon: MessageCircleQuestion, end: false },
  { to: '/vendor/wallet', label: 'Wallet', icon: Wallet, end: false },
  { to: '/vendor/payouts', label: 'Payouts', icon: HandCoins, end: false },
  { to: '/vendor/reports', label: 'Reports', icon: BarChart3, end: false },
  { to: '/vendor/notifications', label: 'Notifications', icon: Bell, end: false },
  { to: '/vendor/support', label: 'Support', icon: LifeBuoy, end: false },
  { to: '/vendor/order-queries', label: 'Order Queries', icon: MessageCircleQuestion, end: false },
  { to: '/vendor/product-queries', label: 'Product Queries', icon: MessageSquareText, end: false },
  { to: '/vendor/profile', label: 'Store Profile', icon: Store, end: false },
]

export function VendorLayout() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const location = useLocation()
  const { data: profile } = useVendorProfile()

  const { data: orderQueriesUnread } = useVendorOrderQueriesUnreadCount()
  const { data: productQueriesUnread } = useVendorProductQueriesUnreadCount()
  const { data: notificationsUnread } = useVendorNotificationsUnreadCount()

  const isActive = (link: { to: string; end?: boolean }) =>
    link.end ? location.pathname === link.to : location.pathname === link.to || location.pathname.startsWith(`${link.to}/`)

  const currentPage = links.find(isActive)?.label ?? 'Vendor'

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <aside className="flex w-64 shrink-0 flex-col border-r bg-card">
        <div className="relative flex h-20 shrink-0 items-center gap-3 overflow-hidden bg-gradient-to-br from-primary via-primary to-gold-deep px-5 text-primary-foreground">
          <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10 blur-sm" />
          <div className="pointer-events-none absolute -bottom-10 left-14 h-24 w-24 rounded-full bg-white/10" />
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-inner">
            <Store className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold leading-tight">
              {profile?.store_name}
            </p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              {t('Vendor Panel')}
            </span>
          </div>
        </div>

        <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto p-3">
          <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('Store Management')}
          </p>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              <link.icon className="h-4 w-4" />
              <span className="flex-1">{t(link.label)}</span>

              {link.to === '/vendor/notifications' && (notificationsUnread?.count ?? 0) > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {(notificationsUnread?.count ?? 0) > 99 ? '99+' : notificationsUnread?.count}
                </span>
              )}
              {link.to === '/vendor/order-queries' && (orderQueriesUnread ?? 0) > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {orderQueriesUnread}
                </span>
              )}
              {link.to === '/vendor/product-queries' && (productQueriesUnread ?? 0) > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {productQueriesUnread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 border-t p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-muted/60 p-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-gold-deep text-sm font-bold text-primary-foreground">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'V'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Link
            to="/"
            className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {t('Back to store')}
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={() => logout.mutate()}
          >
            <LogOut className="mr-2 h-4 w-4" /> {t('Logout')}
          </Button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-6 backdrop-blur sm:px-8">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{currentPage}</p>
            <p className="hidden text-xs text-muted-foreground sm:block">{t('Manage your store from here.')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="truncate text-sm font-semibold leading-tight">
                {profile?.store_name ?? user?.name}
              </p>
              <p className="text-xs text-muted-foreground">{t('Vendor')}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {user?.name?.charAt(0) ?? 'V'}
            </div>
            <VendorNotificationBell />
          </div>
        </header>
        <div className="flex-1 p-6 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
