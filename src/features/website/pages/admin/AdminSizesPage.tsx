import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
  useAdminSizeGroups,
  useAdminSizes,
  useCreateAdminSize,
  useCreateAdminSizeGroup,
  useDeleteAdminSize,
  useDeleteAdminSizeGroup,
  useToggleAdminSize,
  useToggleAdminSizeGroup,
  useUpdateAdminSize,
  useUpdateAdminSizeGroup,
} from '@/hooks/useCatalog'
import type { Size, SizeGroup } from '@/types'
import {
  ActiveBadge,
  ApiError,
  ConfirmDialog,
  EmptyState,
  FormField,
  PaginationFooter,
} from '@/components/common/admin'
import { useTranslation } from 'react-i18next'

export function AdminSizesPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [onlyActive, setOnlyActive] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SizeGroup | null>(null)
  const [deleting, setDeleting] = useState<SizeGroup | null>(null)
  const [formActive, setFormActive] = useState(true)
  const [sizesFor, setSizesFor] = useState<SizeGroup | null>(null)

  const { data, isLoading, error, refetch } = useAdminSizeGroups({
    page,
    per_page: 15,
    search: debouncedSearch || undefined,
    is_active: onlyActive ? true : undefined,
  })

  const createMutation = useCreateAdminSizeGroup()
  const updateMutation = useUpdateAdminSizeGroup()
  const toggleMutation = useToggleAdminSizeGroup()
  const deleteMutation = useDeleteAdminSizeGroup()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const openCreate = () => {
    setEditing(null)
    setFormActive(true)
    setDialogOpen(true)
  }

  const openEdit = (group: SizeGroup) => {
    setEditing(group)
    setFormActive(group.is_active)
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const payload = {
      name: String(form.get('name')).trim(),
      description: String(form.get('description') || '').trim() || null,
      is_active: formActive,
    }
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    setDialogOpen(false)
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await deleteMutation.mutateAsync(deleting.id)
      setDeleting(null)
    } catch {
      /* keep dialog open */
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const mutationError = editing ? updateMutation.error : createMutation.error

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t('Sizes')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('Manage size groups (e.g. Clothing, Shoes, Rings) and the sizes within them.')}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('Add Size Group')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder={t('Search size groups...')}
            className="w-64 pl-8"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={onlyActive}
            onCheckedChange={(v) => {
              setOnlyActive(v)
              setPage(1)
            }}
          />
          {t('Active only')}
        </label>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <ApiError error={error} onRetry={refetch} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState message={t('No size groups found.')} />
      ) : (
        <div className="rounded-lg border bg-background">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t('Name')}</th>
                  <th className="px-4 py-3 font-medium">{t('Slug')}</th>
                  <th className="px-4 py-3 font-medium">{t('Description')}</th>
                  <th className="px-4 py-3 font-medium">{t('Sizes')}</th>
                  <th className="px-4 py-3 font-medium">{t('Status')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((group) => (
                  <tr key={group.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{group.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{group.slug}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                      {group.description ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{group.sizes_count}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleMutation.mutate(group.id)}
                        title={t('Toggle status')}
                        disabled={toggleMutation.isPending}
                      >
                        <ActiveBadge active={group.is_active} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSizesFor(group)}
                        >
                          {t('Manage Sizes')}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(group)}>
                          {t('Edit')}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleting(group)}
                        >
                          {t('Delete')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3">
            <PaginationFooter data={data} onPageChange={setPage} />
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t('Edit Size Group') : t('Add Size Group')}</DialogTitle>
            <DialogDescription>
              {editing
                ? t('Update the size group details below.')
                : t('Fill in the details to create a new size group.')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label={t('Name')}>
              <Input name="name" defaultValue={editing?.name ?? ''} required placeholder={t('e.g. Clothing')} />
            </FormField>
            <FormField label={t('Description')}>
              <Textarea name="description" defaultValue={editing?.description ?? ''} />
            </FormField>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={formActive} onCheckedChange={setFormActive} />
              {t('Active')}
            </label>
            {mutationError ? (
              <p className="text-sm text-destructive">
                {(mutationError as { message?: string }).message}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? t('Saving...') : editing ? t('Save Changes') : t('Create Size Group')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {sizesFor ? <SizesDialog group={sizesFor} onClose={() => setSizesFor(null)} /> : null}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t('Delete Size Group')}
        description={t('Are you sure you want to delete "{{name}}" and all of its sizes? This action cannot be undone.', { name: deleting?.name })}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        error={deleteMutation.error?.message ?? null}
      />
    </div>
  )
}

function SizesDialog({ group, onClose }: { group: SizeGroup; onClose: () => void }) {
  const { t } = useTranslation()
  const { data, isLoading, error, refetch } = useAdminSizes(group.id)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSize, setEditingSize] = useState<Size | null>(null)
  const [deletingSize, setDeletingSize] = useState<Size | null>(null)
  const [formSort, setFormSort] = useState(0)
  const [formActive, setFormActive] = useState(true)

  const createMutation = useCreateAdminSize()
  const updateMutation = useUpdateAdminSize()
  const toggleMutation = useToggleAdminSize()
  const deleteMutation = useDeleteAdminSize()

  const openSizeDialog = (size: Size | null) => {
    setEditingSize(size)
    setFormSort(size?.sort_order ?? 0)
    setFormActive(size?.is_active ?? true)
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const payload = {
      name: String(form.get('name')).trim(),
      sort_order: formSort,
      is_active: formActive,
      size_group_id: group.id,
    }
    if (editingSize) {
      await updateMutation.mutateAsync({ id: editingSize.id, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    setDialogOpen(false)
  }

  const handleDelete = async () => {
    if (!deletingSize) return
    try {
      await deleteMutation.mutateAsync(deletingSize.id)
      setDeletingSize(null)
    } catch {
      /* keep dialog open */
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const mutationError = editingSize ? updateMutation.error : createMutation.error
  const sizes = (data?.data ?? []).filter((s) =>
    search ? s.name.toLowerCase().includes(search.toLowerCase()) : true,
  )

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('Sizes in “{{group}}”', { group: group.name })}</DialogTitle>
          <DialogDescription>{t('Add, edit, or remove sizes from this group.')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Filter sizes...')}
              className="w-56 pl-8"
            />
          </div>
          <Button onClick={() => openSizeDialog(null)}>
            <Plus className="h-4 w-4" />
            {t('Add Size')}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <ApiError error={error} onRetry={refetch} />
        ) : sizes.length === 0 ? (
          <EmptyState message={t('No sizes found.')} />
        ) : (
          <div className="max-h-80 overflow-y-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/50">
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">{t('Size')}</th>
                  <th className="px-4 py-2 font-medium">{t('Slug')}</th>
                  <th className="px-4 py-2 font-medium">{t('Order')}</th>
                  <th className="px-4 py-2 font-medium">{t('Status')}</th>
                  <th className="px-4 py-2 text-right font-medium">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {sizes.map((size) => (
                  <tr key={size.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{size.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{size.slug}</td>
                    <td className="px-4 py-2 text-muted-foreground">{size.sort_order}</td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => toggleMutation.mutate(size.id)}
                        title={t('Toggle status')}
                        disabled={toggleMutation.isPending}
                      >
                        <ActiveBadge active={size.is_active} />
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSizeDialog(size)}
                        >
                          {t('Edit')}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletingSize(size)}
                        >
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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingSize ? t('Edit Size') : t('Add Size')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label={t('Size')}>
                <Input name="name" defaultValue={editingSize?.name ?? ''} required placeholder={t('e.g. M')} />
              </FormField>
              <FormField label={t('Sort Order')}>
                <Input
                  name="sort_order"
                  type="number"
                  value={formSort}
                  onChange={(e) => setFormSort(Number(e.target.value))}
                />
              </FormField>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={formActive} onCheckedChange={setFormActive} />
                {t('Active')}
              </label>
              {mutationError ? (
                <p className="text-sm text-destructive">
                  {(mutationError as { message?: string }).message}
                </p>
              ) : null}
              <DialogFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? t('Saving...') : editingSize ? t('Save Changes') : t('Add Size')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={deletingSize !== null}
          onOpenChange={(open) => !open && setDeletingSize(null)}
          title={t('Delete Size')}
          description={t('Are you sure you want to delete the size "{{name}}"?', { name: deletingSize?.name })}
          onConfirm={handleDelete}
          loading={deleteMutation.isPending}
          error={deleteMutation.error?.message ?? null}
        />
      </DialogContent>
    </Dialog>
  )
}