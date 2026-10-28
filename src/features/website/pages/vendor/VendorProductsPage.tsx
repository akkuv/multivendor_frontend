import { useEffect, useState } from 'react'
import { assetUrl } from '@/lib/assets'
import { Package, Plus, RotateCw, Search, Trash2, Warehouse } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
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
  ActiveBadge,
  ApiError,
  ConfirmDialog,
  EmptyState,
  FormField,
  PaginationFooter,
} from '@/components/common/admin'
import { ProductDetailsDialog } from '@/components/vendor/ProductDetailsDialog'
import { ProductFormDialog } from '@/components/vendor/ProductFormDialog'
import {
  useAdjustVendorInventory,
  useDeleteVendorProduct,
  useToggleVendorProduct,
  useVendorProducts,
} from '@/hooks/useVendor'
import { getVendorProduct } from '@/services/vendor'
import type { Product, ProductVariant } from '@/types'
import { formatCurrency } from '@/utils/format'
import { useTranslation } from 'react-i18next'

function statusBadge(status: Product['status'], t: (k: string) => string) {
  switch (status) {
    case 'PUBLISHED':
      return <Badge variant="success">{t('Published')}</Badge>
    case 'ARCHIVED':
      return <Badge variant="outline">{t('Archived')}</Badge>
    default:
      return <Badge variant="secondary">{t('Draft')}</Badge>
  }
}

function approvalBadge(product: Product, t: (k: string) => string) {
  switch (product.approval_status) {
    case 'APPROVED':
      return <Badge variant="success">{t('Approved')}</Badge>
    case 'REJECTED':
      return (
        <Badge variant="destructive" title={product.rejection_reason ?? undefined}>
          {t('Rejected')}
        </Badge>
      )
    default:
      return <Badge variant="warning">{t('Pending')}</Badge>
  }
}

const ADJUST_TYPES = [
  { value: 'ADD', label: 'Add' },
  { value: 'RETURN', label: 'Return' },
  { value: 'DAMAGED', label: 'Damaged' },
] as const

export function VendorProductsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [stockProduct, setStockProduct] = useState<Product | null>(null)

  const [stockVariantId, setStockVariantId] = useState('')
  const [stockType, setStockType] = useState<'ADD' | 'RETURN' | 'DAMAGED'>('ADD')
  const [stockQuantity, setStockQuantity] = useState('')
  const [stockReason, setStockReason] = useState('')

  const { data, isLoading, error, refetch } = useVendorProducts({
    page,
    per_page: 15,
    search: debouncedSearch || undefined,
  })

  const toggleMutation = useToggleVendorProduct()
  const deleteMutation = useDeleteVendorProduct()
  const adjustMutation = useAdjustVendorInventory(stockProduct?.id)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const openCreate = () => {
    setEditingProduct(null)
    setDialogOpen(true)
  }

  const openEdit = async (product: Product) => {
    setDetailLoading(true)
    try {
      const detail = await getVendorProduct(product.id)
      setDetailsProduct(null)
      setEditingProduct(detail)
      setDialogOpen(true)
    } catch {
      /* fetch failure keeps row actions usable */
    } finally {
      setDetailLoading(false)
    }
  }

  const openDetails = (product: Product) => {
    setDialogOpen(false)
    setEditingProduct(null)
    setDetailsProduct(product)
  }

  const openStock = (product: Product) => {
    setStockProduct(product)
    setStockVariantId(String(product.variants?.[0]?.id ?? ''))
    setStockType('ADD')
    setStockQuantity('')
    setStockReason('')
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

  const handleAdjustStock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!stockProduct) return
    const quantity = Number(stockQuantity)
    if (!Number.isFinite(quantity) || quantity <= 0) return

    try {
      await adjustMutation.mutateAsync({
        variant_id: stockVariantId ? Number(stockVariantId) : null,
        type: stockType,
        quantity,
        reason: stockReason.trim() || undefined,
      })
      setStockProduct(null)
    } catch {
      /* keep dialog open to show backend error */
    }
  }

  const adjustError = adjustMutation.error
  const adjustMessage =
    typeof adjustError === 'object' && adjustError !== null && 'message' in adjustError
      ? String((adjustError as { message: unknown }).message)
      : null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t('Products')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('Create and manage your store products. New products need admin approval to go live.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} title={t('Refresh')}>
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t('Add Product')}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder={t('Search products...')}
            className="w-64 pl-8"
          />
        </div>
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
        <EmptyState message="No products found." />
      ) : (
        <div className="rounded-lg border bg-background">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t('Product')}</th>
                  <th className="px-4 py-3 font-medium">{t('Category')}</th>
                  <th className="px-4 py-3 font-medium">{t('Price')}</th>
                  <th className="px-4 py-3 font-medium">{t('Stock')}</th>
                  <th className="px-4 py-3 font-medium">{t('Status')}</th>
                  <th className="px-4 py-3 font-medium">{t('Approval')}</th>
                  <th className="px-4 py-3 font-medium">{t('Active')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((product) => (
                  <tr key={product.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openDetails(product)}
                        className="flex items-center gap-3 rounded-md text-left transition-colors hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        title={t('View product details')}
                      >
                        {product.images[0] ? (
                          <img
                            src={assetUrl(product.images[0])}
                            alt={product.name}
                            className="h-10 w-10 shrink-0 rounded-md border object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="max-w-xs truncate font-medium">{product.name}</p>
                          {product.sku ? (
                            <p className="text-xs text-muted-foreground">{product.sku}</p>
                          ) : null}
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.category?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrency(product.price)}
                      {product.mrp && product.mrp > product.price ? (
                        <span className="ml-1 text-xs text-muted-foreground line-through">
                          {formatCurrency(product.mrp)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{product.available_stock ?? product.stock}</td>
                    <td className="px-4 py-3">{statusBadge(product.status, t)}</td>
                    <td className="px-4 py-3">{approvalBadge(product, t)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleMutation.mutate(product.id)}
                        title={t('Toggle active status')}
                        disabled={toggleMutation.isPending || detailLoading}
                      >
                        <ActiveBadge active={product.is_active} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openStock(product)}
                          disabled={detailLoading}
                          title={t('Adjust stock')}
                        >
                          <Warehouse className="h-3.5 w-3.5" />
                          {t('Stock')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(product)}
                          disabled={detailLoading}
                        >
                          {detailLoading ? 'Loading...' : 'Edit'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleting(product)}
                          disabled={detailLoading}
                          title={t('Delete product')}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      {dialogOpen ? (
        <ProductFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          product={editingProduct}
        />
      ) : null}

      <ProductDetailsDialog
        open={detailsProduct !== null}
        onOpenChange={(open) => !open && setDetailsProduct(null)}
        product={detailsProduct}
        onEdit={(product) => openEdit(product)}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t('Delete Product')}
        description={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        error={deleteMutation.error?.message ?? null}
      />

      <Dialog open={stockProduct !== null} onOpenChange={(open) => !open && setStockProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Adjust Stock')}</DialogTitle>
            <DialogDescription>
              {stockProduct?.name} — record an inventory adjustment.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdjustStock} className="space-y-4">
            {stockProduct && (stockProduct.variants?.length ?? 0) > 0 ? (
              <FormField label={t('Variant')}>
                <Select value={stockVariantId} onValueChange={setStockVariantId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select variant')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(stockProduct.variants as ProductVariant[] | undefined)?.map((variant) => (
                      <SelectItem key={variant.id} value={String(variant.id)}>
                        {Object.entries(variant.attributes)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(', ') || variant.sku || `Variant #${variant.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('Adjusting base product stock.')}
              </p>
            )}
            <FormField label={t('Adjustment type')}>
              <Select
                value={stockType}
                onValueChange={(v) => setStockType(v as 'ADD' | 'RETURN' | 'DAMAGED')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADJUST_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={t('Quantity')}>
              <Input
                type="number"
                min="1"
                step="1"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder={t('e.g. 10')}
                required
              />
            </FormField>
            <FormField label={t('Reason (optional)')}>
              <Input
                value={stockReason}
                onChange={(e) => setStockReason(e.target.value)}
                placeholder={t('e.g. Restock from supplier')}
              />
            </FormField>
            {adjustMessage ? <p className="text-sm text-destructive">{adjustMessage}</p> : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStockProduct(null)}
                disabled={adjustMutation.isPending}
              >
                {t('Cancel')}
              </Button>
              <Button type="submit" disabled={adjustMutation.isPending}>
                {adjustMutation.isPending ? 'Saving...' : 'Apply adjustment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}