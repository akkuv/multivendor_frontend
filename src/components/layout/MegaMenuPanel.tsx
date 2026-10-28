import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight, ImageOff } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useProducts } from '@/hooks/useProducts'
import { assetUrl } from '@/lib/assets'
import { formatCurrency } from '@/utils/format'
import type { Category } from '@/types'

const TILE_COUNT = 8

interface MegaMenuPanelProps {
  /** Left-rail entries; the active one drives the product grid. */
  tabs: Category[]
  activeId: number | null
  onActivate: (id: number) => void
  onClose: () => void
  /** `subcategory` narrows to one child; `category` expands the whole tree. */
  scope: 'subcategory' | 'category'
  eyebrow?: string
}

/**
 * KALKI-style mega menu: a left column of category "tabs" beside a grid of
 * product tiles for the active tab. Both columns are fed from real catalogue
 * data — the tabs are the category's children, the tiles are its live products.
 */
export function MegaMenuPanel({ tabs, activeId, onActivate, onClose, scope, eyebrow }: MegaMenuPanelProps) {
  const { t } = useTranslation()
  const active = useMemo(() => tabs.find((tab) => tab.id === activeId) ?? tabs[0], [tabs, activeId])

  const query = active
    ? scope === 'subcategory'
      ? { subcategory_id: active.id, per_page: TILE_COUNT }
      : { category_scope_id: active.id, per_page: TILE_COUNT }
    : undefined

  const { data, isLoading } = useProducts(query, Boolean(active))
  const products = data?.data ?? []

  if (!active) return null

  const seeAllHref = `/category/${active.slug}`

  return (
    <div className="container-store py-6">
      <div className="flex gap-6">
        <div className="w-[220px] shrink-0 border-r border-line-warm pr-4">
          {eyebrow ? <p className="eyebrow mb-3 px-3 text-gold-deep">{eyebrow}</p> : null}
          <ul className="max-h-[58vh] space-y-0.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
            {tabs.map((tab) => {
              const on = tab.id === active.id
              return (
                <li key={tab.id}>
                  <button
                    type="button"
                    onMouseEnter={() => onActivate(tab.id)}
                    onFocus={() => onActivate(tab.id)}
                    onClick={() => onActivate(tab.id)}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition-colors ${
                      on ? 'bg-cream text-gold-deep' : 'text-ink-soft hover:bg-cream/60 hover:text-ink'
                    }`}
                  >
                    <span className="truncate">{tab.name}</span>
                    <ArrowUpRight
                      className={`h-3.5 w-3.5 shrink-0 transition-opacity ${on ? 'opacity-70' : 'opacity-0'}`}
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-end justify-between gap-3">
            <p className="truncate font-display text-lg text-ink">{active.name}</p>
            <Link
              to={seeAllHref}
              onClick={onClose}
              className="flex shrink-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-gold-deep transition-colors hover:text-ink"
            >
              {t('Shop all {{name}}', { name: active.name })}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: TILE_COUNT }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="aspect-square rounded-2xl" />
                  <Skeleton className="h-3.5 w-4/5" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product) => (
                <Link key={product.id} to={`/product/${product.slug}`} onClick={onClose} className="group block">
                  <div className="aspect-square overflow-hidden rounded-2xl bg-cream ring-1 ring-line-warm">
                    {product.images?.[0] ? (
                      <img
                        src={assetUrl(product.images[0])}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-line-warm">
                        <ImageOff className="h-6 w-6" />
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-[12.5px] font-medium leading-snug text-ink-soft transition-colors group-hover:text-gold-deep">
                    {product.name}
                  </p>
                  <p className="mt-0.5 text-[12px] font-bold text-ink">{formatCurrency(product.price)}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid place-items-center rounded-2xl border border-dashed border-line-warm py-14 text-center">
              <ImageOff className="h-6 w-6 text-line-warm" />
              <p className="mt-2 text-sm text-ink-soft">{t('No products in this collection yet.')}</p>
              <Link
                to={seeAllHref}
                onClick={onClose}
                className="mt-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-gold-deep transition-colors hover:text-ink"
              >
                {t('Shop all {{name}}', { name: active.name })}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
