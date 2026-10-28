import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Plus, Search } from 'lucide-react'
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
  useAdminBrands,
  useAdminCategoryTree,
  useCreateAdminBrand,
  useDeleteAdminBrand,
  useToggleAdminBrand,
  useUpdateAdminBrand,
} from '@/hooks/useCatalog'
import type { Brand, Category } from '@/types'
import {
  ActiveBadge,
  ApiError,
  ConfirmDialog,
  EmptyState,
  FormField,
  ImageField,
  PaginationFooter,
} from '@/components/common/admin'
import { useTranslation } from 'react-i18next'

interface FlatCategory {
  category: Category
  depth: number
}

function flattenCategories(categories: Category[], depth = 0): FlatCategory[] {
  return categories.flatMap((category) => [
    { category, depth },
    ...flattenCategories(category.children ?? [], depth + 1),
  ])
}

export function AdminBrandsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [onlyActive, setOnlyActive] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Brand | null>(null)
  const [deleting, setDeleting] = useState<Brand | null>(null)
  const [formActive, setFormActive] = useState(true)
  const [formCategoryIds, setFormCategoryIds] = useState<number[]>([])
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: categoryTree } = useAdminCategoryTree()
  const flatCategories = flattenCategories(categoryTree ?? [])

  const fieldError = (key: string) => formErrors[key]?.[0]

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    if (successTimer.current) clearTimeout(successTimer.current)
    successTimer.current = setTimeout(() => setSuccessMessage(null), 4000)
  }

  const { data, isLoading, error, refetch } = useAdminBrands({
    page,
    per_page: 15,
    search: debouncedSearch || undefined,
    is_active: onlyActive ? true : undefined,
  })

  const createMutation = useCreateAdminBrand()
  const updateMutation = useUpdateAdminBrand()
  const toggleMutation = useToggleAdminBrand()
  const deleteMutation = useDeleteAdminBrand()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const openCreate = () => {
    setEditing(null)
    setFormActive(true)
    setFormCategoryIds([])
    setFormErrors({})
    setDialogOpen(true)
  }

  const openEdit = (brand: Brand) => {
    setEditing(brand)
    setFormActive(brand.is_active)
    setFormCategoryIds(brand.category_ids ?? [])
    setFormErrors({})
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormErrors({})
    const form = new FormData(e.currentTarget)
    const payload = {
      name: String(form.get('name')).trim(),
      description: String(form.get('description') || '').trim() || null,
      logo: String(form.get('logo') || '').trim() || null,
      category_ids: formCategoryIds,
      meta_title: String(form.get('meta_title') || '').trim() || null,
      meta_description: String(form.get('meta_description') || '').trim() || null,
      is_active: formActive,
    }
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      showSuccess(editing ? t('Brand updated successfully.') : t('Brand created successfully.'))
      setDialogOpen(false)
    } catch (error) {
      const res = (error as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data
      setFormErrors(res?.errors ?? {})
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await deleteMutation.mutateAsync(deleting.id)
      showSuccess(t('"{{name}}" deleted successfully.', { name: deleting.name }))
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
          <h1 className="text-xl font-semibold">{t('Brands')}</h1>
          <p className="text-sm text-muted-foreground">{t('Manage product brands.')}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('Add Brand')}
        </Button>
      </div>

      {successMessage ? (
        <div
          className="flex items-center gap-2 rounded-md border border-emerald-600/30 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
          role="status"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder={t('Search brands...')}
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
        <EmptyState message={t('No brands found.')} />
      ) : (
        <div className="rounded-lg border bg-background">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t('Name')}</th>
                  <th className="px-4 py-3 font-medium">{t('Slug')}</th>
                  <th className="px-4 py-3 font-medium">{t('Description')}</th>
                  <th className="px-4 py-3 font-medium">{t('Status')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((brand) => (
                  <tr key={brand.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{brand.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{brand.slug}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                      {brand.description ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleMutation.mutate(brand.id)}
                        title={t('Toggle status')}
                        disabled={toggleMutation.isPending}
                      >
                        <ActiveBadge active={brand.is_active} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(brand)}>
                          {t('Edit')}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleting(brand)}
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
            <DialogTitle>{editing ? t('Edit Brand') : t('Add Brand')}</DialogTitle>
            <DialogDescription>
              {editing ? t('Update the brand details below.') : t('Fill in the details to create a new brand.')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label={t('Name')} error={fieldError('name')}>
              <Input name="name" defaultValue={editing?.name ?? ''} required placeholder={t('e.g. Apple')} />
            </FormField>
            <FormField label={t('Categories (optional)')} error={fieldError('category_ids')}>
              <div className="max-h-56 space-y-0.5 overflow-y-auto rounded-md border p-1.5">
                {flatCategories.length === 0 ? (
                  <p className="px-2 py-1 text-xs text-muted-foreground">
                    {t('No categories yet. Create categories first.')}
                  </p>
                ) : (
                  flatCategories.map(({ category, depth }) => (
                    <label
                      key={category.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted"
                      style={{ paddingLeft: depth * 18 + 8 }}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 shrink-0"
                        checked={formCategoryIds.includes(category.id)}
                        onChange={(e) => {
                          setFormCategoryIds((prev) =>
                            e.target.checked
                              ? [...prev, category.id]
                              : prev.filter((id) => id !== category.id),
                          )
                        }}
                      />
                      <span className="truncate">{category.name}</span>
                    </label>
                  ))
                )}
              </div>
            </FormField>
            <FormField label={t('Logo URL')} error={fieldError('logo')}>
              <ImageField
                label={t('Logo URL')}
                name="logo"
                initialValue={editing?.logo ?? ''}
                placeholder={t('https://.../logo.png')}
              />
            </FormField>
            <FormField label={t('Description')} error={fieldError('description')}>
              <Textarea name="description" defaultValue={editing?.description ?? ''} />
            </FormField>
            <FormField label={t('Meta Title')} error={fieldError('meta_title')}>
              <Input name="meta_title" defaultValue={editing?.meta_title ?? ''} />
            </FormField>
            <FormField label={t('Meta Description')} error={fieldError('meta_description')}>
              <Textarea name="meta_description" defaultValue={editing?.meta_description ?? ''} rows={3} />
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
                {isSaving ? t('Saving...') : editing ? t('Save Changes') : t('Create Brand')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t('Delete Brand')}
        description={t('Are you sure you want to delete "{{name}}"? This action cannot be undone.', { name: deleting?.name })}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        error={deleteMutation.error?.message ?? null}
      />
    </div>
  )
}