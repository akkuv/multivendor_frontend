import type { AdminCategoryPage, Category } from '@/types'
import { buildCategoryOptions, categoryOptionLabel, type CategoryOption } from '@/lib/categoryTree'

export interface CategoryPageEntry extends CategoryOption {
  page: AdminCategoryPage | null
}

/**
 * Merges every category (main + subcategories) with its category-page record
 * (if one exists) so admin screens can manage pages for all categories,
 * creating page rows lazily when an admin first configures them.
 */
export function buildCategoryPageEntries(
  categories: Category[],
  pages: AdminCategoryPage[],
): CategoryPageEntry[] {
  const pageByCategoryId = new Map<number, AdminCategoryPage>()
  for (const p of pages) {
    const id = p.category_id ?? p.category?.id
    if (id != null) pageByCategoryId.set(id, p)
  }

  return buildCategoryOptions(categories).map((option) => ({
    ...option,
    label: categoryOptionLabel(option),
    page: pageByCategoryId.get(option.category.id) ?? null,
  }))
}