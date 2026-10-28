import { useEffect, useState } from 'react'
import { Palette, Plus, Search } from 'lucide-react'
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
import {
  useAdminAttributes,
  useAdminAttributeValues,
  useCreateAdminAttribute,
  useCreateAdminAttributeValue,
  useDeleteAdminAttribute,
  useDeleteAdminAttributeValue,
  useToggleAdminAttribute,
  useToggleAdminAttributeValue,
  useUpdateAdminAttribute,
  useUpdateAdminAttributeValue,
} from '@/hooks/useCatalog'
import type { Attribute, AttributeType, AttributeValue } from '@/types'
import {
  ActiveBadge,
  ApiError,
  ConfirmDialog,
  EmptyState,
  FormField,
  PaginationFooter,
} from '@/components/common/admin'
import { useTranslation } from 'react-i18next'

const ATTRIBUTE_TYPES: AttributeType[] = ['SELECT', 'RADIO', 'BUTTON', 'COLOR']

const ATTRIBUTE_TYPE_LABELS: Record<AttributeType, string> = {
  SELECT: 'Select',
  RADIO: 'Radio',
  BUTTON: 'Button',
  COLOR: 'Color',
}

export function AdminAttributesPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [type, setType] = useState<string>('all')
  const [onlyActive, setOnlyActive] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Attribute | null>(null)
  const [deleting, setDeleting] = useState<Attribute | null>(null)
  const [formType, setFormType] = useState<AttributeType>('SELECT')
  const [formActive, setFormActive] = useState(true)
  const [valuesFor, setValuesFor] = useState<Attribute | null>(null)

  const { data, isLoading, error, refetch } = useAdminAttributes({
    page,
    per_page: 15,
    search: debouncedSearch || undefined,
    ...(type !== 'all' ? { type } : {}),
    is_active: onlyActive ? true : undefined,
  })

  const createMutation = useCreateAdminAttribute()
  const updateMutation = useUpdateAdminAttribute()
  const toggleMutation = useToggleAdminAttribute()
  const deleteMutation = useDeleteAdminAttribute()

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const openCreate = () => {
    setEditing(null)
    setFormType('SELECT')
    setFormActive(true)
    setDialogOpen(true)
  }

  const openEdit = (attribute: Attribute) => {
    setEditing(attribute)
    setFormType(attribute.type)
    setFormActive(attribute.is_active)
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const payload = {
      name: String(form.get('name')).trim(),
      type: formType,
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
      /* keep dialog open to show backend error */
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const mutationError = editing ? updateMutation.error : createMutation.error

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t('Attributes')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('Manage product attributes and their selectable values.')}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('Add Attribute')}
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
            placeholder={t('Search attributes...')}
            className="w-64 pl-8"
          />
        </div>
        <Select
          value={type}
          onValueChange={(v) => {
            setType(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('All Types')}</SelectItem>
            {ATTRIBUTE_TYPES.map((typeOpt) => (
              <SelectItem key={typeOpt} value={typeOpt}>
                {t(ATTRIBUTE_TYPE_LABELS[typeOpt])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <EmptyState message="No attributes found." />
      ) : (
        <div className="rounded-lg border bg-background">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t('Name')}</th>
                  <th className="px-4 py-3 font-medium">{t('Type')}</th>
                  <th className="px-4 py-3 font-medium">{t('Values')}</th>
                  <th className="px-4 py-3 font-medium">{t('Status')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((attribute) => (
                  <tr key={attribute.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{attribute.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1">
                        {attribute.type === 'COLOR' ? (
                          <Palette className="h-3.5 w-3.5" />
                        ) : null}
                        {t(ATTRIBUTE_TYPE_LABELS[attribute.type])}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {attribute.values_count}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleMutation.mutate(attribute.id)}
                        title={t('Toggle status')}
                        disabled={toggleMutation.isPending}
                      >
                        <ActiveBadge active={attribute.is_active} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setValuesFor(attribute)}
                        >
                          {t('Manage Values')}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(attribute)}>
                          {t('Edit')}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleting(attribute)}
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
            <DialogTitle>{editing ? 'Edit Attribute' : 'Add Attribute'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update the attribute details below.'
                : 'Fill in the details to create a new attribute.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label={t('Name')}>
              <Input name="name" defaultValue={editing?.name ?? ''} required placeholder={t('e.g. Material')} />
            </FormField>
            <FormField label={t('Type')}>
              <Select value={formType} onValueChange={(v) => setFormType(v as AttributeType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTRIBUTE_TYPES.map((typeOpt) => (
                    <SelectItem key={typeOpt} value={typeOpt}>
                      {t(ATTRIBUTE_TYPE_LABELS[typeOpt])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                {isSaving ? 'Saving...' : editing ? 'Save Changes' : 'Create Attribute'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {valuesFor ? <AttributeValuesDialog attribute={valuesFor} onClose={() => setValuesFor(null)} /> : null}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t('Delete Attribute')}
        description={`Are you sure you want to delete "${deleting?.name}"? Attributes with values cannot be deleted.`}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        error={deleteMutation.error?.message ?? null}
      />
    </div>
  )
}

function AttributeValuesDialog({
  attribute,
  onClose,
}: {
  attribute: Attribute
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { data, isLoading, error, refetch } = useAdminAttributeValues(attribute.id)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingValue, setEditingValue] = useState<AttributeValue | null>(null)
  const [deletingValue, setDeletingValue] = useState<AttributeValue | null>(null)
  const [search, setSearch] = useState('')

  const createMutation = useCreateAdminAttributeValue()
  const updateMutation = useUpdateAdminAttributeValue()
  const toggleMutation = useToggleAdminAttributeValue()
  const deleteMutation = useDeleteAdminAttributeValue()

  const [formSort, setFormSort] = useState(0)
  const [formActive, setFormActive] = useState(true)

  const openValueDialog = (value: AttributeValue | null) => {
    setEditingValue(value)
    setFormSort(value?.sort_order ?? 0)
    setFormActive(value?.is_active ?? true)
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const payload = {
      value: String(form.get('value')).trim(),
      swatch_color: String(form.get('swatch_color') || '').trim().toUpperCase() || null,
      sort_order: formSort,
      is_active: formActive,
      attribute_id: attribute.id,
    }
    if (editingValue) {
      await updateMutation.mutateAsync({ id: editingValue.id, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    setDialogOpen(false)
  }

  const handleDelete = async () => {
    if (!deletingValue) return
    try {
      await deleteMutation.mutateAsync(deletingValue.id)
      setDeletingValue(null)
    } catch {
      /* keep dialog open */
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const mutationError = editingValue ? updateMutation.error : createMutation.error
  const values = (data?.data ?? []).filter((v) =>
    search ? v.value.toLowerCase().includes(search.toLowerCase()) : true,
  )

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Values for “{attribute.name}”</DialogTitle>
          <DialogDescription>
            {t('Add, edit, or remove the selectable options for this attribute.')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Filter values...')}
              className="w-56 pl-8"
            />
          </div>
          <Button onClick={() => openValueDialog(null)}>
            <Plus className="h-4 w-4" />
            {t('Add Value')}
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
        ) : values.length === 0 ? (
          <EmptyState message="No values found." />
        ) : (
          <div className="max-h-80 overflow-y-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/50">
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">{t('Value')}</th>
                  <th className="px-4 py-2 font-medium">{t('Swatch')}</th>
                  <th className="px-4 py-2 font-medium">{t('Order')}</th>
                  <th className="px-4 py-2 font-medium">{t('Status')}</th>
                  <th className="px-4 py-2 text-right font-medium">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {values.map((value) => (
                  <tr key={value.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{value.value}</td>
                    <td className="px-4 py-2">
                      {value.swatch_color ? (
                        <span
                          className="inline-block h-5 w-5 rounded border"
                          style={{ backgroundColor: value.swatch_color }}
                        />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{value.sort_order}</td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => toggleMutation.mutate(value.id)}
                        title={t('Toggle status')}
                        disabled={toggleMutation.isPending}
                      >
                        <ActiveBadge active={value.is_active} />
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openValueDialog(value)}
                        >
                          {t('Edit')}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletingValue(value)}
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
              <DialogTitle>{editingValue ? 'Edit Value' : 'Add Value'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label={t('Value')}>
                <Input
                  name="value"
                  defaultValue={editingValue?.value ?? ''}
                  required
                  placeholder={t('e.g. Cotton')}
                />
              </FormField>
              <FormField label={t('Swatch Color (optional)')} error="Format: #RRGGBB">
                <Input
                  name="swatch_color"
                  defaultValue={editingValue?.swatch_color ?? ''}
                  placeholder="#FFFFFF"
                  pattern="#[0-9a-fA-F]{6}"
                />
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
                  {isSaving ? 'Saving...' : editingValue ? 'Save Changes' : 'Add Value'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={deletingValue !== null}
          onOpenChange={(open) => !open && setDeletingValue(null)}
          title={t('Delete Value')}
          description={`Are you sure you want to delete the value "${deletingValue?.value}"?`}
          onConfirm={handleDelete}
          loading={deleteMutation.isPending}
          error={deleteMutation.error?.message ?? null}
        />
      </DialogContent>
    </Dialog>
  )
}