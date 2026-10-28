import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { assetUrl } from '@/lib/assets'
import {
  Boxes,
  Building2,
  CalendarDays,
  CheckCircle2,
  Hash,
  IndianRupee,
  Layers,
  Package,
  Pencil,
  Percent,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingBag,
  Star,
  Tag,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
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
import { ConfirmDialog, EmptyState, PaginationFooter } from '@/components/common/admin'
import {
  useAdminProducts,
  useAdminProduct,
  useAdminProductMutation,
  useAdminProductPublish,
  useAdminProductFlag,
  useDeleteAdminProduct,
  useUpdateAdminProductReturnPolicy,
} from '@/hooks/useAdmin'
import { useDebouncedUrlFilter, useUrlFilters } from '@/hooks/useUrlFilters'
import { formatCurrency, formatDate } from '@/utils/format'
import type { Product } from '@/types'
import { useTranslation } from 'react-i18next'

const APPROVAL_VARIANTS: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  APPROVED: 'success',
  PENDING_APPROVAL: 'warning',
  REJECTED: 'destructive',
}

function ProductImage({ product }: { product: Product }) {
  if (!product.images || product.images.length === 0) return null
  return <img src={assetUrl(product.images[0])} alt="" className="h-11 w-11 rounded-lg object-cover" />
}

function ProductDetailItem({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

function ProductDetailDialog({ id, onOpenChange }: { id: number | null; onOpenChange: (v: boolean) => void }) {
  const { t } = useTranslation()
  const { data: product, isLoading } = useAdminProduct(id)
  const [activeImage, setActiveImage] = useState(0)
  const hasImage = !!product?.images?.length

  const {
    mutate: savePolicy,
    isPending: policySaving,
    error: policyError,
  } = useUpdateAdminProductReturnPolicy()
  const [editingPolicy, setEditingPolicy] = useState(false)
  const [policyForm, setPolicyForm] = useState({
    returnable: true,
    days: '7',
    text: '',
  })

  useEffect(() => {
    if (!product) return
    setEditingPolicy(false)
    setPolicyForm({
      returnable: product.is_returnable,
      days: product.return_days != null ? String(product.return_days) : '7',
      text: product.return_policy ?? '',
    })
  }, [product])

  const handleSavePolicy = () => {
    if (!product) return
    savePolicy({
      id: product.id,
      data: {
        is_returnable: policyForm.returnable,
        return_days:
          policyForm.returnable && policyForm.days
            ? Math.max(1, Math.min(365, Number(policyForm.days)))
            : null,
        return_policy: policyForm.text.trim() || null,
      },
    })
  }

  return (
    <Dialog open={id != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        {isLoading || !product ? (
          <div className="grid gap-5 sm:grid-cols-[240px_1fr]">
            <Skeleton className="h-64 rounded-xl" />
            <div className="space-y-3">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="pr-8">{product.name}</DialogTitle>
              <DialogDescription>
                {product.category?.name ?? t('Uncategorized')}
                {product.brand?.name ? ` · ${product.brand.name}` : ''}
                {product.vendor?.store_name ? ` · ${product.vendor.store_name}` : ''}
              </DialogDescription>
              <div className="flex flex-wrap gap-2 pt-0.5">
                <Badge variant={APPROVAL_VARIANTS[product.approval_status] ?? 'secondary'}>{product.approval_status}</Badge>
                <Badge variant={product.status === 'PUBLISHED' ? 'success' : 'secondary'}>{product.status}</Badge>
                {product.featured ? <Badge variant="warning"><Star className="h-3 w-3" /> {t('Featured')}</Badge> : null}
                {product.best_seller ? <Badge variant="warning"><Tag className="h-3 w-3" /> {t('Best Seller')}</Badge> : null}
              </div>
              <Separator />
            </DialogHeader>

            <div className="grid gap-5 sm:grid-cols-[240px_1fr]">
              <div className="space-y-2">
                <div className="overflow-hidden rounded-xl border bg-muted">
                  {hasImage ? (
                    <img
                      src={assetUrl(product.images[Math.min(activeImage, product.images.length - 1)])}
                      alt={product.name}
                      className="aspect-square h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center text-muted-foreground">
                      <Package className="h-10 w-10" />
                    </div>
                  )}
                </div>
                {product.images.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {product.images.map((src, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImage(i)}
                        className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg border ${
                          i === Math.min(activeImage, product.images.length - 1)
                            ? 'border-primary ring-1 ring-primary'
                            : 'border-border'
                        }`}
                      >
                        <img src={assetUrl(src)} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="text-2xl font-bold">{formatCurrency(product.price)}</p>
                  {product.mrp && product.mrp > product.price && (
                    <>
                      <p className="text-sm text-muted-foreground line-through">{formatCurrency(product.mrp)}</p>
                      <Badge variant="warning">{t('{{percent}}% off', { percent: product.discount_percent.toFixed(1) })}</Badge>
                    </>
                  )}
                </div>

                <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  <ProductDetailItem
                    icon={Boxes}
                    label={t('Stock')}
                    value={product.available_stock ?? product.stock}
                  />
                  <ProductDetailItem
                    icon={IndianRupee}
                    label={t('MRP')}
                    value={product.mrp ? formatCurrency(product.mrp) : '—'}
                  />
                  <ProductDetailItem icon={Hash} label={t('SKU')} value={product.sku ?? '—'} />
                  <ProductDetailItem
                    icon={Layers}
                    label={t('Category')}
                    value={product.category?.name ?? product.subcategory?.name ?? '—'}
                  />
                  <ProductDetailItem
                    icon={Building2}
                    label={t('Brand')}
                    value={product.brand?.name ?? '—'}
                  />
                  <ProductDetailItem
                    icon={Percent}
                    label={t('GST / HSN')}
                    value={`${product.gst ?? 0}% · ${product.hsn_code ?? '—'}`}
                  />
                  <ProductDetailItem
                    icon={IndianRupee}
                    label={t('Product fees')}
                    value={
                      product.fees && product.fees.length > 0
                        ? product.fees
                            .map((fee) => `${fee.name} ${formatCurrency(fee.amount)}`)
                            .join(' · ')
                        : '—'
                    }
                  />
                  <ProductDetailItem
                    icon={ShoppingBag}
                    label={t('Store')}
                    value={product.vendor?.store_name ?? t('Vendor #{{id}}', { id: product.vendor_id })}
                  />
                  <ProductDetailItem
                    icon={CalendarDays}
                    label={t('Created')}
                    value={formatDate(product.created_at)}
                  />
                </div>
              </div>
            </div>

            {product.short_description || product.description ? (
              <>
                <Separator />
                <div>
                  <p className="mb-2 text-sm font-semibold">{t('Description')}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.short_description || product.description}
                  </p>
                </div>
              </>
            ) : null}

            <Separator />
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <RotateCcw className="h-4 w-4" /> {t('Return policy')}
                </p>
                {!editingPolicy ? (
                  <Button size="sm" variant="outline" onClick={() => setEditingPolicy(true)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> {t('Edit')}
                  </Button>
                ) : null}
              </div>

              {editingPolicy ? (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{t('Allow customers to return this product')}</p>
                      <p className="text-xs text-muted-foreground">
                        {policyForm.returnable
                          ? t('Return requests will be accepted after delivery.')
                          : t('Customers will not be able to request a return.')}
                      </p>
                    </div>
                    <Switch
                      checked={policyForm.returnable}
                      onCheckedChange={(v) => setPolicyForm((p) => ({ ...p, returnable: v }))}
                    />
                  </div>
                  {policyForm.returnable ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-1">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">{t('Return window (days)')}</label>
                          <Input
                            type="number"
                            min="1"
                            max="365"
                            value={policyForm.days}
                            onChange={(e) =>
                              setPolicyForm((p) => ({ ...p, days: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">{t('Return policy')}</label>
                        <Textarea
                          rows={3}
                          value={policyForm.text}
                          onChange={(e) => setPolicyForm((p) => ({ ...p, text: e.target.value }))}
                          placeholder={t('Return a product within 7 days of delivery for a full refund…')}
                        />
                      </div>
                    </>
                  ) : null}
                  {policyError && 'message' in policyError ? (
                    <p className="text-sm text-destructive">
                      {String((policyError as { message: unknown }).message)}
                    </p>
                  ) : null}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPolicy(false)}
                      disabled={policySaving}
                    >
                      {t('Cancel')}
                    </Button>
                    <Button size="sm" onClick={handleSavePolicy} disabled={policySaving}>
                      {policySaving ? t('Saving…') : t('Save policy')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={product.is_returnable ? 'success' : 'destructive'}>
                      {product.is_returnable ? t('Returnable') : t('Non-returnable')}
                    </Badge>
                    {product.is_returnable && product.return_days ? (
                      <Badge variant="secondary">{t('{{days}}-day return window', { days: product.return_days })}</Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {product.return_policy ?? t('No return policy text set.')}
                  </p>
                </div>
              )}
            </div>

            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="mb-3 text-sm font-semibold">{t('Attributes')}</p>
                  <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                    {Object.entries(product.attributes).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">{key}</span>
                        <span className="font-medium text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {product.variants && product.variants.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">{t('Variants')}</p>
                    <p className="text-xs text-muted-foreground">{t('{{count}} total', { count: product.variants.length })}</p>
                  </div>
                  <div className="divide-y rounded-lg border">
                    {product.variants.map((variant) => (
                      <div key={variant.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium">
                            {Object.entries(variant.attributes)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(' · ') || t('Default')}
                          </p>
                          {variant.sku ? (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <Hash className="h-3 w-3" /> {variant.sku}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(variant.price)}</p>
                            <p className="text-xs text-muted-foreground">{t('{{count}} in stock', { count: variant.available_stock })}</p>
                          </div>
                          <CheckCircle2 className={`h-4 w-4 ${variant.status === 'ACTIVE' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Close')}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ProductActions({ product }: { product: Product }) {
  const { t } = useTranslation()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const approve = useAdminProductMutation('approve')
  const reject = useAdminProductMutation('reject')
  const publish = useAdminProductPublish('publish')
  const unpublish = useAdminProductPublish('unpublish')
  const feature = useAdminProductFlag('feature')
  const bestSeller = useAdminProductFlag('best-seller')
  const del = useDeleteAdminProduct()

  return (
    <div className="flex flex-wrap gap-1.5">
      {product.approval_status === 'PENDING_APPROVAL' && (
        <>
          <Button size="sm" variant="outline" className="text-emerald-600" onClick={() => approve.mutate({ id: product.id })}>
            {t('Approve')}
          </Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => reject.mutate({ id: product.id, reason: rejectReason })}>
            {t('Reject')}
          </Button>
        </>
      )}
      {product.approval_status === 'REJECTED' && (
        <Button size="sm" variant="outline" className="text-emerald-600" onClick={() => approve.mutate({ id: product.id })}>
          {t('Approve')}
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={() => (product.status === 'PUBLISHED' ? unpublish : publish).mutate(product.id)}>
        {product.status === 'PUBLISHED' ? t('Unpublish') : t('Publish')}
      </Button>
      <Button
        size="sm"
        variant={product.featured ? 'default' : 'ghost'}
        onClick={() => feature.mutate(product.id)}
      >
        <Star className="mr-1 h-3.5 w-3.5" /> {product.featured ? t('Featured') : t('Feature')}
      </Button>
      <Button
        size="sm"
        variant={product.best_seller ? 'default' : 'ghost'}
        onClick={() => bestSeller.mutate(product.id)}
      >
        <Tag className="mr-1 h-3.5 w-3.5" /> {product.best_seller ? t('Best Seller') : t('Best Seller')}
      </Button>
      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteOpen(true)}>
        {t('Delete')}
      </Button>

      {product.approval_status === 'PENDING_APPROVAL' && (
        <div className="w-full">
          <Input
            placeholder={t('Rejection reason (if rejecting)')}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="mt-1 h-8 text-xs"
          />
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('Delete product')}
        description={t('Are you sure you want to permanently delete "{{name}}"?', { name: product.name })}
        confirmLabel={t('Delete')}
        loading={del.isPending}
        error={del.error?.message ?? null}
        onConfirm={() => {
          del.mutate(product.id, { onSuccess: () => setDeleteOpen(false) })
        }}
      />
    </div>
  )
}

const PRODUCT_FILTER_KEYS = [
  'search',
  'approval_status',
  'status',
  'category_id',
  'created_days',
  'created_from',
  'created_to',
] as const

export function AdminProductsPage() {
  const { t } = useTranslation()
  const {
    values: filters,
    set: setFilter,
    reset: resetFilters,
    hasActive,
    page,
    setPage,
  } = useUrlFilters(PRODUCT_FILTER_KEYS)
  const { input: search, setInput: setSearch } = useDebouncedUrlFilter('search')
  const [viewId, setViewId] = useState<number | null>(null)
  const { data, isLoading, isError, refetch } = useAdminProducts({
    page,
    per_page: 15,
    search: search || undefined,
    approval_status: filters.approval_status || undefined,
    status: filters.status || undefined,
    category_id: filters.category_id ? Number(filters.category_id) : undefined,
    created_days: filters.created_days ? Number(filters.created_days) : undefined,
    created_from: filters.created_from || undefined,
    created_to: filters.created_to || undefined,
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('Products')}</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('Search products...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filters.approval_status || 'ALL'} onValueChange={(v) => setFilter('approval_status', v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t('All approvals')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('All approvals')}</SelectItem>
            <SelectItem value="PENDING_APPROVAL">{t('Pending')}</SelectItem>
            <SelectItem value="APPROVED">{t('Approved')}</SelectItem>
            <SelectItem value="REJECTED">{t('Rejected')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.status || 'ALL'} onValueChange={(v) => setFilter('status', v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('All statuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('All statuses')}</SelectItem>
            <SelectItem value="PUBLISHED">{t('Published')}</SelectItem>
            <SelectItem value="DRAFT">{t('Draft')}</SelectItem>
            <SelectItem value="ARCHIVED">{t('Archived')}</SelectItem>
          </SelectContent>
        </Select>
        {hasActive && (
          <Button variant="ghost" onClick={resetFilters}>
            <X className="mr-1 h-4 w-4" /> {t('Clear filters')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center justify-between rounded-lg border p-6 text-sm text-destructive">
          {t('Could not load products.')}
          <Button size="sm" variant="outline" onClick={() => refetch()}><RefreshCw className="mr-1 h-4 w-4" /> {t('Retry')}</Button>
        </div>
      ) : data && data.data.length === 0 ? (
        <EmptyState message={t('No products found.')} />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {data?.data.map((product) => (
                  <div key={product.id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/50 md:flex-row md:items-start md:justify-between">
                    <button
                      type="button"
                      onClick={() => setViewId(product.id)}
                      className="flex items-center gap-3 text-left"
                    >
                      <div className="shrink-0 overflow-hidden rounded-lg">
                        <ProductImage product={product} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium underline-offset-4 hover:underline">{product.name}</p>
                          <Badge variant={APPROVAL_VARIANTS[product.approval_status] ?? 'secondary'}>{product.approval_status}</Badge>
                          <Badge variant={product.status === 'PUBLISHED' ? 'success' : 'secondary'}>{product.status}</Badge>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {product.vendor?.store_name ?? t('Vendor #{{id}}', { id: product.vendor_id })} · {formatDate(product.created_at)}
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-sm">
                          <span className="font-semibold">{formatCurrency(product.price)}</span>
                          {product.rejection_reason && (
                            <span className="text-destructive">{t('Rejected: {{reason}}', { reason: product.rejection_reason })}</span>
                          )}
                        </p>
                      </div>
                    </button>
                    <ProductActions product={product} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <PaginationFooter data={data as never} onPageChange={setPage} />
        </>
      )}

      <ProductDetailDialog id={viewId} onOpenChange={(v) => { if (!v) setViewId(null) }} />
    </div>
  )
}