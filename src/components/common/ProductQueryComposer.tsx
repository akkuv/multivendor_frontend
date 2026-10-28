import { useRef, useState } from 'react'
import { ImagePlus, MessageSquareText, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useCreateProductQuery } from '@/hooks/useSupport'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { uploadImage } from '@/services/uploads'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTranslation } from 'react-i18next'

/**
 * The entry point for a private product query, shown on the product page next
 * to the public Q&A. Signed-in customers get a button that opens a composer;
 * guests get a sign-in link. Unlike the public Q&A, the answer comes in a
 * private thread with the selling vendor and the marketplace team.
 */
export function ProductQueryComposer({ productId, productName }: { productId: number; productName: string }) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const createQuery = useCreateProductQuery()

  const [open, setOpen] = useState(false)
  const [body, setBody] = useState('')
  const [uploading, setUploading] = useState(false)
  const [pendingImage, setPendingImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const busy = createQuery.isPending || uploading
  const canSubmit = body.trim().length > 0 && !busy

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

      const result = await createQuery.mutateAsync({
        product_id: productId,
        body: body.trim(),
        ...(imageUrl ? { image_url: imageUrl } : {}),
      })

      toast({ title: t('Product query created successfully.'), variant: 'success' })
      setOpen(false)
      setBody('')
      clearImage()
      navigate(`/account/product-queries/${result.conversation.id}`)
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

  if (!user) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('Want a private answer about this product?')}{' '}
        <Link to="/login" className="font-medium text-[#a07a28] hover:underline">
          {t('Sign in to ask')}
        </Link>
      </p>
    )
  }

  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <MessageSquareText className="mr-1.5 h-4 w-4" /> {t('Ask a private question')}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) {
            setBody('')
            clearImage()
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('Ask about {{product}}', { product: productName })}</DialogTitle>
            <DialogDescription>
              {t('Your question goes to the seller and the marketplace team in a private thread.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="product-query-body">{t('Your question')}</Label>
            <Textarea
              id="product-query-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={4000}
              rows={4}
              placeholder={t('e.g. Do you ship internationally?…')}
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
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button type="button" onClick={() => void handleSubmit()} disabled={!canSubmit}>
                {busy ? t('Sending…') : t('Send question')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProductQueryComposer