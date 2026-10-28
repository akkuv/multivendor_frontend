import { ExternalLink, CircleHelp } from 'lucide-react'
import { assetUrl } from '@/lib/assets'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { specificationsToText } from '@/utils/product'
import type { Product } from '@/types'
import { formatCurrency } from '@/utils/format'
import { useTranslation } from 'react-i18next'

interface ProductDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onEdit: (product: Product) => void
}

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

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value || '—'}</dd>
    </div>
  )
}

function specLines(product: Product): string[] {
  const text = specificationsToText(product.specifications)
  return text ? text.split('\n') : []
}

export function ProductDetailsDialog({
  open,
  onOpenChange,
  product,
  onEdit,
}: ProductDetailsDialogProps) {
  const { t } = useTranslation()
  if (!product) return null

  const specLinesList = specLines(product)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {product.name}
            {statusBadge(product.status, t)}
          </DialogTitle>
          <DialogDescription>{t('Product #{{id}} — {{sku}}', { id: product.id, sku: product.sku ?? t('no SKU') })}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {product.images.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t('Images')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {product.images.map((image, index) => (
                    <a
                      key={index}
                      href={image}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                    >
                      <img
                        src={assetUrl(image)}
                        alt={`${product.name} ${index + 1}`}
                        className="h-20 w-20 rounded-md border object-cover"
                      />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('Details')}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail label={t('Category')} value={product.category?.name} />
                <Detail label={t('Subcategory')} value={product.subcategory?.name} />
                <Detail label={t('Brand')} value={product.brand?.name} />
                <Detail label={t('Approval')} value={approvalBadge(product, t)} />
                <Detail label={t('Active')} value={product.is_active ? 'Yes' : 'No'} />
                <Detail label={t('Featured')} value={product.featured ? 'Yes' : 'No'} />
                <Detail label={t('Best seller')} value={product.best_seller ? 'Yes' : 'No'} />
                <Detail label={t('Tax class')} value={product.tax_class} />
                <Detail label={t('GST')} value={product.gst != null ? `${product.gst}%` : null} />
                <Detail label={t('HSN code')} value={product.hsn_code} />
                {product.rejection_reason ? (
                  <div className="sm:col-span-2">
                    <Detail label={t('Rejection reason')} value={product.rejection_reason} />
                  </div>
                ) : null}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('Pricing & stock')}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail label={t('Price')} value={formatCurrency(product.price)} />
                <Detail label={t('MRP')} value={product.mrp != null ? formatCurrency(product.mrp) : null} />
                <Detail
                  label={t('Discount')}
                  value={product.discount_percent > 0 ? `${product.discount_percent}%` : null}
                />
                <Detail
                  label={t('Product fees')}
                  value={
                    product.fees && product.fees.length > 0
                      ? product.fees
                          .map((fee) => `${fee.name} ${formatCurrency(fee.amount)}`)
                          .join(' · ')
                      : null
                  }
                />
                <Detail label={t('Stock')} value={product.available_stock ?? product.stock} />
                <Detail
                  label={t('Rating')}
                  value={
                    product.rating && product.rating.count > 0
                      ? `${product.rating.average} (${product.rating.count} reviews)`
                      : null
                  }
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('Description')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {product.short_description ? (
                <p className="text-sm text-muted-foreground">{product.short_description}</p>
              ) : null}
              <p className="text-sm whitespace-pre-line">{product.description || 'No description.'}</p>
              {specLinesList.length > 0 ? (
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {specLinesList.map((line, index) => (
                    <li key={index}>{line}</li>
                  ))}
                </ul>
              ) : null}
              {product.highlights && product.highlights.length > 0 ? (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">{t('Highlights')}</p>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    {product.highlights.map((highlight, index) => (
                      <li key={index}>{highlight}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {product.manufacturer_info ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t('Manufacturer details')}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Detail label={t('Manufacturer')} value={product.manufacturer_info.manufacturer} />
                  <Detail label={t('Country of origin')} value={product.manufacturer_info.country_of_origin} />
                  <div className="sm:col-span-2">
                    <Detail label={t('Manufacturer address')} value={product.manufacturer_info.manufacturer_address} />
                  </div>
                  <Detail label={t('Packer')} value={product.manufacturer_info.packer} />
                  <Detail label={t('Importer')} value={product.manufacturer_info.importer} />
                  <div className="sm:col-span-2">
                    <Detail label={t('Packer address')} value={product.manufacturer_info.packer_address} />
                  </div>
                  <div className="sm:col-span-2">
                    <Detail label={t('Importer address')} value={product.manufacturer_info.importer_address} />
                  </div>
                </dl>
              </CardContent>
            </Card>
          ) : null}

          {product.variants && product.variants.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t('Variants')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-2 py-2 font-medium">{t('Options')}</th>
                        <th className="px-2 py-2 font-medium">{t('SKU')}</th>
                        <th className="px-2 py-2 font-medium">{t('Price')}</th>
                        <th className="px-2 py-2 font-medium">{t('Stock')}</th>
                        <th className="px-2 py-2 font-medium">{t('Status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((variant) => (
                        <tr key={variant.id} className="border-b last:border-0">
                          <td className="px-2 py-2">
                            {Object.entries(variant.attributes)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(', ') || '—'}
                          </td>
                          <td className="px-2 py-2">{variant.sku || '—'}</td>
                          <td className="px-2 py-2">{formatCurrency(variant.price)}</td>
                          <td className="px-2 py-2">{variant.available_stock ?? variant.stock}</td>
                          <td className="px-2 py-2">
                            {variant.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {product.videos && product.videos.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t('Videos')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {product.videos.map((video) =>
                  video.provider === 'upload' ? (
                    <video
                      key={video.id}
                      src={assetUrl(video.url)}
                      controls
                      className="max-h-52 w-full rounded-md border bg-black object-contain"
                    />
                  ) : (
                    <a
                      key={video.id}
                      href={video.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {video.provider} · {video.url}
                    </a>
                  ),
                )}
              </CardContent>
            </Card>
          ) : null}

          {product.faqs && product.faqs.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CircleHelp className="h-4 w-4 text-muted-foreground" />
                  {t('Frequently asked questions')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...product.faqs]
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((faq) => (
                    <div key={faq.id} className="rounded-md border p-3">
                      <p className="text-sm font-medium">{faq.question}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{faq.answer}</p>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('SEO metadata')}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail label={t('Meta title')} value={product.meta_title} />
                <Detail label={t('Meta keywords')} value={product.meta_keywords} />
                <div className="sm:col-span-2">
                  <Detail label={t('Meta description')} value={product.meta_description} />
                </div>
              </dl>
            </CardContent>
          </Card>

          {product.created_at ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t('Timeline')}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Detail label={t('Created')} value={new Date(product.created_at).toLocaleString()} />
                  <Detail label={t('Updated')} value={new Date(product.updated_at).toLocaleString()} />
                  {product.approved_at ? (
                    <Detail label={t('Approved')} value={new Date(product.approved_at).toLocaleString()} />
                  ) : null}
                  {product.rejected_at ? (
                    <Detail label={t('Rejected')} value={new Date(product.rejected_at).toLocaleString()} />
                  ) : null}
                </dl>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('Close')}
          </Button>
          <Button onClick={() => onEdit(product)}>
            {t('Edit Product')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}