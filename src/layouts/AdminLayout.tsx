import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Store,
  Tags,
  Award,
  SlidersHorizontal,
  Palette,
  Ruler,
  Ticket,
  Package,
  ShoppingBag,
  ShoppingBasket,
  Truck,
  PackageCheck,
  Users,
  CreditCard,
  Star,
  Heart,
  CheckCircle2,
  Wallet,
  Banknote,
  RotateCcw,
  Bell,
  BarChart3,
  LayoutGrid,
  Layers,
  FileStack,
  Globe,
  Shapes,
  ChevronDown,
  LogOut,
  LifeBuoy,
  MessagesSquare,
  MessageCircleQuestion,
  MessageSquareText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'
import { useAdminNotificationsUnreadCount } from '@/hooks/useAdmin'
import { useAdminNotificationsRealtime } from '@/hooks/useAdminNotificationsRealtime'
import { useSupportInboxCounts } from '@/hooks/useSupport'
import { useWebsiteContent } from '@/hooks/useWebsite'
import { NotificationBell } from '@/components/admin/NotificationBell'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/vendors', label: 'Vendors', icon: Store, end: false },
  { to: '/admin/categories', label: 'Categories', icon: Tags, end: false },
  { to: '/admin/brands', label: 'Brands', icon: Award, end: false },
  { to: '/admin/collections', label: 'Collections', icon: Layers, end: false },
  { to: '/admin/attributes', label: 'Attributes', icon: SlidersHorizontal, end: false },
  { to: '/admin/colors', label: 'Colors', icon: Palette, end: false },
  { to: '/admin/sizes', label: 'Sizes', icon: Ruler, end: false },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket, end: false },
  { to: '/admin/products', label: 'Products', icon: Package, end: false },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, end: false },
  { to: '/admin/vendor-orders', label: 'Vendor Orders', icon: ShoppingBasket, end: false },
  { to: '/admin/shipments', label: 'Shipments', icon: Truck, end: false },
  { to: '/admin/shipping', label: 'Shipping Settings', icon: PackageCheck, end: false },
  { to: '/admin/users', label: 'Users', icon: Users, end: false },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard, end: false },
  { to: '/admin/wallet', label: 'Wallet', icon: Wallet, end: false },
  { to: '/admin/payouts', label: 'Payout Requests', icon: Banknote, end: false },
  { to: '/admin/returns', label: 'Returns', icon: RotateCcw, end: false },
  { to: '/admin/reviews', label: 'Reviews', icon: Star, end: false },
  { to: '/admin/wishlist-insights', label: 'Wishlist Insights', icon: Heart, end: false },
  { to: '/admin/vendor-reviews', label: 'Vendor Reviews', icon: Store, end: false },
  { to: '/admin/questions', label: 'Q&A', icon: CheckCircle2, end: false },
  { to: '/admin/support', label: 'Vendor Support', icon: LifeBuoy, end: false },
  { to: '/admin/customer-support', label: 'Customer Support', icon: MessagesSquare, end: false },
  { to: '/admin/order-queries', label: 'Order Queries', icon: MessageCircleQuestion, end: false },
  { to: '/admin/product-queries', label: 'Product Queries', icon: MessageSquareText, end: false },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell, end: false },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3, end: false },
]

const websiteLinks = [
  { to: '/admin/homepage', label: 'Homepage', icon: LayoutGrid, end: false },
  { to: '/admin/category-pages', label: 'Category Pages', icon: Layers, end: false },
  { to: '/admin/pages', label: 'Pages', icon: FileStack, end: false },
  { to: '/admin/browse-subcategories', label: 'Browse Subcategories', icon: Shapes, end: false },
  { to: '/admin/website-settings', label: 'Website Settings', icon: Globe, end: false },
]

export function AdminLayout() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const location = useLocation()
  const { data: website } = useWebsiteContent()
  const storeName = website?.navbar?.logo?.text?.trim() || 'Waplia'
  const { data: unread } = useAdminNotificationsUnreadCount(15_000)
  const unreadCount = unread?.count ?? 0
  // Live popup + instant bell badge when a new notification lands on any page.
  useAdminNotificationsRealtime()
  // Vendors and customers are separate inboxes with separate queues, so each
  // badge has to come from its own counts endpoint.
  const { data: vendorSupportCounts } = useSupportInboxCounts('VENDOR')
  const { data: customerSupportCounts } = useSupportInboxCounts('CUSTOMER')
  const { data: orderQueryCounts } = useSupportInboxCounts('ORDER_QUERY')
  const { data: productQueryCounts } = useSupportInboxCounts('PRODUCT_QUERY')
  const supportAwaiting: Record<string, number> = {
    '/admin/support': vendorSupportCounts?.open_count ?? vendorSupportCounts?.awaiting_admin ?? 0,
    '/admin/customer-support': customerSupportCounts?.open_count ?? customerSupportCounts?.awaiting_admin ?? 0,
    '/admin/order-queries': orderQueryCounts?.awaiting_admin ?? 0,
    '/admin/product-queries': productQueryCounts?.awaiting_admin ?? 0,
  }

  const isActive = (link: { to: string; end?: boolean }) =>
    link.end ? location.pathname === link.to : location.pathname === link.to || location.pathname.startsWith(`${link.to}/`)

  const [websiteOpen, setWebsiteOpen] = useState(() => websiteLinks.some(isActive))
  const websiteActive = websiteLinks.some(isActive)
  const websiteExpanded = websiteOpen

  useEffect(() => {
    if (websiteActive) setWebsiteOpen(true)
  }, [websiteActive])

  const currentPage =
    links.find(isActive)?.label ?? websiteLinks.find(isActive)?.label ?? 'Admin'

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
            <p className="truncate font-display text-base font-bold leading-tight">{storeName}</p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              {t('Admin Panel')}
            </span>
          </div>
        </div>

        <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto p-3">
          <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('Marketplace')}
          </p>
          <button
            type="button"
            onClick={() => setWebsiteOpen((v) => !v)}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              websiteActive
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Globe className="h-4 w-4" />
            <span className="flex-1 text-left">{t('Website')}</span>
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', websiteExpanded && 'rotate-180')}
            />
          </button>
          {websiteExpanded && (
            <div className="ml-4 space-y-1 rounded-xl border-l border-border/70 bg-muted/40 py-1 pl-2 pr-1">
              {websiteLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )
                  }
                >
                  <link.icon className="h-4 w-4" />
                  <span className="flex-1">{t(link.label)}</span>
                </NavLink>
              ))}
            </div>
          )}
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
              {(supportAwaiting[link.to] ?? 0) > 0 ? (
                <span
                  className={cn(
                    'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none ring-2 ring-background',
                    isActive(link)
                      ? 'bg-background/20 text-primary-foreground'
                      : 'bg-destructive text-destructive-foreground',
                  )}
                >
                  {(supportAwaiting[link.to] ?? 0) > 99 ? '99+' : supportAwaiting[link.to]}
                </span>
              ) : null}
              {link.to === '/admin/notifications' && unreadCount > 0 ? (
                <span
                  className={cn(
                    'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none ring-2 ring-background',
                    location.pathname.startsWith('/admin/notifications')
                      ? 'bg-background/20 text-primary-foreground'
                      : 'bg-destructive text-destructive-foreground',
                  )}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 border-t p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-muted/60 p-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-gold-deep text-sm font-bold text-primary-foreground">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
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
            <p className="hidden text-xs text-muted-foreground sm:block">
              {t('Manage your marketplace from here.')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold leading-tight">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{t('Administrator')}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {user?.name?.charAt(0) ?? 'A'}
            </div>
          </div>
        </header>
        <div className="flex-1 p-6 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
