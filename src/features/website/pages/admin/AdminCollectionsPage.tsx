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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useAdminCollections,
  useCreateAdminCollection,
  useDeleteAdminCollection,
  useToggleAdminCollection,
  useUpdateAdminCollection,
} from '@/hooks/useCatalog'
import type { Collection } from '@/types'
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

const genders: Array<{ value: Collection['gender']; label: string }> = [
  { value: 'female', label: 'Women' },
  { value: 'male', label: 'Men' },
  { value: 'kids', label: 'Kids' },
  { value: 'unisex', label: 'Unisex' },
]

export function AdminCollectionsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState<string>('ALL')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Collection | null>(null)
  const [deleting, setDeleting] = useState<Collection | null>(null)
  const [formActive, setFormActive] = useState(true)
  const [formGender, setFormGender] = useState<Collection['gender']>('female')
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fieldError = (key: string) => formErrors[key]?.[0]

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    if (successTimer.current) clearTimeout(successTimer.current)
    successTimer.current = setTimeout(() => setSuccessMessage(null), 4000)
  }

  const { data, isLoading, error, refetch } = useAdminCollections({
    page,
    per_page: 15,
    search: debouncedSearch || undefined,
    gender: genderFilter === 'ALL' ? undefined : genderFilter,
  })

  const createMutation = useCreateAdminCollection()
  const updateMutation = useUpdateAdminCollection()
  const toggleMutation = useToggleAdminCollection()
  const deleteMutation = useDeleteAdminCollection()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => () => {
    if (successTimer.current) clearTimeout(successTimer.current)
  }, [])

  const openCreate = () => {
    setEditing(null)
    setFormActive(true)
    setFormGender('female')
    setFormErrors({})
    setDialogOpen(true)
  }

  const openEdit = (collection: Collection) => {
    setEditing(collection)
    setFormActive(collection.is_active)
    setFormGender(collection.gender)
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
      image: String(form.get('image') || '').trim() || null,
      banner_image: String(form.get('banner_image') || '').trim() || null,
      gender: formGender,
      sort_order: Number(form.get('sort_order') || 0),
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
      showSuccess(editing ? t('Collection updated successfully.') : t('Collection created successfully.'))
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
          <h1 className="text-xl font-semibold">{t('Collections')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('Curate KALKI-style edits for the storefront, grouped by gender.')}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('Add Collection')}
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
            placeholder={t('Search collections...')}
            className="w-64 pl-8"
          />
        </div>
        <Select
          value={genderFilter}
          onValueChange={(value) => {
            setGenderFilter(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('All genders')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('All genders')}</SelectItem>
            {genders.map((gender) => (
              <SelectItem key={gender.value} value={gender.value}>
                {t(gender.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <EmptyState message={t('No collections found.')} />
      ) : (
        <div className="rounded-lg border bg-background">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t('Name')}</th>
                  <th className="px-4 py-3 font-medium">{t('Slug')}</th>
                  <th className="px-4 py-3 font-medium">{t('Gender')}</th>
                  <th className="px-4 py-3 font-medium">{t('Products')}</th>
                  <th className="px-4 py-3 font-medium">{t('Order')}</th>
                  <th className="px-4 py-3 font-medium">{t('Status')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((collection) => (
                  <tr key={collection.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{collection.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{collection.slug}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t(genders.find((g) => g.value === collection.gender)?.label ?? 'Unisex')}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{collection.products_count ?? 0}</td>
                    <td className="px-4 py-3 text-muted-foreground">{collection.sort_order}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleMutation.mutate(collection.id)}
                        title={t('Toggle status')}
                        disabled={toggleMutation.isPending}
                      >
                        <ActiveBadge active={collection.is_active} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(collection)}>
                          {t('Edit')}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleting(collection)}
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
            <DialogTitle>{editing ? t('Edit Collection') : t('Add Collection')}</DialogTitle>
            <DialogDescription>
              {editing
                ? t('Update the collection details below.')
                : t('Fill in the details to create a new collection.')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label={t('Name')} error={fieldError('name')}>
              <Input name="name" defaultValue={editing?.name ?? ''} required placeholder={t('e.g. Bridal Couture')} />
            </FormField>
            <FormField label={t('Gender')} error={fieldError('gender')}>
              <Select value={formGender} onValueChange={(value) => setFormGender(value as Collection['gender'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {genders.map((gender) => (
                    <SelectItem key={gender.value} value={gender.value}>
                      {t(gender.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={t('Description')} error={fieldError('description')}>
              <Textarea name="description" defaultValue={editing?.description ?? ''} />
            </FormField>
            <FormField label={t('Card image URL')} error={fieldError('image')}>
              <ImageField
                label={t('Card image URL')}
                name="image"
                initialValue={editing?.image ?? ''}
                placeholder={t('https://.../collection.jpg')}
              />
            </FormField>
            <FormField label={t('Banner image URL')} error={fieldError('banner_image')}>
              <ImageField
                label={t('Banner image URL')}
                name="banner_image"
                initialValue={editing?.banner_image ?? ''}
                placeholder={t('https://.../banner.jpg')}
              />
            </FormField>
            <FormField label={t('Sort order')} error={fieldError('sort_order')}>
              <Input
                name="sort_order"
                type="number"
                min={0}
                defaultValue={editing?.sort_order ?? 0}
              />
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
                {isSaving ? t('Saving...') : editing ? t('Save Changes') : t('Create Collection')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t('Delete Collection')}
        description={t('Are you sure you want to delete "{{name}}"? This action cannot be undone.', { name: deleting?.name })}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        error={deleteMutation.error?.message ?? null}
      />
    </div>
  )
}
