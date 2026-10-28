import { buildCategoryOptions } from '@/lib/categoryTree'
import type { Category } from '@/types'
import { useTranslation } from 'react-i18next'

export function CategoryTilesPicker({
  categories,
  value,
  onChange,
}: {
  categories: Category[]
  value: number[]
  onChange: (ids: number[]) => void
}) {
  const { t } = useTranslation()
  const options = buildCategoryOptions(categories)

  const toggle = (id: number) => {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])
  }

  return (
    <div className="scroll max-h-64 space-y-0.5 overflow-y-auto rounded-lg border bg-background p-1.5">
      {options.map(({ category, depth }) => (
        <label
          key={category.id}
          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm transition-colors hover:bg-accent"
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          <input
            type="checkbox"
            className="h-4 w-4 shrink-0 accent-primary"
            checked={value.includes(category.id)}
            onChange={() => toggle(category.id)}
          />
          <span className="min-w-0 truncate">{category.name}</span>
        </label>
      ))}
      {options.length === 0 && (
        <p className="p-2 text-center text-sm text-muted-foreground">{t('No categories available.')}</p>
      )}
    </div>
  )
}