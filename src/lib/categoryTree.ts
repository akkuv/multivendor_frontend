import type { Category } from '@/types'

export interface CategoryOption {
  category: Category
  depth: number
}

export function buildCategoryOptions(categories: Category[]): CategoryOption[] {
  const childrenOf = new Map<number | null, Category[]>()

  for (const c of categories) {
    const key = c.parent_id
    childrenOf.set(key, [...(childrenOf.get(key) ?? []), c])
  }

  const out: CategoryOption[] = []

  const walk = (parentId: number | null, depth: number) => {
    const kids = [...(childrenOf.get(parentId) ?? [])].sort((a, b) => a.sort_order - b.sort_order)
    for (const c of kids) {
      out.push({ category: c, depth })
      walk(c.id, depth + 1)
    }
  }

  walk(null, 0)
  return out
}

export function categoryOptionLabel(option: { category: Category; depth: number }): string {
  const indent = '\u00A0'.repeat(option.depth * 2)
  return option.depth === 0 ? option.category.name : `${indent}↳ ${option.category.name}`
}

export interface RelatedCategoryGroup {
  id: string
  label: string
  hint?: string
  categories: Category[]
}

/**
 * Builds the categories that are *related* to `rootId` (its subtree, or its
 * siblings when it is a leaf) so admins only ever pick from what actually
 * belongs to that category's flow.
 */
export function buildRelatedCategoryGroups(all: Category[], rootId: number, rootName?: string): RelatedCategoryGroup[] {
  const byParent = new Map<number | null, Category[]>()

  for (const c of all) {
    const key = c.parent_id
    byParent.set(key, [...(byParent.get(key) ?? []), c])
  }

  const byId = new Map(all.map((c) => [c.id, c]))
  const root = byId.get(rootId)
  if (!root) return []

  const sortFn = (a: Category, b: Category) => a.sort_order - b.sort_order || a.id - b.id
  const displayName = rootName ?? root.name

  const direct = [...(byParent.get(rootId) ?? [])].sort(sortFn)
  const groups: RelatedCategoryGroup[] = []

  if (direct.length > 0) {
    groups.push({
      id: 'direct',
      label: `Subcategories of ${displayName}`,
      categories: direct,
    })

    const nested: Category[] = []
    const walk = (parentId: number) => {
      for (const c of [...(byParent.get(parentId) ?? [])].sort(sortFn)) {
        nested.push(c)
        walk(c.id)
      }
    }
    direct.forEach((c) => walk(c.id))

    if (nested.length > 0) {
      groups.push({
        id: 'nested',
        label: 'Deeper related categories',
        hint: 'Products in these categories also appear on this page.',
        categories: nested,
      })
    }
  } else if (root.parent_id != null) {
    const siblings = [...(byParent.get(root.parent_id) ?? [])]
      .filter((c) => c.id !== rootId)
      .sort(sortFn)

    if (siblings.length > 0) {
      groups.push({
        id: 'siblings',
        label: `Related categories under ${byId.get(root.parent_id)?.name ?? 'parent'}`,
        categories: siblings,
      })
    }

    groups.push({
      id: 'self',
      label: `${displayName} itself`,
      hint: 'Show the category itself as a tile.',
      categories: [root],
    })
  }

  return groups
}