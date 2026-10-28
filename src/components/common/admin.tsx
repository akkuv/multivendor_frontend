import * as React from 'react'
import { assetUrl } from '@/lib/assets'
import { ChevronLeft, ChevronRight, ExternalLink, UploadCloud } from 'lucide-react'
import type { Paginated } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { uploadImage, uploadVideo } from '@/services/uploads'
import { useTranslation } from 'react-i18next'

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? 'success' : 'secondary'}>{active ? 'Active' : 'Inactive'}</Badge>
  )
}

export function PaginationFooter({
  data,
  onPageChange,
}: {
  data: Paginated<unknown> | undefined
  onPageChange: (page: number) => void
}) {
  const { t } = useTranslation()
  if (!data?.last_page || data.last_page <= 1) return null
  return (
    <div className="flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
      <span>
        Page {data.current_page} of {data.last_page} ({data.total} total)
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={data.current_page <= 1}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
            onPageChange(data.current_page - 1)
          }}
        >
          <ChevronLeft className="h-4 w-4" />
          {t('Previous')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={data.current_page >= data.last_page}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
            onPageChange(data.current_page + 1)
          }}
        >
          {t('Next')}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  loading,
  error,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  loading?: boolean
  error?: string | null
}) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t('Cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : confirmLabel ?? 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function FormField({
  label,
  children,
  error,
  icon,
  hint,
}: {
  label: string
  children: React.ReactNode
  error?: string
  icon?: React.ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium leading-none">
        {icon ? (
          <span className="text-muted-foreground [&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>
        ) : null}
        {label}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

type ImageFieldProps = {
  label?: string
  name?: string
  value?: string
  initialValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  accept?: string
}

export function ImageField({
  label,
  name,
  value,
  initialValue,
  onChange,
  placeholder,
  accept,
}: ImageFieldProps) {
  const { t } = useTranslation()
  const [internal, setInternal] = React.useState<string>(value ?? initialValue ?? '')
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState('')
  const fileRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (value === undefined) setInternal(initialValue ?? '')
  }, [initialValue, value])

  const current = value !== undefined ? value : internal

  const commit = (next: string) => {
    if (value === undefined) setInternal(next)
    onChange?.(next)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const url = await uploadImage(file)
      commit(url)
    } catch (err) {
      setError((err as { message?: string }).message ?? 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const input = (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          name={name}
          value={current}
          onChange={(e) => {
            setError('')
            commit(e.target.value)
          }}
          placeholder={placeholder ?? 'https://... or upload a file'}
        />
        <input
          ref={fileRef}
          type="file"
          accept={accept ?? 'image/*'}
          className="hidden"
          onChange={handleFile}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <UploadCloud className="mr-1.5 h-4 w-4" />
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
      </div>
      {current.trim() ? (
        <div className="flex flex-wrap items-center gap-3">
          <img
            src={assetUrl(current)}
            alt=""
            className="h-16 w-16 rounded-lg border object-cover"
            onError={(e) => {
              e.currentTarget.style.opacity = '0.25'
            }}
          />
          {label === undefined && (
            <span className="text-xs text-muted-foreground">{t('Preview')}</span>
          )}
        </div>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {label === undefined && <p className="text-xs text-muted-foreground">{t('Paste an image URL or upload a file.')}</p>}
    </div>
  )

  return label ? <FormField label={label}>{input}</FormField> : input
}

// Mirrors the backend UploadController / server upload_max_filesize cap.
const MAX_VIDEO_MB = 50
const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024

type VideoFieldProps = {
  label?: string
  name?: string
  value?: string
  initialValue?: string
  onChange?: (value: string) => void
  placeholder?: string
}

export function VideoField({
  label,
  name,
  value,
  initialValue,
  onChange,
  placeholder,
}: VideoFieldProps) {
  const { t } = useTranslation()
  const [internal, setInternal] = React.useState<string>(value ?? initialValue ?? '')
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState('')
  const fileRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (value === undefined) setInternal(initialValue ?? '')
  }, [initialValue, value])

  const current = value !== undefined ? value : internal

  const commit = (next: string) => {
    if (value === undefined) setInternal(next)
    onChange?.(next)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_VIDEO_BYTES) {
      setError(t('Video is too large. Maximum size is {{size}} MB.', { size: MAX_VIDEO_MB }))
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    setUploading(true)
    setError('')
    try {
      const url = await uploadVideo(file)
      commit(url)
    } catch (err) {
      setError((err as { message?: string }).message ?? 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const input = (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          name={name}
          value={current}
          onChange={(e) => {
            setError('')
            commit(e.target.value)
          }}
          placeholder={placeholder ?? 'https://... or upload a file'}
        />
        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          <UploadCloud className="mr-1.5 h-4 w-4" />
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
      </div>
      {current.trim() ? (
        <video
          src={assetUrl(current)}
          controls
          className="max-h-48 w-full rounded-lg border bg-black object-contain"
        />
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {label === undefined && (
        <p className="text-xs text-muted-foreground">
          {t('Paste a video URL or upload an MP4, MOV or WebM file (max {{size}} MB).', {
            size: MAX_VIDEO_MB,
          })}
        </p>
      )}
    </div>
  )

  return label ? <FormField label={label}>{input}</FormField> : input
}

export function ApiError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation()
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : 'Something went wrong. Please try again.'
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-sm text-destructive">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t('Retry')}
        </Button>
      ) : null}
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center text-sm text-muted-foreground">{message}</div>
  )
}

export function LiveStorePreview({ slug, note }: { slug: string; note: string }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{note}</p>
        <Button asChild size="sm" variant="outline">
          <a href={`/category/${slug}`} target="_blank" rel="noreferrer">
            <ExternalLink className="mr-1.5 h-4 w-4" /> {t('Full screen')}
          </a>
        </Button>
      </div>
      <div className="overflow-hidden rounded-2xl border">
        <iframe
          src={`/category/${slug}`}
          title={`Preview of /category/${slug}`}
          className="h-[70vh] w-full bg-background"
        />
      </div>
    </div>
  )
}