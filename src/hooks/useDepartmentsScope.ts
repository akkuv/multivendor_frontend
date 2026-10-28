import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import type { DepartmentsSettings, NavLinkConfig } from '@/types'

/**
 * Resolve which navigation link owns the current page.
 *
 * The most specific match wins: an exact URL first, then the longest URL
 * prefix (so `/shop/women` resolves to `/shop/women` before `/shop`).
 */
export function findActiveNavLink(
  pathname: string,
  links?: NavLinkConfig[] | null,
): NavLinkConfig | null {
  if (!links || links.length === 0) return null

  const path = pathname.replace(/\/+$/, '') || '/'
  const candidates = links.filter((link) => link.url.startsWith('/') && link.url !== '/')

  const exact = candidates.find((link) => link.url.replace(/\/+$/, '') === path)
  if (exact) return exact

  return (
    candidates
      .filter((link) => path.startsWith(`${link.url.replace(/\/+$/, '')}/`))
      .sort((a, b) => b.url.length - a.url.length)[0] ?? null
  )
}

/**
 * Departments bar settings for the current page.
 *
 * A navigation link may carry its own departments bar (its own category list
 * and its own visibility switches). When the current page belongs to such a
 * link, the link's bar wins; every other page falls back to the global one.
 */
export function useDepartmentsScope(
  departments: DepartmentsSettings,
  links?: NavLinkConfig[] | null,
): DepartmentsSettings {
  const location = useLocation()

  return useMemo(() => {
    const active = findActiveNavLink(location.pathname, links)
    const override = active?.departments
    if (!override) return departments

    return {
      enabled: override.enabled,
      category_ids: override.category_ids ?? null,
      show_all: override.show_all,
      show_shop_all: override.show_shop_all,
      show_collections: override.show_collections,
    }
  }, [departments, links, location.pathname])
}

/**
 * Departments bar settings for a specific navigation link.
 *
 * Unlike `useDepartmentsScope` this does not look at the current route - it
 * answers "what would this link show if it were selected?". Links without
 * their own override inherit the global departments bar.
 *
 * Returns `null` when the link has no departments bar at all, which means the
 * link should be followed directly instead of opening a sub menu.
 */
export function resolveLinkDepartments(
  departments: DepartmentsSettings,
  link?: NavLinkConfig | null,
): DepartmentsSettings | null {
  const override = link?.departments

  if (override) {
    if (!override.enabled) return null

    return {
      enabled: true,
      category_ids: override.category_ids ?? null,
      show_all: override.show_all,
      show_shop_all: override.show_shop_all,
      show_collections: override.show_collections,
    }
  }

  if (!departments.enabled) return null

  return departments
}
