import { Badge } from '@/components/ui/badge'
import type { HomeSectionType } from '@/types'
import { useTranslation } from 'react-i18next'

/**
 * Human label for a storefront section type, shared by the homepage manager and
 * the category-page / custom-page section editors so all three name a section
 * the same way. Unknown types fall back to the raw enum value.
 */
export const sectionTypeLabels: Record<HomeSectionType, string> = {
  HERO: 'Hero Banner',
  PERSONALIZATION: 'Personalization Strip',
  VALUE_PROPS: 'Value Props',
  MINI_BANNERS: 'Mini Banners',
  CATEGORIES: 'Categories',
  BEST_SELLERS: 'Best Sellers',
  FEATURED_CATEGORIES: 'Featured Categories',
  EDITORS_PICKS: "Editor's Picks",
  SPLIT_COLLAGE: 'The Saree Edit (Split Collage)',
  IMAGE_BANNER: 'Image Banner',
  TEXT_BANNER: 'Text Banner',
  VIDEO_BANNER: 'Video Banner',
  PRODUCT_CAROUSEL: 'Product Carousel',
  INSTAGRAM_DIARIES: 'Visit Our Instagram Diaries',
  TRENDING_STYLES: 'Trending Styles',
  ICON_INFO: 'Icon Info Band',
  VISIT_STORES: 'Visit Stores Band',
  STORE_LOCATIONS: 'Visit Our Stores',
  TESTIMONIALS: 'Testimonials',
  RICH_TEXT: 'Text / Content Block',
  FAQ: 'FAQ (Questions)',
  VENDOR_STORES: 'Vendor Stores',
}

export function sectionTypeLabel(type: HomeSectionType | string): string {
  return sectionTypeLabels[type as HomeSectionType] ?? String(type)
}

export function SectionTypeBadge({ type }: { type: HomeSectionType | string }) {
  const { t } = useTranslation()

  return (
    <Badge variant="outline" className="font-medium">
      {t(sectionTypeLabel(type))}
    </Badge>
  )
}
