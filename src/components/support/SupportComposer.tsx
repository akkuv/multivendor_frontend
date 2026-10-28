import { useEffect, useRef, useState } from 'react'
import { CornerDownLeft, ImagePlus, Loader2, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { uploadImage } from '@/services/uploads'

interface SupportComposerProps {
  onSend: (body: string, imageUrl?: string) => Promise<void> | void
  placeholder?: string
  disabled?: boolean
  isSending?: boolean
  /** Show the image attach button on the query threads. */
  allowImages?: boolean
  /** "Ask the assistant" toggle, vendor side only. */
  askBot?: boolean
  onAskBotChange?: (ask: boolean) => void
}

const MAX_LENGTH = 4000

/**
 * Message input for the support chat.
 *
 * Enter sends, Shift+Enter starts a new line — the convention every other chat
 * UI uses, and the only thing that makes typing multi-line questions bearable.
 */
export function SupportComposer({
  onSend,
  placeholder = 'Type your message…',
  disabled = false,
  isSending = false,
  allowImages = false,
  askBot,
  onAskBotChange,
}: SupportComposerProps) {
  const { t } = useTranslation()
  const [body, setBody] = useState('')
  const [pendingImage, setPendingImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Grow with the content instead of scrolling inside a fixed box.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return

    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [body])

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
    setSubmitError(null)

    // Allow picking the same file again after it was removed.
    event.target.value = ''
  }

  const submit = async () => {
    const trimmed = body.trim()

    if (!trimmed || disabled || isSending || submitting) return

    // Empty the whole draft the instant send is pressed. A sent message must
    // never linger in the box, and a failed send must not look like one that
    // went out — the failure is reported under the input instead of by leaving
    // the draft in place, so "message sent but still in the chat box" cannot
    // happen.
    const image = pendingImage
    setBody('')
    clearImage()
    setSubmitError(null)
    setSubmitting(true)

    try {
      let imageUrl: string | undefined
      if (image) {
        imageUrl = await uploadImage(image)
      }

      await onSend(trimmed, imageUrl)
    } catch {
      setSubmitError(
        image
          ? t('Could not upload the image. Please try again.')
          : t('Message could not be sent. Please try again.'),
      )
    } finally {
      setSubmitting(false)
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submit()
    }
  }

  const busy = disabled || isSending || submitting
  const canSend = body.trim().length > 0 && !busy

  return (
    <div className="border-t border-slate-200 bg-white p-3">
      {onAskBotChange && (
        <label className="mb-2 flex cursor-pointer items-center gap-2 px-1 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={askBot}
            onChange={(event) => onAskBotChange(event.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300"
          />
          {t('Let the assistant answer first')}
        </label>
      )}

      {submitError && (
        <p className="mb-2 px-1 text-xs text-red-600" role="alert">
          {submitError}
        </p>
      )}

      {pendingImage && previewUrl && (
        <div className="mb-2 flex items-center gap-2.5 px-1">
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
              disabled={submitting}
              className="h-6 justify-start px-1.5 text-xs text-slate-500 hover:text-red-600"
            >
              <X className="h-3 w-3" aria-hidden="true" /> {t('Remove image')}
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        {allowImages && (
          <>
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
              className="shrink-0"
            >
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
            </Button>
          </>
        )}

        <Textarea
          ref={textareaRef}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={MAX_LENGTH}
          rows={1}
          disabled={busy}
          placeholder={placeholder}
          className="max-h-40 min-h-[42px] resize-none"
          aria-label={t('Support message')}
        />

        <Button
          type="button"
          onClick={() => void submit()}
          disabled={!canSend}
          size="icon"
          aria-label={t('Send message')}
          className={cn('shrink-0', !canSend && 'opacity-50')}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      <p className="mt-1.5 flex items-center gap-1 px-1 text-[11px] text-slate-400">
        <CornerDownLeft className="h-3 w-3" aria-hidden="true" />
        {t('Enter to send · Shift + Enter for a new line')}
      </p>
    </div>
  )
}

export default SupportComposer