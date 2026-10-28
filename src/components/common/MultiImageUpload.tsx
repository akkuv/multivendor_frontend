import * as React from 'react'
import { AlertCircle, Loader2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadImage } from '@/services/uploads'
import { useTranslation } from 'react-i18next'

interface BulkUploadState {
  /** How many files the vendor picked in the current/last batch. */
  total: number
  /** Files still in flight. */
  pending: number
  /** Files that landed successfully in this batch. */
  succeeded: number
}

interface FailedUpload {
  name: string
  message: string
}

/**
 * Pick several images at once and upload them in parallel.
 *
 * Each file is uploaded on its own against the existing single-image endpoint
 * (`POST /uploads/images`), so no server contract changes and one rejected file
 * cannot block the others. `onUploaded` fires once per successful file as soon
 * as it lands, letting the caller append rows to whatever list it owns.
 *
 * Concurrency is capped so a vendor dropping 30 photos does not open 30 sockets.
 */
const MAX_CONCURRENT_UPLOADS = 4

export function MultiImageUpload({
  onUploaded,
  label,
  hint,
  disabled,
}: {
  /** Called with the stored URL for each file that uploads successfully. */
  onUploaded: (url: string) => void
  /** Button text; defaults to "Upload multiple". */
  label?: string
  /** Optional line shown under the button. */
  hint?: string
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [state, setState] = React.useState<BulkUploadState>({ total: 0, pending: 0, succeeded: 0 })
  const [failures, setFailures] = React.useState<FailedUpload[]>([])

  const reset = () => {
    setState({ total: 0, pending: 0, succeeded: 0 })
    setFailures([])
  }

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    // Reset the input first so picking the same file twice still fires a change.
    if (inputRef.current) inputRef.current.value = ''
    if (files.length === 0) return

    reset()
    setState({ total: files.length, pending: files.length, succeeded: 0 })

    const failed: FailedUpload[] = []
    let nextIndex = 0

    // Small fixed worker pool: keeps big batches from saturating the connection
    // pool while still overlapping the slow part (network round-trips).
    const worker = async () => {
      while (nextIndex < files.length) {
        const file = files[nextIndex]
        nextIndex += 1
        try {
          const url = await uploadImage(file)
          setState((prev) => ({
            ...prev,
            pending: prev.pending - 1,
            succeeded: prev.succeeded + 1,
          }))
          onUploaded(url)
        } catch (err) {
          failed.push({
            name: file.name,
            message: (err as { message?: string }).message ?? t('Upload failed. Please try again.'),
          })
          setFailures([...failed])
          setState((prev) => ({ ...prev, pending: prev.pending - 1 }))
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(MAX_CONCURRENT_UPLOADS, files.length) }, () => worker()),
    )
  }

  const busy = state.pending > 0

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="mr-1.5 h-4 w-4" />
          )}
          {busy
            ? t('Uploading {{done}}/{{total}}…', { done: state.succeeded, total: state.total })
            : (label ?? t('Upload multiple'))}
        </Button>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>

      {failures.length === 0 && state.total > 0 && !busy ? (
        <p className="text-xs text-muted-foreground">
          {t('Added {{count}} image.', { count: state.succeeded })}
        </p>
      ) : null}

      {failures.length > 0 ? (
        <ul className="space-y-1">
          {failures.map((failure) => (
            <li key={failure.name} className="flex items-start gap-1.5 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                <span className="font-medium">{failure.name}</span>: {failure.message}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
