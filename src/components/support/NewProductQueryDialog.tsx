import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, Search, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useCreateAdminProductQuery, useCreateProductQuery, useCreateVendorProductQuery } from '@/hooks/useSupport'
import { toast } from '@/lib/toast'
import { assetUrl } from '@/lib/assets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getAdminProducts } from '@/services/admin'
import { getProducts } from '@/services/product'
import { getVendorProducts } from '@/services/vendor'
import { uploadImage } from '@/services/uploads'
import type { Product } from '@/types'

/** Which panel the dialog is running in decides the product pool and creator. */
export type ProductQueryRole = 'admin' | 'vendor' | 'customer'

interface NewProductQueryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: ProductQueryRole
  /** Called with the fresh thread's id once the query lands. */
  onCreated: (conversationId: number) => void
}

/**
 * The "New Query" entry point on the product-query pages: pick any product with
 * a search box, write the question and optionally attach an image, then open a
 * brand-new product query thread.
 *
 * Customers raise a query about any product; vendors about their own products;
 * admins about any product. Each panel's normal creator endpoint is used, so
 * the thread lands in the same inboxes as always.
 */
export function NewProductQueryDialog({ open, onOpenChange, role, onCreated }: NewProductQueryDialogProps) {
  const { t } = useTranslation()

  const customerCreate = useCreateProductQuery()
  const vendorCreate = useCreateVendorProductQuery()
  const adminCreate = useCreateAdminProductQuery()
  const mutation = role === 'customer' ? customerCreate : role === 'vendor' ? vendorCreate : adminCreate

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)
  const [body, setBody] = useState('')
  const [uploading, setUploading] = useState(false)
  const [pendingImage, setPendingImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Wait for the admin to stop typing before hitting the search endpoint.
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [query])

  const resultsQuery = useQuery({
    queryKey: ['support', 'product-queries', 'picker', role, debouncedQuery],
    queryFn: () => {
      if (role === 'vendor') return getVendorProducts({ search: debouncedQuery, per_page: 8 })
      if (role === 'admin') return getAdminProducts({ search: debouncedQuery, per_page: 8 })
      return getProducts({ search: debouncedQuery, per_page: 8 })
    },
    enabled: open && debouncedQuery.length > 0,
  })

  const results = resultsQuery.data?.data ?? []
  const searching = resultsQuery.isFetching

  const reset = () => {
    setQuery('')
    setDebouncedQuery('')
    setSelected(null)
    setBody('')
    clearImage()
  }

  useEffect(() => {
    if (!open) reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const busy = mutation.isPending || uploading
  const canSubmit = selected !== null && body.trim().length > 0 && !busy

  const clearImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPendingImage(null)
    setPreviewUrl(null)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setPendingImage(file)
    setPreviewUrl(URL.createObjectURL(file))

    // Allow picking the same file again after it was removed.
    event.target.value = ''
  }

  const handleSubmit = async () => {
    if (selected === null) return

    try {
      let imageUrl: string | undefined
      if (pendingImage) {
        setUploading(true)
        try {
          imageUrl = await uploadImage(pendingImage)
        } finally {
          setUploading(false)
        }
      }

      const result = await mutation.mutateAsync({
        product_id: selected.id,
        body: body.trim(),
        ...(imageUrl ? { image_url: imageUrl } : {}),
      })

      toast({ title: t('Product query created successfully.'), variant: 'success' })
      onCreated(result.conversation.id)
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : t('Could not create the product query.')
      toast({
        title: t('Could not create the product query.'),
        description: message,
        variant: 'destructive',
      })
    }
  }

  const pickProduct = (product: Product) => {
    setSelected(product)
    setQuery('')
    setDebouncedQuery('')
  }

  const description =
    role === 'vendor'
      ? t('Your question goes to the marketplace team in a private thread.')
      : role === 'admin'
        ? t('Your question goes to the product\u2019s vendor in a private thread.')
        : t('Your question goes to the seller and the marketplace team in a private thread.')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('New Product Query')}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="new-product-query-search">{t('Product')}</Label>

          {selected === null ? (
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="new-product-query-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => window.setTimeout(() => setFocused(false), 150)}
                placeholder={t('Search products\u2026')}
                autoComplete="off"
                className="pl-8"
              />

              {focused && debouncedQuery.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                  {searching ? (
                    <div className="flex items-center justify-center gap-2 px-3 py-4 text-xs text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      {t('Loading\u2026')}
                    </div>
                  ) : results.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-slate-500">{t('No products found.')}</p>
                  ) : (
                    <ul>
                      {results.map((product) => (
                        <li key={product.id}>
                          <button
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault()
                              pickProduct(product)
                            }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50"
                          >
                            {product.images?.[0] ? (
                              <img
                                src={assetUrl(product.images[0])}
                                alt=""
                                className="h-9 w-9 shrink-0 rounded-md border border-slate-200 object-cover"
                              />
                            ) : (
                              <span className="h-9 w-9 shrink-0 rounded-md border border-slate-200 bg-slate-100" />
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-slate-800">
                                {product.name}
                              </span>
                              <span className="block truncate text-xs text-slate-500">
                                {product.vendor?.store_name ?? t('Store')}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {selected.images?.[0] ? (
                <img
                  src={assetUrl(selected.images[0])}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-md border border-slate-200 object-cover"
                />
              ) : (
                <span className="h-10 w-10 shrink-0 rounded-md border border-slate-200 bg-slate-100" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{selected.name}</p>
                <p className="truncate text-xs text-slate-500">
                  {selected.vendor?.store_name ?? t('Store')}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelected(null)}
                disabled={busy}
                className="h-7 px-2 text-xs text-slate-500 hover:text-red-600"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" /> {t('Change')}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="new-product-query-body">{t('Your question')}</Label>
          <Textarea
            id="new-product-query-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={4000}
            rows={4}
            placeholder={t('e.g. Do you ship internationally?\u2026')}
          />
        </div>

        {pendingImage && previewUrl && (
          <div className="flex items-center gap-2.5">
            <img
              src={previewUrl}
              alt={t('Attached image')}
              className="h-14 w-14 rounded-lg border border-slate-200 object-cover"
            />
            <div className="flex min-w-0 flex-col gap-1">
              <p className="max-w-[260px] truncate text-xs text-slate-600">{pendingImage.name}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearImage}
                disabled={busy}
                className="h-6 justify-start px-1.5 text-xs text-slate-500 hover:text-red-600"
              >
                <X className="h-3 w-3" aria-hidden="true" /> {t('Remove image')}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              aria-hidden="true"
              tabIndex={-1}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              aria-label={t('Attach an image')}
              title={t('Attach an image')}
            >
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('Cancel')}
            </Button>
            <Button type="button" onClick={() => void handleSubmit()} disabled={!canSubmit}>
              {busy ? t('Sending\u2026') : t('Send question')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default NewProductQueryDialog