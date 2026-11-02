import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, LayoutGrid } from 'lucide-react'
import { MegaMenuPanel } from '@/components/layout/MegaMenuPanel'
import { useCategories } from '@/hooks/useCategories'
import { useDepartmentsScope } from '@/hooks/useDepartmentsScope'
import type { Category, DepartmentsSettings, NavLinkConfig } from '@/types'

const OPEN_DELAY = 70
const CLOSE_DELAY = 150

export function DepartmentsBar({
  departments,
  links,
}: {
  departments: DepartmentsSettings
  links?: NavLinkConfig[]
}) {
  const { t } = useTranslation()
  const { data: categories = [] } = useCategories()
  const location = useLocation()
  const settings = useDepartmentsScope(departments, links)
  const rowRef = useRef<HTMLDivElement>(null)
  const [openPanel, setOpenPanel] = useState<'shop' | number | null>(null)
  const [activeTabId, setActiveTabId] = useState<number | null>(null)
  const openTimer = useRef<number | null>(null)
  const closeTimer = useRef<number | null>(null)
  const pointer = useRef({ x: 0, y: 0, seen: false })

  useEffect(() => {
    setOpenPanel(null)
  }, [location.pathname])

  useEffect(() => {
    if (openPanel === null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenPanel(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openPanel])

  // The panel is absolutely positioned inside the sticky header, so it is
  // already anchored to the bar and never needs the page scroll-locked.
  // Locking instead detached `position: sticky` and scrolled the whole header
  // off-screen, which broke hovering. Scrolling simply dismisses the menu.
  useEffect(() => {
    if (openPanel === null) return
    const onScroll = () => {
      if (openTimer.current !== null) window.clearTimeout(openTimer.current)
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
      setOpenPanel(null)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [openPanel])

  useEffect(() => {
    if (openPanel === null) return
    const onPointerMove = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY, seen: true }
    }
    document.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => document.removeEventListener('pointermove', onPointerMove)
  }, [openPanel])

  // A horizontally scrolled chip row would leave the panel misaligned.
  useEffect(() => {
    const row = rowRef.current
    if (!row) return
    const onScroll = () => setOpenPanel(null)
    row.addEventListener('scroll', onScroll, { passive: true })
    return () => row.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(
    () => () => {
      if (openTimer.current !== null) window.clearTimeout(openTimer.current)
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    },
    [],
  )

  const clearTimers = () => {
    if (openTimer.current !== null) {
      window.clearTimeout(openTimer.current)
      openTimer.current = null
    }
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const openShopPanel = () => {
    clearTimers()
    setActiveTabId(null)
    setOpenPanel('shop')
  }

  const openCategoryPanel = (categoryId: number) => {
    clearTimers()
    openTimer.current = window.setTimeout(() => {
      setActiveTabId(null)
      setOpenPanel(categoryId)
    }, OPEN_DELAY)
  }

  const requestClose = () => {
    clearTimers()
    closeTimer.current = window.setTimeout(() => {
      // Never close while the cursor is still resting on a trigger or inside the panel.
      const { x, y, seen } = pointer.current
      if (seen) {
        const hovered = document.elementFromPoint(x, y)
        if (hovered?.closest('#departments-panel, [data-departments-trigger]')) return
      }
      setOpenPanel(null)
    }, CLOSE_DELAY)
  }

  const closePanel = () => {
    clearTimers()
    // Forget the last pointer position so a stale hit-test cannot keep a
    // freshly opened panel alive.
    pointer.current = { x: 0, y: 0, seen: false }
    setOpenPanel(null)
  }

  // Keeps an already-open panel open while the cursor moves across it.
  const holdOpen = () => {
    clearTimers()
  }

  if (!settings.enabled) return null

  const allTop = categories.filter((category) => category.is_active !== false)
  const selected = settings.category_ids ?? []
  // Respect the order chosen by the admin in the settings panel (category_ids
  // is an ordered list, not just a set).
  const shown =
    selected.length > 0
      ? selected
          .map((id) => allTop.find((category) => category.id === id))
          .filter((category): category is Category => Boolean(category))
      : allTop

  const activeDepartment = typeof openPanel === 'number' ? shown.find((category) => category.id === openPanel) : undefined
  const departmentChildren = activeDepartment?.children ?? []
  const panelTabs: Category[] =
    openPanel === 'shop' ? shown : activeDepartment ? (departmentChildren.length > 0 ? departmentChildren : [activeDepartment]) : []
  const panelScope: 'subcategory' | 'category' = activeDepartment && departmentChildren.length > 0 ? 'subcategory' : 'category'

  return (
    <nav className="relative hidden border-b border-line-warm bg-white md:block">
      <div className="container-store flex h-[72px] items-center gap-6">
        {/* Departments row (text-based, scrollable) */}
        <div ref={rowRef} className="flex min-w-0 flex-1 items-center gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {settings.show_all && (
            <div data-departments-trigger className="relative shrink-0" onMouseEnter={openShopPanel} onMouseLeave={requestClose}>
              <button
                type="button"
                aria-expanded={openPanel === 'shop'}
                aria-haspopup="true"
                aria-controls="departments-panel"
                onClick={() => (openPanel === 'shop' ? closePanel() : openShopPanel())}
                className="group relative flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.12em] text-[#3a332a] transition-colors hover:text-gold-deep"
              >
                <LayoutGrid className="h-4 w-4" />
                {t('Shop')}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${openPanel === 'shop' ? 'rotate-180' : ''}`} />
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-gold-deep transition-all duration-300 group-hover:w-full" />
              </button>
            </div>
          )}

          {shown.map((category) => {
            const hasChildren = (category.children?.length ?? 0) > 0
            const isOpen = openPanel === category.id
            return (
              <div
                key={category.id}
                data-departments-trigger
                className="shrink-0"
                onMouseEnter={hasChildren ? () => openCategoryPanel(category.id) : openShopPanel}
                onMouseLeave={requestClose}
              >
                <NavLink
                  to={`/category/${category.slug}`}
                  aria-expanded={hasChildren ? isOpen : undefined}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-1 text-[13px] font-bold uppercase tracking-[0.12em] transition-colors ${
                      isActive || isOpen ? 'text-gold-deep' : 'text-[#3a332a] hover:text-gold-deep'
                    }`
                  }
                >
                  {category.name}
                  {hasChildren && (
                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  )}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-gold-deep transition-all duration-300 group-hover:w-full" />
                </NavLink>
              </div>
            )
          })}
        </div>

        {/* Right-side pill action buttons */}
        <div className="flex shrink-0 items-center gap-3">
          {settings.show_shop_all && (
            <Link
              to="/shop"
              className="inline-flex h-9 items-center justify-center rounded-full border border-gold-mid/60 bg-white px-5 text-[11px] font-bold uppercase tracking-[0.12em] text-gold-deep transition-colors hover:border-gold-deep hover:bg-cream"
            >
              {t('Shop all')}
            </Link>
          )}
          {settings.show_collections && (
            <NavLink
              to="/collections"
              className={({ isActive }) =>
                `inline-flex h-9 items-center justify-center rounded-full border px-5 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                  isActive
                    ? 'border-gold-deep bg-cream text-gold-deep'
                    : 'border-gold-mid/60 bg-white text-gold-deep hover:border-gold-deep hover:bg-cream'
                }`
              }
            >
              {t('Collections')}
            </NavLink>
          )}
        </div>
      </div>

      {(openPanel === 'shop' || activeDepartment) && panelTabs.length > 0 && (
        <div
          id="departments-panel"
          onMouseEnter={holdOpen}
          onMouseLeave={requestClose}
          className="absolute inset-x-0 top-full z-50 origin-top animate-menu-drop border-b border-line-warm bg-ivory shadow-[0_44px_80px_-32px_rgba(40,30,15,0.4)]"
        >
          <MegaMenuPanel
            tabs={panelTabs}
            activeId={activeTabId}
            onActivate={setActiveTabId}
            onClose={closePanel}
            scope={panelScope}
            eyebrow={openPanel === 'shop' ? t('Shop by department') : activeDepartment?.name}
          />
        </div>
      )}
    </nav>
  )
}
