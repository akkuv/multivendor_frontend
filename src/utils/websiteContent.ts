import type {
  DepartmentsSettings,
  FooterSocialLinkConfig,
  FooterSocialSettings,
  FooterSettings,
  NavLinkConfig,
  NavLinkDepartments,
  WebsiteContent,
} from '@/types'

const LEGACY_SOCIAL_PLATFORM_KEYS = ['facebook', 'instagram', 'twitter', 'youtube', 'linkedin', 'whatsapp'] as const

/**
 * Fill in the departments flags a payload is missing.
 *
 * Caches written before the "Collections" toggle existed have no
 * `show_collections` key, so it is defaulted to visible here.
 */
export function normalizeDepartments(departments: DepartmentsSettings): DepartmentsSettings {
  const raw = (departments ?? {}) as Partial<DepartmentsSettings>
  return {
    enabled: raw.enabled ?? true,
    category_ids: raw.category_ids ?? null,
    show_all: raw.show_all ?? true,
    show_shop_all: raw.show_shop_all ?? true,
    show_collections: raw.show_collections ?? true,
  }
}

/**
 * Normalize the per-navigation-link departments bar override.
 *
 * `null` means "use the global departments bar". Any other value is coerced
 * into the full shape so a stale cache can never break the page scoped bar.
 */
export function normalizeLinkDepartments(raw: unknown): NavLinkDepartments | null {
  if (raw == null || typeof raw !== 'object') return null

  const scope = raw as Partial<NavLinkDepartments>
  return {
    enabled: scope.enabled ?? true,
    category_ids: Array.isArray(scope.category_ids) ? scope.category_ids : null,
    show_all: scope.show_all ?? true,
    show_shop_all: scope.show_shop_all ?? true,
    show_collections: scope.show_collections ?? true,
  }
}

/**
 * Normalize navigation links, filling in the per-link departments bar.
 */
export function normalizeNavLinks(links?: NavLinkConfig[] | null): NavLinkConfig[] {
  if (!Array.isArray(links)) return []

  return links
    .filter((link) => link && typeof link === 'object')
    .map((link) => ({
      ...link,
      label: link.label ?? '',
      url: link.url ?? '',
      new_tab: link.new_tab ?? false,
      departments: normalizeLinkDepartments(link.departments),
    }))
}

/**
 * Coerce any footer.social shape into the structured form
 * ({ enabled, title, description, style, links: [...] }).
 *
 * Handles the legacy flat map ({ facebook: url, ... }) that older cached
 * website-content payloads stored, so a stale cache can never hide the
 * footer social block.
 */
export function normalizeFooterSocial(raw: unknown): FooterSocialSettings {
  const social = (raw ?? {}) as Record<string, unknown>

  const enabled = typeof social.enabled === 'boolean' ? social.enabled : true
  const title = typeof social.title === 'string' && social.title.trim() !== '' ? social.title : 'Follow us'
  const description = typeof social.description === 'string' ? social.description : ''
  const style = social.style === 'labeled' ? 'labeled' : 'icons'

  if (Array.isArray(social.links)) {
    return {
      enabled,
      title,
      description,
      style,
      links: social.links as FooterSocialLinkConfig[],
    }
  }

  const links: FooterSocialLinkConfig[] = LEGACY_SOCIAL_PLATFORM_KEYS.flatMap((key) => {
    const url = social[key]
    return typeof url === 'string' && url.trim() !== ''
      ? [{ platform: key, url, label: '', enabled: true }]
      : []
  })

  return { enabled, title, description, style, links }
}

export function normalizeFooter(footer: FooterSettings): FooterSettings {
  if (!footer) return footer
  return { ...footer, social: normalizeFooterSocial(footer.social ?? ({} as FooterSettings['social'])) }
}

export function normalizeWebsiteContent(data: WebsiteContent): WebsiteContent {
  if (!data) return data
  const navbar = data.navbar
    ? {
        ...data.navbar,
        departments: normalizeDepartments(data.navbar.departments),
        links: normalizeNavLinks(data.navbar.links),
      }
    : data.navbar
  if (!data.footer) return { ...data, navbar }
  return { ...data, navbar, footer: normalizeFooter(data.footer) }
}