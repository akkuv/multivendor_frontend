import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useAdminPages,
  useCreateAdminPage,
  useDeleteAdminPage,
  useToggleAdminPage,
  useUpdateAdminPage,
} from '@/hooks/usePages'
import {
  ActiveBadge,
  ApiError,
  ConfirmDialog,
  EmptyState,
  FormField,
  PaginationFooter,
} from '@/components/common/admin'
import type { CustomPage } from '@/types'
import { useTranslation } from 'react-i18next'

export function AdminPagesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const pagesQuery = useAdminPages({ page, per_page: 15, search: search.trim() || undefined })

  const createPage = useCreateAdminPage()
  const updatePage = useUpdateAdminPage()
  const deletePage = useDeleteAdminPage()
  const togglePage = useToggleAdminPage()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CustomPage | null>(null)
  const [deleting, setDeleting] = useState<CustomPage | null>(null)

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (item: CustomPage) => {
    setEditing(item)
    setDialogOpen(true)
  }

  const handlePageFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = {
      title: String(form.get('title') || '').trim(),
      slug: String(form.get('slug') || '').trim() || null,
      meta_title: String(form.get('meta_title') || '').trim() || null,
      meta_description: String(form.get('meta_description') || '').trim() || null,
    }

    if (editing) {
      await updatePage.mutateAsync({ id: editing.id, data: payload })
    } else {
      const created = await createPage.mutateAsync(payload)
      navigate(`/admin/pages/${created.id}`)
      return
    }
    setDialogOpen(false)
  }

  const saving = createPage.isPending || updatePage.isPending

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t('Pages')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('Build extra storefront pages, just like the homepage, and set each page’s own URL from its slug.')}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> {t('New Page')}
        </Button>
      </div>

      <div className="rounded-xl border bg-background">
        <div className="border-b p-4">
          <Input
            placeholder={t('Search by title or slug...')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>

        {pagesQuery.isLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : pagesQuery.error ? (
          <ApiError error={pagesQuery.error} onRetry={() => pagesQuery.refetch()} />
        ) : !pagesQuery.data?.data?.length ? (
          <EmptyState message={t('No pages yet. Create one to build a new storefront page from the same section types as the homepage.')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t('Title')}</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">{t('URL')}</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">{t('Sections')}</th>
                  <th className="px-4 py-3 font-medium">{t('Active')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {pagesQuery.data.data.map((entry) => (
                  <tr key={entry.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{entry.title}</p>
                      <p className="text-xs text-muted-foreground sm:hidden">/{entry.slug}</p>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <a
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        href={`/${entry.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        /{entry.slug}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {t('{{count}} sections', { count: entry.sections_count ?? 0 })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => togglePage.mutate(entry.id)}
                        disabled={togglePage.isPending}
                        title={t('Toggle page')}
                      >
                        <ActiveBadge active={entry.is_active} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="default" size="sm" onClick={() => navigate(`/admin/pages/${entry.id}`)}>
                          {t('Manage sections')}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(entry)}>
                          {t('Edit')}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeleting(entry)}>
                          {t('Delete')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagesQuery.data && pagesQuery.data.data.length > 0 && (
          <div className="px-4 pb-4">
            <PaginationFooter data={pagesQuery.data} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t('Edit page') : t('Create a page')}</DialogTitle>
            <DialogDescription>
              {t('Pages render the same section types as the homepage. You can add sections after creating.')}
            </DialogDescription>
          </DialogHeader>
          <form key={editing?.id ?? 'new'} onSubmit={handlePageFormSubmit} className="space-y-4">
            <FormField label={t('Title')}>
              <Input name="title" defaultValue={editing?.title ?? ''} required />
            </FormField>
            <FormField
              label={t('Slug')}
              hint={t('Leave blank to generate it from the title. Use / to create nested paths, e.g. women/women-ethnic-wear.')}
            >
              <Input name="slug" defaultValue={editing?.slug ?? ''} placeholder="women/women-ethnic-wear" />
            </FormField>
            <FormField label={t('Meta title')}>
              <Input name="meta_title" defaultValue={editing?.meta_title ?? ''} />
            </FormField>
            <FormField label={t('Meta description')}>
              <Textarea name="meta_description" defaultValue={editing?.meta_description ?? ''} rows={3} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t('Saving...') : editing ? t('Save changes') : t('Create page')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {deleting && (
        <ConfirmDialog
          open
          onOpenChange={() => setDeleting(null)}
          title={t('Delete page?')}
          description={t('"{{title}}" and all of its sections will be permanently deleted.', { title: deleting.title })}
          onConfirm={() => deletePage.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
          loading={deletePage.isPending}
          error={deletePage.error?.message ?? null}
        />
      )}
    </div>
  )
}
