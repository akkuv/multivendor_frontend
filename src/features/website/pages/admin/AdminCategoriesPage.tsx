import { useMemo, useRef, useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
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
import { useAdminCategoryTree, useToggleAdminCategory } from '@/hooks/useCatalog'
import { useCreateAdminCategory, useDeleteAdminCategory, useUpdateAdminCategory } from '@/hooks/useAdmin'
import type { Category } from '@/types'
import {
  ActiveBadge,
  ApiError,
  ConfirmDialog,
  EmptyState,
  FormField,
  ImageField,
} from '@/components/common/admin'
import { useTranslation } from 'react-i18next'

interface FlatCategory {
  category: Category
  depth: number
}

function flattenTree(categories: Category[], depth = 0): FlatCategory[] {
  return categories.flatMap((category) => [
    { category, depth },
    ...flattenTree(category.children ?? [], depth + 1),
  ])
}

function collectDescendantIds(categories: Category[]): number[] {
  return categories.flatMap((category) => [
    category.id,
    ...collectDescendantIds(category.children ?? []),
  ])
}

export function AdminCategoriesPage() {
  const { t } = useTranslation()
  const { data: tree, isLoading, error, refetch } = useAdminCategoryTree()
  const toggleMutation = useToggleAdminCategory()
  const createMutation = useCreateAdminCategory()
  const updateMutation = useUpdateAdminCategory()
  const deleteMutation = useDeleteAdminCategory()

  const flat = useMemo(() => flattenTree(tree ?? []), [tree])

  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [defaultParent, setDefaultParent] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE')
  const [formParent, setFormParent] = useState<string>('none')
  const [formActive, setFormActive] = useState(true)
  const [formSortOrder, setFormSortOrder] = useState<string>('0')
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fieldError = (key: string) => formErrors[key]?.[0]

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    if (successTimer.current) clearTimeout(successTimer.current)
    successTimer.current = setTimeout(() => setSuccessMessage(null), 4000)
  }

  const visible = flat.filter(
    (f) => f.depth === 0 || expanded.has(f.category.parent_id!),
  )

  const parentOptions = useMemo(() => {
    const exclude = editing ? new Set(collectDescendantIds([editing])) : new Set<number>()
    return flat.filter((f) => !exclude.has(f.category.id))
  }, [flat, editing])

  const getNextSortOrder = (parentId: number | null) => {
    const siblings = parentId === null
      ? flat.filter((f) => f.category.parent_id === null)
      : flat.filter((f) => f.category.parent_id === parentId)
    if (siblings.length === 0) return '0'
    const max = Math.max(...siblings.map((s) => s.category.sort_order ?? 0))
    return String(max + 1)
  }

  const openCreate = (parent: Category | null = null) => {
    setEditing(null)
    setFormStatus('ACTIVE')
    setFormActive(true)
    setFormParent(parent ? String(parent.id) : 'none')
    setFormSortOrder(getNextSortOrder(parent ? parent.id : null))
    setFormErrors({})
    setDialogOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditing(category)
    setFormStatus(category.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE')
    setFormActive(category.is_active)
    setFormParent(category.parent_id ? String(category.parent_id) : 'none')
    setFormSortOrder(category.sort_order !== undefined && category.sort_order !== null ? String(category.sort_order) : '0')
    setFormErrors({})
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormErrors({})
    const form = new FormData(e.currentTarget)
    const payload: Partial<Category> = {
      name: String(form.get('name')).trim(),
      description: String(form.get('description') || '').trim() || null,
      parent_id: formParent === 'none' ? null : Number(formParent),
      icon: String(form.get('icon') || '').trim() || null,
      image: String(form.get('image') || '').trim() || null,
      sort_order: Number(formSortOrder || form.get('sort_order') || 0),
      status: formStatus,
      is_active: formActive,
      meta_title: String(form.get('meta_title') || '').trim() || null,
      meta_description: String(form.get('meta_description') || '').trim() || null,
      meta_keywords: String(form.get('meta_keywords') || '').trim() || null,
    }

    const parent = payload.parent_id !== null ? flat.find((f) => f.category.id === payload.parent_id) : undefined
    const label = payload.parent_id === null
      ? t('Category')
      : parent?.depth === 0
        ? t('Subcategory')
        : t('Child category')

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      showSuccess(t('{{label}} {{action}} successfully.', { label, action: editing ? t('updated') : t('created') }))
      if (defaultParent) setExpanded((prev) => new Set(prev).add(Number(defaultParent)))
      setDialogOpen(false)
    } catch (error) {
      const data = (error as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data
      setFormErrors(data?.errors ?? {})
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      const wasParent = deleting.parent_id
      await deleteMutation.mutateAsync(deleting.id)
      showSuccess(t('"{{name}}" deleted successfully.', { name: deleting.name }))
      if (wasParent) setExpanded((prev) => new Set(prev).add(wasParent))
      setDeleting(null)
    } catch {
      /* keep dialog open to show backend error */
    }
  }

  const toggleExpanded = (id: number, hasChildren: boolean) => {
    if (!hasChildren) return
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const mutationError = editing ? updateMutation.error : createMutation.error

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t('Categories')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('Manage a three-level category hierarchy (categories, subcategories, and children).')}
          </p>
        </div>
        <Button onClick={() => openCreate()}>
          <Plus className="h-4 w-4" />
          {t('Add Category')}
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

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <ApiError error={error} onRetry={refetch} />
      ) : !flat.length ? (
        <EmptyState message={t('No categories yet. Create the first one to get started.')} />
      ) : (
        <div className="rounded-lg border bg-background">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t('Name')}</th>
                  <th className="px-4 py-3 font-medium">{t('Slug')}</th>
                  <th className="px-4 py-3 font-medium">{t('Type')}</th>
                  <th className="px-4 py-3 font-medium">{t('Status')}</th>
                  <th className="px-4 py-3 font-medium">{t('Active')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(({ category, depth }) => {
                  const hasChildren = (category.children?.length ?? 0) > 0
                  const isExpanded = expanded.has(category.id)
                  return (
                    <tr key={category.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="flex items-center gap-1.5 font-medium"
                          style={{ paddingLeft: depth * 20 }}
                          onClick={() => toggleExpanded(category.id, hasChildren)}
                        >
                          {hasChildren ? (
                            isExpanded ? (
                              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )
                          ) : (
                            <span className="h-4 w-4 shrink-0" />
                          )}
                          {category.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{category.slug}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {depth === 0 ? t('Category') : depth === 1 ? t('Subcategory') : t('Child')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md border px-2.5 py-0.5 text-xs font-semibold">
                          {category.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleMutation.mutate(category.id)}
                          title={t('Toggle active')}
                          disabled={toggleMutation.isPending}
                        >
                          <ActiveBadge active={category.is_active} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDefaultParent(category.id)
                              openCreate(category)
                            }}
                          >
                            {t('Add Sub')}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEdit(category)}>
                            {t('Edit')}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleting(category)}
                          >
                            {t('Delete')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!flat.length ? <EmptyState message={t('No categories found.')} /> : null}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t('Edit Category') : t('Add Category')}</DialogTitle>
            <DialogDescription>
              {editing
                ? t('Update the category details below.')
                : t('Fill in the details to create a new category.')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            <FormField label={t('Name')} error={fieldError('name')}>
              <Input name="name" defaultValue={editing?.name ?? ''} required placeholder={t('e.g. Electronics')} />
            </FormField>
            <FormField label={t('Parent Category')} error={fieldError('parent_id')}>
              <Select value={formParent} onValueChange={setFormParent}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('None (top level)')}</SelectItem>
                  {parentOptions.map(({ category, depth }) =>
                    category.id !== editing?.id ? (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {'— '.repeat(depth)}
                        {category.name}
                      </SelectItem>
                    ) : null,
                  )}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={t('Description')} error={fieldError('description')}>
              <Textarea name="description" defaultValue={editing?.description ?? ''} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('Icon')} error={fieldError('icon')}>
                <Input name="icon" defaultValue={editing?.icon ?? ''} placeholder={t('lucide icon name')} />
              </FormField>
              <FormField label={t('Image URL')} error={fieldError('image')}>
                <ImageField name="image" initialValue={editing?.image ?? ''} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('Sort Order')} error={fieldError('sort_order')}>
                <Input name="sort_order" type="number" value={formSortOrder} onChange={(e) => setFormSortOrder(e.target.value)} />
              </FormField>
              <FormField label={t('Status')}>
                <Select
                  value={formStatus}
                  onValueChange={(v) => setFormStatus(v as 'ACTIVE' | 'INACTIVE')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{t('ACTIVE')}</SelectItem>
                    <SelectItem value="INACTIVE">{t('INACTIVE')}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={formActive} onCheckedChange={setFormActive} />
              {t('Active')}
            </label>
            <details className="rounded-md border p-3 text-sm">
              <summary className="cursor-pointer font-medium text-muted-foreground">
                {t('SEO Meta')}
              </summary>
              <div className="mt-3 space-y-3">
                <FormField label={t('Meta Title')} error={fieldError('meta_title')}>
                  <Input name="meta_title" defaultValue={editing?.meta_title ?? ''} />
                </FormField>
                <FormField label={t('Meta Description')} error={fieldError('meta_description')}>
                  <Textarea name="meta_description" defaultValue={editing?.meta_description ?? ''} rows={3} />
                </FormField>
                <FormField label={t('Meta Keywords')} error={fieldError('meta_keywords')}>
                  <Input
                    name="meta_keywords"
                    defaultValue={editing?.meta_keywords ?? ''}
                    placeholder={t('comma, separated, keywords')}
                  />
                </FormField>
              </div>
            </details>
            {mutationError ? (
              <p className="text-sm text-destructive">
                {(mutationError as { message?: string }).message}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? t('Saving...') : editing ? t('Save Changes') : t('Create Category')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t('Delete Category')}
        description={t('Are you sure you want to delete "{{name}}"? Categories with children cannot be deleted.', {
          name: deleting?.name,
        })}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        error={deleteMutation.error?.message ?? null}
      />
    </div>
  )
}