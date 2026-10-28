import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Heart, HelpCircle, LayoutGrid, Mail, ShoppingBag, X } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { resolveLinkDepartments, useDepartmentsScope } from '@/hooks/useDepartmentsScope'
import type { Category, DepartmentsSettings, NavLinkConfig } from '@/types'
import { useTranslation } from 'react-i18next'

export function MobileMenu({
  open,
  onClose,
  departments,
  links,
  logoText,
}: {
  open: boolean
  onClose: () => void
  departments: DepartmentsSettings
  links: NavLinkConfig[]
  logoText: string
}) {
  const { t } = useTranslation()
  const { data: categories = [] } = useCategories()
  const settings = useDepartmentsScope(departments, links)

  const allTop = categories.filter((category) => category.is_active !== false)

  // Kalki-style tabs: one panel per top-level nav link that carries departments.
  const tabLinks = links.filter((link) => {
    if (link.new_tab || !link.url.startsWith('/')) return false
    const scope = resolveLinkDepartments(departments, link)
    return scope !== null
  })
  // Fall back to all links if none carry departments, so the menu is never empty.
  const tabs = tabLinks.length > 0 ? tabLinks : links.filter((l) => l.url.startsWith('/') && !l.new_tab)

  const [activeTabKey, setActiveTabKey] = useState<string>(tabs[0] ? `${tabs[0].label}-${tabs[0].url}` : '')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Reset state whenever the drawer is (re)opened.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setActiveTabKey(tabs[0] ? `${tabs[0].label}-${tabs[0].url}` : '')
      setExpanded(new Set())
    }
  }

  // Lock body scroll while the drawer is open. Using `position: fixed` on the
  // body is the only approach that reliably stops background scrolling on
  // mobile browsers (iOS in particular ignores `overflow: hidden` alone).
  useEffect(() => {
    if (!open) return
    const scrollY = window.scrollY
    const previous = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
      htmlOverflow: document.documentElement.style.overflow,
    }
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    return () => {
      document.documentElement.style.overflow = previous.htmlOverflow
      document.body.style.overflow = previous.overflow
      document.body.style.position = previous.position
      document.body.style.top = previous.top
      document.body.style.width = previous.width
      window.scrollTo(0, scrollY)
    }
  }, [open])

  const close = () => onClose()

  const toggle = (key: string) => {
    setExpanded((previous) => {
      const next = new Set(previous)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const activeLink = tabs.find((link) => `${link.label}-${link.url}` === activeTabKey) ?? tabs[0]
  const activeScope = activeLink ? resolveLinkDepartments(departments, activeLink) : null
  const scopedCategories =
    activeScope && activeScope.category_ids && activeScope.category_ids.length > 0
      ? allTop.filter((category) => activeScope.category_ids!.includes(category.id))
      : allTop

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      <button type="button" className="absolute inset-0 bg-ink/45 backdrop-blur-sm" onClick={close} aria-label={t('Close menu')} />
      <div className="absolute inset-y-0 left-0 flex w-full flex-col overscroll-contain border-r border-[#d8d8d8] bg-white shadow-2xl">
        {/* Top bar: close button */}
        <div className="flex h-14 items-center justify-between border-b border-[#e5e5e5] px-4">
          <span className="heading-serif text-lg font-bold text-ink">{logoText}</span>
          <button
            type="button"
            onClick={close}
            aria-label={t('Close menu')}
            className="grid h-9 w-9 place-items-center text-ink transition-colors hover:text-gold-deep"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Sign in / Sign up banner */}
        <div className="flex items-center justify-between gap-3 border-b border-[#e5e5e5] bg-[#faf7f2] px-4 py-3">
          <span className="text-[13px] font-medium text-ink">Get exclusive insider information.</span>
          <Link to="/login" onClick={close} className="flex items-center gap-1 text-[13px] font-semibold text-[#781710]">
            Sign in/Sign Up
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#e5e5e5]">
          <div className="flex items-stretch overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((link) => {
              const key = `${link.label}-${link.url}`
              const isActive = key === activeTabKey
              const isExternal = link.new_tab || !link.url.startsWith('/')
              if (isExternal) {
                return (
                  <a
                    key={key}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={close}
                    className={`shrink-0 px-4 py-3 text-[14px] font-medium tracking-wide ${isActive ? 'border-b-2 border-ink font-semibold text-ink' : 'text-[#555] hover:text-ink'}`}
                  >
                    {link.label}
                  </a>
                )
              }
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTabKey(key)}
                  className={`shrink-0 px-4 py-3 text-[14px] font-medium tracking-wide ${isActive ? 'border-b-2 border-ink font-semibold text-ink' : 'text-[#555] hover:text-ink'}`}
                >
                  {link.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {activeScope && (
            <ul className="divide-y divide-[#f0f0f0] py-1">
              {activeScope.show_all && (
                <li>
                  <button
                    type="button"
                    onClick={() => toggle('all-departments')}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-left text-[15px] font-medium text-ink"
                  >
                    <span>All Departments</span>
                    <img
                      src="https://cdn.shopify.com/s/files/1/0636/0134/4666/files/icon-arrow-new.svg"
                      alt=""
                      className={`h-3.5 w-5 transition-transform duration-200 ${expanded.has('all-departments') ? 'rotate-90' : ''}`}
                    />
                  </button>
                  {expanded.has('all-departments') && (
                    <div className="border-t border-[#f0f0f0] bg-[#fafafa]">
                      <button
                        type="button"
                        onClick={() => toggle('all-departments')}
                        className="flex w-full items-center gap-2 px-4 py-3 text-[14px] text-[#555]"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
                          <path d="M10 4L2 12L10 20" stroke="#0F0D1A" strokeWidth="1.2" strokeLinecap="round" />
                          <path d="M2 12H24" stroke="#0F0D1A" strokeWidth="1.2" />
                        </svg>
                        Back
                      </button>
                      <ul className="pb-2">
                        {allTop.map((category) => (
                          <li key={category.id}>
                            <CategoryRow category={category} onNavigate={close} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              )}

              {scopedCategories.map((category) => (
                <li key={category.id}>
                  <CategoryRow category={category} onNavigate={close} />
                </li>
              ))}

              {activeScope.show_shop_all && (
                <li>
                  <Link
                    to="/shop"
                    onClick={close}
                    className="block px-4 py-3.5 text-[15px] font-medium text-ink hover:bg-[#fafafa]"
                  >
                    Shop all
                  </Link>
                </li>
              )}
              {activeScope.show_collections && (
                <li>
                  <Link
                    to="/collections"
                    onClick={close}
                    className="block px-4 py-3.5 text-[15px] font-medium text-ink hover:bg-[#fafafa]"
                  >
                    Collections
                  </Link>
                </li>
              )}
            </ul>
          )}

          {/* Footer links (Kalki-style) */}
          <div className="border-t border-[#e5e5e5] px-4 py-4">
            <Link to="/shop" onClick={close} className="mb-3 block rounded-full bg-ink px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.12em] text-[#e9c891] transition-colors hover:bg-[#2c2620]">
              {t('Shop all products')}
            </Link>
            <div className="flex w-full items-center justify-between text-[#555]">
              <Link to="/wishlist" onClick={close} aria-label={t('Wishlist')} className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-[#f0f0f0] hover:text-ink">
                <Heart className="h-5 w-5" strokeWidth={1.5} />
              </Link>
              <Link to="/cart" onClick={close} aria-label={t('Shopping bag')} className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-[#f0f0f0] hover:text-ink">
                <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
              </Link>
              {settings.show_collections && (
                <Link to="/collections" onClick={close} aria-label={t('Collections')} className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-[#f0f0f0] hover:text-ink">
                  <LayoutGrid className="h-5 w-5" strokeWidth={1.5} />
                </Link>
              )}
              <Link to="/help" onClick={close} aria-label={t('Help center')} className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-[#f0f0f0] hover:text-ink">
                <HelpCircle className="h-5 w-5" strokeWidth={1.5} />
              </Link>
              <Link to="/contact" onClick={close} aria-label={t('Contact us')} className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-[#f0f0f0] hover:text-ink">
                <Mail className="h-5 w-5" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CategoryRow({
  category,
  onNavigate,
}: {
  category: Category
  onNavigate: () => void
}) {
  const [open, setOpen] = useState(false)
  const hasChildren = (category.children?.length ?? 0) > 0

  return (
    <div className="border-b border-[#f0f0f0] last:border-b-0">
      <div className="flex items-center">
        <Link
          to={`/category/${category.slug}`}
          onClick={onNavigate}
          className="flex-1 px-4 py-3.5 text-[15px] font-medium text-ink hover:bg-[#fafafa]"
        >
          {category.name}
        </Link>
        {hasChildren && (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="grid h-12 w-12 shrink-0 place-items-center text-[#888] transition-colors hover:text-ink"
          >
            <img
              src="https://cdn.shopify.com/s/files/1/0636/0134/4666/files/icon-arrow-new.svg"
              alt=""
              className={`h-3.5 w-5 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
            />
          </button>
        )}
      </div>
      {hasChildren && open && (
        <div className="border-t border-[#f0f0f0] bg-[#fafafa]">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-4 py-3 text-[14px] text-[#555]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <path d="M10 4L2 12L10 20" stroke="#0F0D1A" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M2 12H24" stroke="#0F0D1A" strokeWidth="1.2" />
            </svg>
            Back
          </button>
          <ul className="pb-2">
            {category.children!.map((child) => (
              <li key={child.id}>
                <Link
                  to={`/category/${child.slug}`}
                  onClick={onNavigate}
                  className="block px-6 py-2.5 text-[14px] text-[#444] hover:bg-[#f0f0f0]"
                >
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
