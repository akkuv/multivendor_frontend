import { useMemo, useState } from 'react'
import { assetUrl } from '@/lib/assets'
import { Plus, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useAdminCategoryPages,
  useAdminCategoryPage,
  useCreateAdminCategoryPage,
  useUpdateAdminCategoryPage,
  useDeleteAdminCategoryPage,
  useToggleAdminCategoryPage,
} from '@/hooks/useCategoryPages'
import { useAdminCategoriesAll } from '@/hooks/useCategories'
import type { AdminCategoryPage } from '@/types'
import { buildCategoryOptions, categoryOptionLabel } from '@/lib/categoryTree'
import { buildCategoryPageEntries, type CategoryPageEntry } from '@/lib/categoryPageEntries'
import { CategoryPageSections } from '@/components/admin/CategoryPageSections'
import {
  ActiveBadge,
  ApiError,
  ConfirmDialog,
  EmptyState,
  FormField,
  LiveStorePreview,
} from '@/components/common/admin'
import { useTranslation } from 'react-i18next'
/* ────────────────────────────── Page Row ──────────────────────────────── */

function PageRow({
  entry,
  onManage,
  onToggle,
  onDelete,
  isPending,
}: {
  entry: CategoryPageEntry
  onManage: () => void
  onToggle: () => void
  onDelete: () => void
  isPending: boolean
}) {
  const { t } = useTranslation()
  const page = entry.page

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {entry.category.image ? (
            <img src={assetUrl(entry.category.image)} alt={entry.category.name} className="h-11 w-11 rounded-lg object-cover" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Store className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium">
              {entry.depth > 0 && <span className="mr-1 text-muted-foreground">↳</span>}
              {page?.title ?? entry.category.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {entry.category.name} · /category/{entry.category.slug}
            </p>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3 sm:table-cell">
        {page ? (
          <button type="button" onClick={onToggle} disabled={isPending} title={t('Toggle page')}>
            <ActiveBadge active={page.is_active} />
          </button>
        ) : (
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {t('Default')}
          </span>
        )}
      </td>
      <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
        {page
              ? t('{{count}} sections', { count: page.sections?.length ?? 0 })
              : t('Uses default sections')}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <Button variant="default" size="sm" onClick={onManage}>
            {page ? t('Manage') : t('Set up')}
          </Button>
          {page && (
            <Button variant="destructive" size="sm" onClick={onDelete}>
              {t('Delete')}
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}

/* ─────────────────────────────── Main Page ───────────────────────────── */

export function AdminCategoryPagesPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null)
  const [tab, setTab] = useState<'sections' | 'preview'>('sections')

  const allPagesQuery = useAdminCategoryPages({ per_page: 1000 })
  const createPage = useCreateAdminCategoryPage()
  const updatePage = useUpdateAdminCategoryPage()
  const togglePage = useToggleAdminCategoryPage()
  const deletePage = useDeleteAdminCategoryPage()

  const { data: allCategoryData } = useAdminCategoriesAll()
  const allCategories = useMemo(() => allCategoryData ?? [], [allCategoryData])

  const entries = useMemo(
    () => buildCategoryPageEntries(allCategories, allPagesQuery.data?.data ?? []),
    [allCategories, allPagesQuery.data],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) =>
      `${e.category.name} ${e.category.slug} ${e.page?.title ?? ''}`.toLowerCase().includes(q),
    )
  }, [entries, search])

  const selectedEntry = entries.find((e) => e.category.id === selectedCatId) ?? null
  const selectedPage = selectedEntry?.page ?? null
  const detailQuery = useAdminCategoryPage(selectedPage?.id)
  const pageDetail = selectedPage ? (detailQuery.data ?? selectedPage) : null

  const [creating, setCreating] = useState(false)
  const [createCategory, setCreateCategory] = useState('')

  const existingPageCategoryIds = new Set(
    (allPagesQuery.data?.data ?? []).map((p) => p.category_id ?? p.category?.id).filter((id): id is number => id != null),
  )
  const categoryOptions = buildCategoryOptions(allCategories)
  const creatableCategories = categoryOptions.filter((o) => !existingPageCategoryIds.has(o.category.id))

  const [deletingPage, setDeletingPage] = useState<AdminCategoryPage | null>(null)

  const handlePageFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedEntry) return
    const form = new FormData(e.currentTarget)
    const title = String(form.get('title') || '').trim()
    const subtitle = String(form.get('subtitle') || '').trim() || null
    const description = String(form.get('description') || '').trim() || null
    const metaTitle = String(form.get('meta_title') || '').trim() || null
    const metaDescription = String(form.get('meta_description') || '').trim() || null

    if (selectedPage) {
      await updatePage.mutateAsync({
        id: selectedPage.id,
        data: { title, subtitle, description, meta_title: metaTitle, meta_description: metaDescription },
      })
    } else {
      await createPage.mutateAsync({
        category_id: selectedEntry.category.id,
        title,
        subtitle,
        description,
        meta_title: metaTitle,
        meta_description: metaDescription,
      })
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const option = creatableCategories.find((o) => String(o.category.id) === createCategory)
    if (!option) return
    await createPage.mutateAsync({ category_id: option.category.id })
    setCreating(false)
    setCreateCategory('')
    setSelectedCatId(option.category.id)
    setTab('sections')
  }

  const isBusy = togglePage.isPending || updatePage.isPending || createPage.isPending

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{t('Category Pages')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('Every main category and subcategory can have a curated landing page. Pages without a record yet fall back to a default layout until you set one up.')}
          </p>
        </div>
        <Button onClick={() => { setCreating(true); setCreateCategory('') }}>
          <Plus className="mr-1.5 h-4 w-4" /> {t('New Page')}
        </Button>
      </div>

      {selectedCatId == null ? (
        <>
          <div className="rounded-xl border bg-background">
            <div className="border-b p-4">
              <Input
                placeholder={t('Search by category or page...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {allPagesQuery.isLoading || !allCategoryData ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            ) : allPagesQuery.error ? (
              <ApiError error={allPagesQuery.error} onRetry={() => allPagesQuery.refetch()} />
            ) : filtered.length === 0 ? (
              <EmptyState message={t('No categories match your search.')} />
            ) : (
              <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
                <div className="border-b px-4 py-2 text-xs text-muted-foreground">
                  {t('{{count}} categories', { count: filtered.length })}
                  {search ? ` ${t('match your search')}` : ''} ·{' '}
                  {t('{{count}} have custom pages', { count: filtered.filter((e) => e.page).length })}
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {filtered.map((entry) => (
                      <PageRow
                        key={entry.category.id}
                        entry={entry}
                        onManage={() => {
                          setSelectedCatId(entry.category.id)
                          setTab('sections')
                        }}
                        onToggle={entry.page ? () => togglePage.mutate(entry.page!.id) : () => {}}
                        onDelete={entry.page ? () => setDeletingPage(entry.page!) : () => {}}
                        isPending={togglePage.isPending}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={() => setSelectedCatId(null)}>
              {t('← Back to pages')}
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">/category/{selectedEntry?.category.slug ?? ''}</span>
              {selectedEntry && !selectedEntry.page ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  {t('Default page — set it up below to customize')}
                </span>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedPage) {
                      updatePage.mutateAsync({ id: selectedPage.id, data: { is_active: !pageDetail?.is_active } })
                    }
                  }}
                  disabled={!selectedPage}
                >
                  <ActiveBadge active={pageDetail?.is_active ?? false} />
                </Button>
              )}
            </div>
          </div>

          {!selectedEntry ? (
            <div className="rounded-xl border bg-background p-6">
              <ApiError error={new Error(t('This category could not be found.'))} onRetry={() => setSelectedCatId(null)} />
            </div>
          ) : detailQuery.isLoading ? (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-3">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="space-y-3 lg:col-span-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              <form onSubmit={handlePageFormSubmit} className="rounded-xl border bg-background p-4 lg:col-span-1">
                <h3 className="mb-3 font-semibold">{selectedPage ? t('Page Details') : t('Set up default page')}</h3>
                <div className="space-y-3">
                  <FormField label={t('Title (H1)')}>
                    <Input name="title" defaultValue={pageDetail?.title ?? selectedEntry.category.name} required />
                  </FormField>
                  <FormField label={t('Subtitle / Style line')}>
                    <Input name="subtitle" defaultValue={pageDetail?.subtitle ?? ''} placeholder={t('e.g. Style starts here.')} />
                  </FormField>
                  <FormField label={t('Description')}>
                    <Textarea name="description" defaultValue={pageDetail?.description ?? ''} rows={4} placeholder={t('Short description shown below the heading.')} />
                  </FormField>
                  <div className="rounded-lg border border-dashed p-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">{t('SEO')}</p>
                    <div className="space-y-2">
                      <FormField label={t('Meta title')}>
                        <Input name="meta_title" defaultValue={pageDetail?.meta_title ?? ''} placeholder={pageDetail?.title ?? selectedEntry.category.name} maxLength={255} />
                      </FormField>
                      <FormField label={t('Meta description')}>
                        <Textarea name="meta_description" defaultValue={pageDetail?.meta_description ?? ''} rows={3} placeholder={t('Used in the browser tab and search results.')} maxLength={500} />
                      </FormField>
                    </div>
                  </div>
                  <Button type="submit" disabled={isBusy}>
                    {createPage.isPending
                      ? t('Creating...')
                      : updatePage.isPending
                        ? t('Saving...')
                        : selectedPage
                          ? t('Save Page')
                          : t('Save & Create Page')}
                  </Button>
                  {!selectedPage && (
                    <p className="text-xs text-muted-foreground">
                      {t('Saving creates a new page for “{{name}}” at /category/{{slug}} and activates it immediately.', {
                        name: selectedEntry.category.name,
                        slug: selectedEntry.category.slug,
                      })}
                    </p>
                  )}
                </div>
              </form>

              <div className="rounded-xl border bg-background p-4 lg:col-span-2">
                <Tabs value={tab} onValueChange={(v) => setTab(v as 'sections' | 'preview')}>
                  <div className="mb-3">
                    <TabsList>
                      <TabsTrigger value="sections">{t('Sections')}</TabsTrigger>
                      <TabsTrigger value="preview">{t('Live Preview')}</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="sections">
                    {selectedPage ? (
                      <CategoryPageSections pageId={selectedPage.id} />
                    ) : (
                      <EmptyState message={t('Save this page first to add custom sections. Until then, the default sections (hero, featured, best sellers, brands) are used automatically.')} />
                    )}
                  </TabsContent>

                  <TabsContent value="preview">
                    <LiveStorePreview
                      slug={selectedEntry.category.slug}
                      note={t('Live view of /category/{{slug}} — your sections in order, with default sections filling the gaps.', {
                        slug: selectedEntry.category.slug,
                      })}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create page dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Create a Category Page')}</DialogTitle>
            <DialogDescription>
              {t('Pick a category to build a curated landing page for. You can add custom sections after creating.')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <FormField label={t('Category')}>
              <Select value={createCategory} onValueChange={setCreateCategory}>
                <SelectTrigger><SelectValue
                  placeholder={
                    creatableCategories.length
                      ? t('Select a category')
                      : t('No categories available')
                  }
                /></SelectTrigger>
                <SelectContent className="max-h-80">
                  {creatableCategories.map((o) => (
                    <SelectItem key={o.category.id} value={String(o.category.id)}>
                      {categoryOptionLabel(o)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <p className="text-xs text-muted-foreground">
              {t('All main categories and subcategories are listed on this screen — this dialog lets you jump straight to a specific one.')}
            </p>
            {creatableCategories.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t('Every category already has a landing page. Delete a page to free its category first.')}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>{t('Cancel')}</Button>
              <Button type="submit" disabled={!createCategory || createPage.isPending}>
                {createPage.isPending ? t('Creating...') : t('Create Page')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete page confirm */}
      {deletingPage && (
        <ConfirmDialog
          open
          onOpenChange={() => setDeletingPage(null)}
          title={t('Delete category page?')}
          description={t('"{{title}}" will no longer have a custom landing page. The category will fall back to a default page.', {
            title: deletingPage.title,
          })}
          onConfirm={() => { deletePage.mutate(deletingPage.id, { onSuccess: () => setDeletingPage(null) }) }}
          loading={deletePage.isPending}
          error={deletePage.error?.message ?? null}
        />
      )}
    </div>
  )
}