import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import { MegaMenuPanel } from '@/components/layout/MegaMenuPanel'
import { useCategories } from '@/hooks/useCategories'
import { useDepartmentsScope } from '@/hooks/useDepartmentsScope'
import type { Category, DepartmentsSettings, NavLinkConfig } from '@/types'
import { assetUrl } from '@/lib/assets'

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
    pointer.current = { x: 0, y: 0, seen: false }
    setOpenPanel(null)
  }

  const holdOpen = () => {
    clearTimers()
  }

  if (!settings.enabled) return null

  const allTop = categories.filter((category) => category.is_active !== false)
  const selected = settings.category_ids ?? []
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

  // Small card styling (icon top + name bottom), no background, spread across the row.
  const cardClass = (active: boolean) =>
    `group flex flex-1 min-w-[120px] max-w-[220px] flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-3 transition-all duration-300 ${
      active
        ? 'border-gold-deep/40 bg-white shadow-[0_0_0_1px_#c4b5fd,0_8px_24px_-8px_rgba(124,58,237,0.2)]'
        : 'border-line-warm bg-white hover:border-gold-mid/60 hover:shadow-lg'
    }`

  const iconBoxClass = 'grid h-9 w-9 place-items-center rounded-lg bg-slate-50 text-[#5b4a8a] transition-transform duration-300 group-hover:scale-110 group-hover:bg-slate-100 sm:h-10 sm:w-10'
  const iconImgClass = 'h-9 w-9 rounded-lg object-contain transition-transform duration-300 group-hover:scale-110 sm:h-10 sm:w-10'
  const labelClass = 'line-clamp-2 text-center text-[11px] font-semibold leading-tight text-[#2a2540] sm:text-[12px]'

  return (
    <nav className="relative border-b border-[#e8e4f0] bg-white">
      <div className="container-store flex items-center gap-4 py-3 sm:py-4">
        <div
          ref={rowRef}
          className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4"
        >
          {settings.show_all && (
            <div data-departments-trigger className="shrink-0" onMouseEnter={openShopPanel} onMouseLeave={requestClose}>
              <button
                type="button"
                aria-expanded={openPanel === 'shop'}
                aria-haspopup="true"
                aria-controls="departments-panel"
                onClick={() => (openPanel === 'shop' ? closePanel() : openShopPanel())}
                className={cardClass(openPanel === 'shop')}
              >
                {settings.all_icon ? (
                  <img src={assetUrl(settings.all_icon)} alt={t('All Categories')} loading="lazy" className={iconImgClass} />
                ) : (
                  <LayoutGrid className="h-9 w-9 text-[#5b4a8a] transition-transform duration-300 group-hover:scale-110 sm:h-10 sm:w-10" />
                )}
                <span className={labelClass}>{t('All Categories')}</span>
              </button>
            </div>
          )}

          {shown.map((category) => {
            const hasChildren = (category.children?.length ?? 0) > 0
            const isOpen = openPanel === category.id
            const iconSrc = category.icon || category.image
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
                  className={({ isActive }) => `group ${cardClass(isActive || isOpen).replace('group ', '')}`}
                >
                  {iconSrc ? (
                    <img
                      src={assetUrl(iconSrc)}
                      alt={category.name}
                      loading="lazy"
                      className={iconImgClass}
                    />
                  ) : (
                    <span className={iconBoxClass}>
                      <LayoutGrid className="h-5 w-5 sm:h-6 sm:w-6" />
                    </span>
                  )}
                  <span className={labelClass}>{category.name}</span>
                </NavLink>
              </div>
            )
          })}

          {settings.show_shop_all && (
            <Link to="/shop" className={cardClass(false)}>
              {settings.shop_all_icon ? (
                <img src={assetUrl(settings.shop_all_icon)} alt={t('Shop all')} loading="lazy" className={iconImgClass} />
              ) : (
                <span className={iconBoxClass}>
                  <LayoutGrid className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 sm:h-6 sm:w-6" />
                </span>
              )}
              <span className={labelClass}>{t('Shop all')}</span>
            </Link>
          )}

          {settings.show_collections && (
            <NavLink
              to="/collections"
              className={({ isActive }) => `group ${cardClass(isActive).replace('group ', '')}`}
            >
              {settings.collections_icon ? (
                <img src={assetUrl(settings.collections_icon)} alt={t('Collections')} loading="lazy" className={iconImgClass} />
              ) : (
                <span className={iconBoxClass}>
                  <LayoutGrid className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 sm:h-6 sm:w-6" />
                </span>
              )}
              <span className={labelClass}>{t('Collections')}</span>
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