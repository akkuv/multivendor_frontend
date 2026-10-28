import { useEffect, useState } from 'react'
import { assetUrl } from '@/lib/assets'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Heart,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  Shirt,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/authStore'
import { useCart } from '@/hooks/useCart'
import { useWishlistCount } from '@/hooks/useWishlist'
import { useHydrated } from '@/hooks/useHydrated'
import { useLogout } from '@/hooks/useAuth'
import { useWebsiteContent } from '@/hooks/useWebsite'
import { DepartmentsBar } from '@/components/layout/DepartmentsBar'
import { FooterSocialBlock } from '@/components/layout/SocialLinks'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { UserNotificationBell } from '@/components/user/UserNotificationBell'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { useTranslation } from 'react-i18next'
import type { FormEvent, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { FooterSettings, NavbarSettings } from '@/types'

const defaultNavbar: NavbarSettings = {
  announcement: { enabled: false, text: '', url: null },
  logo: { text: 'Waplia', image: null, url: '/' },
  links: [
    { label: 'Home', url: '/', new_tab: false },
    { label: 'Shop', url: '/shop', new_tab: false },
  ],
  departments: { enabled: true, category_ids: null, show_all: true, show_shop_all: true, show_collections: true },
}

function ContentLink({
  url,
  newTab,
  className,
  children,
}: {
  url: string
  newTab?: boolean
  className?: string
  children: ReactNode
}) {
  const external = !url.startsWith('/')
  const openNewTab = newTab || external
  const linkProps = openNewTab ? { target: '_blank', rel: 'noreferrer' } : {}

  if (external) {
    return (
      <a href={url} {...linkProps} className={className}>
        {children}
      </a>
    )
  }

  return (
    <Link to={url} {...linkProps} className={className}>
      {children}
    </Link>
  )
}

function Monogram({ className }: { className?: string }) {
  return (
    <span
      className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#b89045] via-[#c9a25a] to-[#8a6a1f] text-white shadow-sm ${className ?? ''}`}
    >
      <Shirt className="h-4 w-4" />
    </span>
  )
}

function SearchField({ onSearch, className }: { onSearch: (value: string) => void; className?: string }) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSearch(value.trim())
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className ?? ''}`} role="search">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/60" />
      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t('Search for products, brands and more')}
        aria-label={t('Search products')}
        className="h-11 rounded-full border-line-warm bg-white pl-11 pr-20 text-sm focus-visible:border-gold-deep focus-visible:ring-gold-deep/15"
      />
      <button
        type="submit"
        className="absolute right-1 top-1 h-9 rounded-full bg-ink px-4 text-xs font-bold text-[#e9c891] transition-colors hover:bg-[#2c2620]"
      >
        {t('Search')}
      </button>
    </form>
  )
}

function AnnouncementBar({
  message,
  url,
}: {
  message?: string
  url?: string | null
}) {
  const { t } = useTranslation()

  const slides: { icon: LucideIcon; text: string; url: string | null }[] = [
    ...(message ? [{ icon: Sparkles, text: message, url: url ?? null }] : []),
    { icon: Truck, text: t('Free shipping on orders above the threshold'), url: null },
    { icon: ShieldCheck, text: t('Easy 30-day returns & exchanges'), url: null },
    { icon: BadgeCheck, text: t('Verified makers & designer-quality styles'), url: null },
    { icon: Sparkles, text: t('Concierge styling advice, on request'), url: null },
  ]

  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), 3200)
    return () => window.clearInterval(timer)
  }, [slides.length])

  const slide = slides[Math.min(index, slides.length - 1)]
  if (!slide) return null

  const Icon = slide.icon
  const inner = (
    <span key={index} className="animate-fade-up flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{slide.text}</span>
    </span>
  )

  return (
    <div className="bg-ink text-cream">
      <div className="container-store flex min-h-9 items-center justify-center py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-[#e9d9b0] sm:text-[11px]">
        {slide.url ? (
          <ContentLink url={slide.url} className="hover:underline">
            {inner}
          </ContentLink>
        ) : (
          inner
        )}
      </div>
    </div>
  )
}

function Newsletter() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  return (
    <div className="relative overflow-hidden rounded-[1.4rem] border border-line-warm bg-gradient-to-br from-cream via-ivory to-ivory px-5 py-9 sm:rounded-[1.75rem] sm:px-10 sm:py-12">
      <span className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-gold-mid/15 blur-3xl" />
      <span className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-gold-mid/10 blur-3xl" />

      <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_1fr] lg:gap-14">
        <div>
          <span className="inline-flex w-fit items-center gap-2.5 rounded-full border border-line-warm bg-ivory py-1.5 pl-2.5 pr-3.5 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-mid opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-deep" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">{t('Be first to know')}</span>
          </span>

          <h2 className="heading-serif mt-4 text-2xl font-bold leading-[1.15] text-ink sm:text-[2rem]">
            {done ? t('You’re on the style list!') : t('New drops, private offers and more')}
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-soft">
            {done
              ? t('Watch your inbox for fashion previews, curated edits and member-only offers.')
              : t('Sign up for early access to fresh arrivals, trend stories and limited-time offers.')}
          </p>

          {!done && (
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
              {[
                t('Early access to fresh arrivals'),
                t('Weekly trend stories'),
                t('Member-only offers'),
              ].map((item) => (
                <li key={item} className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-gold-deep" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        {done ? (
          <div className="flex items-start gap-4 rounded-2xl border border-line-warm bg-ivory p-5 backdrop-blur">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-[#e9c891]">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-ink">{t('Thanks for joining the Waplia fashion community.')}</p>
              <p className="mt-1 text-xs text-ink-soft">{t('Your address has been added to the list.')}</p>
            </div>
          </div>
        ) : (
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault()
              if (email.trim()) setDone(true)
            }}
          >
            <div className="flex flex-1 items-center gap-3 rounded-full border border-line-warm bg-white px-5 shadow-sm transition-all focus-within:border-gold-mid focus-within:ring-4 focus-within:ring-gold-mid/15">
              <Mail className="h-4 w-4 shrink-0 text-ink-soft/60" />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('Enter your email address')}
                aria-label={t('Email address')}
                className="h-12 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/50"
              />
            </div>
            <Button
              type="submit"
              className="h-12 shrink-0 rounded-full bg-ink px-7 text-sm font-bold text-[#e9c891] transition-transform hover:-translate-y-0.5 hover:bg-[#2c2620]"
            >
              {t('Subscribe')} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

export function StoreLayout() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const isHydrated = useHydrated()
  const logout = useLogout()
  const { data: cart } = useCart(!!token && user?.role === 'CUSTOMER')
  const navigate = useNavigate()
  const location = useLocation()
  const { data } = useWebsiteContent()
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const navbar: NavbarSettings = data?.navbar ?? defaultNavbar
  const footer: FooterSettings = data?.footer ?? {
    about: { text: t('A fashion marketplace for trendsetters and everyday icons.') },
    columns: [],
    social: { enabled: true, title: t('Follow us'), description: '', style: 'icons', links: [] },
    contact: { email: '', phone: '', address: '' },
    copyright: t('All rights reserved.'),
  }

  const itemCount = cart?.item_count ?? 0
  const { data: wishlistCount = 0 } = useWishlistCount(!!token && user?.role === 'CUSTOMER')
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U'
  const hasContact = Boolean(footer.contact.email || footer.contact.phone || footer.contact.address)

  const handleSearch = (value: string) => {
    navigate(value ? `/shop?search=${encodeURIComponent(value)}` : '/shop')
  }

  if (!isHydrated || !data) {
    return null
  }

  return (
    <div className="font-store flex min-h-screen flex-col overflow-x-clip bg-ivory text-ink">
      <AnnouncementBar
        message={navbar.announcement.enabled && navbar.announcement.text ? navbar.announcement.text : undefined}
        url={navbar.announcement.url}
      />

      <header className="sticky top-0 z-40 border-b border-line-warm bg-ivory/95 backdrop-blur-xl">
        <div className="container-store flex h-[70px] items-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label={t('Open menu')}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-cream md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <ContentLink url={navbar.logo.url} className="flex shrink-0 items-center gap-2.5">
            {navbar.logo.image ? (
              <img
                src={assetUrl(navbar.logo.image)}
                alt={navbar.logo.text}
                className="h-9 w-auto max-w-36 object-contain"
              />
            ) : (
              <Monogram />
            )}
            <span className="heading-serif text-[1.6rem] font-bold leading-none text-ink sm:text-[1.8rem]">
              {navbar.logo.text}
            </span>
          </ContentLink>

          {navbar.links.length > 0 && (
            <nav className="hidden items-center gap-0.5 xl:flex">
              {navbar.links.map((link) =>
                link.url.startsWith('/') ? (
                  <NavLink
                    key={`${link.label}-${link.url}`}
                    to={link.url}
                    end={link.url === '/'}
                    className={({ isActive }) =>
                      `rounded-full px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${isActive ? 'bg-cream text-gold-deep' : 'text-ink-soft hover:text-ink'}`
                    }
                  >
                    {t(link.label)}
                  </NavLink>
                ) : (
                  <a
                    key={`${link.label}-${link.url}`}
                    href={link.url}
                    target={link.new_tab ? '_blank' : undefined}
                    rel={link.new_tab ? 'noreferrer' : undefined}
                    className="rounded-full px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-soft transition-colors hover:text-ink"
                  >
                    {t(link.label)}
                  </a>
                ),
              )}
            </nav>
          )}

          <SearchField onSearch={handleSearch} className="ml-auto hidden w-full max-w-md md:block" />

          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:ml-1 sm:gap-1.5">
            <LanguageSwitcher className="hidden sm:block" />
            {token && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-ink transition-colors hover:text-gold-deep sm:flex" aria-label={t('Account')}>
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="bg-cream text-[8px] font-extrabold text-gold-deep">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-[9px] font-bold">{t('Account')}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 border-line-warm bg-ivory">
                  <DropdownMenuLabel>
                    <span className="block text-xs text-ink-soft">{t('Welcome back')}</span>
                    <span className="mt-0.5 block truncate font-bold text-ink">{user.name}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/account"><User className="mr-2 h-4 w-4" /> {t('Account')}</Link>
                  </DropdownMenuItem>
                  {user.role === 'VENDOR' && (
                    <DropdownMenuItem asChild>
                      <Link to="/vendor"><LayoutDashboard className="mr-2 h-4 w-4" /> {t('Vendor Panel')}</Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === 'SUPER_ADMIN' && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin"><LayoutDashboard className="mr-2 h-4 w-4" /> {t('Admin Panel')}</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout.mutate()}>
                    <LogOut className="mr-2 h-4 w-4" /> {t('Logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login" className="hidden flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-ink transition-colors hover:text-gold-deep sm:flex">
                <User className="h-5 w-5" />
                <span className="text-[9px] font-bold">{t('Account')}</span>
              </Link>
            )}

            {token && user?.role === 'CUSTOMER' ? <UserNotificationBell /> : null}

            <Link to="/wishlist" className="relative flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-ink transition-colors hover:text-gold-deep" aria-label={t('Wishlist')}>
              <Heart className="h-5 w-5" />
              <span className="hidden text-[9px] font-bold sm:block">{t('Wishlist')}</span>
              {wishlistCount > 0 && (
                <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[9px] font-extrabold text-[#e9c891] shadow-sm ring-1 ring-line-warm">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-ink transition-colors hover:text-gold-deep" aria-label={t('Shopping bag')}>
              <ShoppingBag className="h-5 w-5" />
              <span className="hidden text-[9px] font-bold sm:block">{t('Cart')}</span>
              {itemCount > 0 && (
                <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[9px] font-extrabold text-[#e9c891] shadow-sm ring-1 ring-line-warm">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="px-4 pb-3 md:hidden">
          <SearchField onSearch={handleSearch} />
        </div>
        <DepartmentsBar departments={navbar.departments} links={navbar.links} />
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line-warm bg-cream text-ink">
        <div className="container-store py-12 sm:py-16">
          <Newsletter />

          <div className="mt-12 grid gap-10 lg:grid-cols-[1.35fr_0.85fr_0.85fr_0.85fr]">
            <div>
              <ContentLink url={navbar.logo.url} className="flex items-center gap-2.5">
                {navbar.logo.image ? (
                  <img
                    src={assetUrl(navbar.logo.image)}
                    alt={navbar.logo.text}
                    className="h-9 w-auto max-w-36 object-contain"
                  />
                ) : (
                  <Monogram />
                )}
                <span className="heading-serif text-2xl font-bold text-ink">{navbar.logo.text}</span>
              </ContentLink>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-soft">{footer.about.text}</p>
              {hasContact && (
                <div className="mt-5 space-y-2.5 text-sm text-ink-soft">
                  {footer.contact.email && (
                    <a href={`mailto:${footer.contact.email}`} className="flex items-center gap-2.5 transition-colors hover:text-gold-deep">
                      <Mail className="h-4 w-4 text-gold-deep" /> {footer.contact.email}
                    </a>
                  )}
                  {footer.contact.phone && (
                    <a href={`tel:${footer.contact.phone}`} className="flex items-center gap-2.5 transition-colors hover:text-gold-deep">
                      <Phone className="h-4 w-4 text-gold-deep" /> {footer.contact.phone}
                    </a>
                  )}
                  {footer.contact.address && (
                    <p className="flex items-center gap-2.5">
                      <MapPin className="h-4 w-4 shrink-0 text-gold-deep" /> {footer.contact.address}
                    </p>
                  )}
                </div>
              )}
            </div>

            {footer.columns.map((column) => (
              <div key={column.title}>
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-ink">{column.title}</h3>
                <ul className="space-y-2.5">
                  {column.links.map((link) => (
                    <li key={`${link.label}-${link.url}`}>
                      <ContentLink url={link.url} newTab={link.new_tab} className="text-sm font-medium text-ink-soft transition-colors hover:text-gold-deep">
                        {link.label}
                      </ContentLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <FooterSocialBlock social={footer.social} />

          <div className="mt-8 flex flex-col items-center justify-between gap-5 border-t border-line-warm pt-7 sm:flex-row">
            <p className="text-xs text-ink-soft/70">{footer.copyright || `© ${new Date().getFullYear()} ${navbar.logo.text}. ${t('All rights reserved.')}`}</p>
          </div>
        </div>

        <div className="bg-ink text-[#e9d9b0]">
          <div className="container-store flex min-h-12 items-center justify-center gap-3 px-4 text-center text-[10px] font-bold uppercase tracking-[0.22em] sm:text-[11px]">
            <span>{t('Fresh styles')}</span>
            <span className="h-1 w-1 rounded-full bg-[#e9d9b0]/65" />
            <span>{t('Trending now')}</span>
            <span className="h-1 w-1 rounded-full bg-[#e9d9b0]/65" />
            <span>{t('Delivered with care')}</span>
          </div>
        </div>
      </footer>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        departments={navbar.departments}
        links={navbar.links}
        logoText={navbar.logo.text}
      />
    </div>
  )
}