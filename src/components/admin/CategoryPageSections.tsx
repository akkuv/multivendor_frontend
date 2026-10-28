import { EmptyState } from '@/components/common/admin'
import { AdminHomeManagerPage } from '@/features/website/pages/admin/AdminHomeManagerPage'
import { useTranslation } from 'react-i18next'

/**
 * Section stack editor for a category page.
 *
 * Category pages render through the very same section engine as the homepage
 * and custom pages, so this reuses {@link AdminHomeManagerPage} in its embedded
 * mode instead of maintaining a second, smaller form. Every section type the
 * homepage offers — video banners, product carousels, FAQ, content blocks, … —
 * is therefore available here with an identical editor.
 *
 * Passing `sectionApi="category"` retargets the editor's reads and writes at
 * `/admin/category-pages/{id}/sections`, because category pages keep their own
 * section rows rather than sharing the homepage table.
 */
export function CategoryPageSections({ pageId }: { pageId: number | undefined }) {
  const { t } = useTranslation()

  if (!pageId) {
    return (
      <EmptyState
        message={t(
          'Save this page first to add custom sections. Until then, the default sections (hero, subcategories, best sellers, testimonials) are used automatically.',
        )}
      />
    )
  }

  return (
    <AdminHomeManagerPage
      pageId={pageId}
      heading={t('Page Sections')}
      description={t(
        'Every homepage section type is available here. Sections render in order on the public category page.',
      )}
      hideSharedTabs
      sectionApi="category"
    />
  )
}
