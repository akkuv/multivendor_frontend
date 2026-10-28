import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  useAdminColors,
  useCreateAdminColor,
  useDeleteAdminColor,
  useToggleAdminColor,
  useUpdateAdminColor,
} from '@/hooks/useCatalog'
import type { Color } from '@/types'
import {
  ActiveBadge,
  ApiError,
  ConfirmDialog,
  EmptyState,
  FormField,
  PaginationFooter,
} from '@/components/common/admin'
import { useTranslation } from 'react-i18next'

export function AdminColorsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [onlyActive, setOnlyActive] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Color | null>(null)
  const [deleting, setDeleting] = useState<Color | null>(null)
  const [formActive, setFormActive] = useState(true)

  const { data, isLoading, error, refetch } = useAdminColors({
    page,
    per_page: 15,
    search: debouncedSearch || undefined,
    is_active: onlyActive ? true : undefined,
  })

  const createMutation = useCreateAdminColor()
  const updateMutation = useUpdateAdminColor()
  const toggleMutation = useToggleAdminColor()
  const deleteMutation = useDeleteAdminColor()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const openCreate = () => {
    setEditing(null)
    setFormActive(true)
    setDialogOpen(true)
  }

  const openEdit = (color: Color) => {
    setEditing(color)
    setFormActive(color.is_active)
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const payload = {
      name: String(form.get('name')).trim(),
      hex_code: String(form.get('hex_code') || '').trim().toUpperCase() || null,
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
      /* keep dialog open to show backend error */
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const mutationError = editing ? updateMutation.error : createMutation.error

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t('Colors')}</h1>
          <p className="text-sm text-muted-foreground">{t('Manage color swatches used on products.')}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('Add Color')}
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
            placeholder={t('Search colors...')}
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
        <EmptyState message={t('No colors found.')} />
      ) : (
        <div className="rounded-lg border bg-background">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t('Color')}</th>
                  <th className="px-4 py-3 font-medium">{t('Name')}</th>
                  <th className="px-4 py-3 font-medium">{t('Slug')}</th>
                  <th className="px-4 py-3 font-medium">{t('Hex')}</th>
                  <th className="px-4 py-3 font-medium">{t('Status')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((color) => (
                  <tr key={color.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <span
                        className="inline-block h-6 w-6 rounded-full border"
                        style={{ backgroundColor: color.hex_code ?? '#fff' }}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{color.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{color.slug}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {color.hex_code ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleMutation.mutate(color.id)}
                        title={t('Toggle status')}
                        disabled={toggleMutation.isPending}
                      >
                        <ActiveBadge active={color.is_active} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(color)}>
                          {t('Edit')}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleting(color)}
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
            <DialogTitle>{editing ? t('Edit Color') : t('Add Color')}</DialogTitle>
            <DialogDescription>
              {editing ? t('Update the color details below.') : t('Fill in the details to create a new color.')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label={t('Name')}>
              <Input name="name" defaultValue={editing?.name ?? ''} required placeholder={t('e.g. Midnight Blue')} />
            </FormField>
            <FormField
              label={t('Hex Code')}
              error={t('Must be a 6-digit hex code like #1E90FF.')}
            >
              <div className="flex items-center gap-2">
                <Input
                  name="hex_code"
                  defaultValue={editing?.hex_code ?? ''}
                  placeholder="#1E90FF"
                  pattern="#[0-9a-fA-F]{6}"
                />
              </div>
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
                {isSaving ? t('Saving...') : editing ? t('Save Changes') : t('Create Color')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t('Delete Color')}
        description={t('Are you sure you want to delete "{{name}}"? This action cannot be undone.', { name: deleting?.name })}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        error={deleteMutation.error?.message ?? null}
      />
    </div>
  )
}