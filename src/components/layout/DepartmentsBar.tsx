import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, LayoutGrid } from 'lucide-react'
import { MegaMenuPanel } from '@/components/layout/MegaMenuPanel'
import { assetUrl } from '@/lib/assets'
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
    <nav className="relative border-b border-[#e8e4f0] bg-[#faf8fd]">
      <div className="container-store flex h-[108px] items-center gap-3 sm:h-[104px]">
        {/* Cards row (icon top + name bottom), horizontally scrollable */}
        <div
          ref={rowRef}
          className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4"
        >
          {settings.show_all && (
            <div data-departments-trigger className="shrink-0" onMouseEnter={openShopPanel} onMouseLeave={requestClose}>
              <button
                type="button"
                aria-expanded={openPanel === 'shop'}
                aria-haspopup="true"
                aria-controls="departments-panel"
                onClick={() => (openPanel === 'shop' ? closePanel() : openShopPanel())}
                className={`group flex w-[108px] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl px-2 py-3 transition-all duration-300 sm:w-[124px] ${
                  openPanel === 'shop'
                    ? 'bg-[#e9e2f7] shadow-[0_0_0_1px_#c4b5fd,0_8px_24px_-8px_rgba(124,58,237,0.25)]'
                    : 'bg-[#f3f0fa] hover:-translate-y-0.5 hover:bg-[#ebe5f7] hover:shadow-md'
                }`}
              >
                <LayoutGrid className="h-9 w-9 text-[#5b4a8a] transition-transform duration-300 group-hover:scale-110 sm:h-10 sm:w-10" />
                <span className="text-center text-[11px] font-semibold leading-tight text-[#2a2540] sm:text-[12px]">
                  {t('All Categories')}
                </span>
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
                    `group flex w-[88px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-2.5 transition-all duration-300 sm:w-[96px] ${
                      isActive || isOpen
                        ? 'bg-[#e9e2f7] shadow-[0_0_0_1px_#c4b5fd,0_8px_24px_-8px_rgba(124,58,237,0.25)]'
                        : 'bg-[#f3f0fa] hover:-translate-y-0.5 hover:bg-[#ebe5f7] hover:shadow-md'
                    }`
                  }
                >
                  {category.image ? (
                    <img
                      src={assetUrl(category.image)}
                      alt={category.name}
                      loading="lazy"
                      className="h-9 w-9 rounded-xl object-contain transition-transform duration-300 group-hover:scale-110 sm:h-10 sm:w-10"
                    />
                  ) : (
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/60 text-[#5b4a8a] sm:h-10 sm:w-10">
                      <LayoutGrid className="h-5 w-5 sm:h-6 sm:w-6" />
                    </span>
                  )}
                  <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-[#2a2540] sm:text-[12px]">
                    {category.name}
                  </span>
                </NavLink>
              </div>
            )
          })}

          {/* More card */}
          {shown.length > 0 && (
            <div className="shrink-0">
              <Link
                to="/shop"
                className="group flex w-[88px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl bg-[#f3f0fa] px-2 py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#ebe5f7] hover:shadow-md sm:w-[96px]"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/60 text-[#5b4a8a] sm:h-10 sm:w-10">
                  <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>
                <span className="text-center text-[11px] font-semibold leading-tight text-[#2a2540] sm:text-[12px]">
                  {t('More')}
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* Right-side action cards (same card style as categories) */}
        <div className="flex shrink-0 items-center gap-3">
          {settings.show_shop_all && (
            <Link
              to="/shop"
              className="group flex w-[88px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl bg-[#f3f0fa] px-2 py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#ebe5f7] hover:shadow-md sm:w-[96px]"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/60 text-[#5b4a8a] transition-transform duration-300 group-hover:scale-110 sm:h-10 sm:w-10">
                <LayoutGrid className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-[#2a2540] sm:text-[12px]">
                {t('Shop all')}
              </span>
            </Link>
          )}
          {settings.show_collections && (
            <NavLink
              to="/collections"
              className={({ isActive }) =>
                `group flex w-[88px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:w-[96px] ${
                  isActive
                    ? 'bg-[#e9e2f7] shadow-[0_0_0_1px_#c4b5fd,0_8px_24px_-8px_rgba(124,58,237,0.25)]'
                    : 'bg-[#f3f0fa] hover:bg-[#ebe5f7]'
                }`
              }
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/60 text-[#5b4a8a] transition-transform duration-300 group-hover:scale-110 sm:h-10 sm:w-10">
                <LayoutGrid className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-[#2a2540] sm:text-[12px]">
                {t('Collections')}
              </span>
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
