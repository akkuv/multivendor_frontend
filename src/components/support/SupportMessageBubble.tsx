import { Bot, Check, CheckCheck, LifeBuoy } from 'lucide-react'
import { isStaffSenderRole, type SupportMessage } from '@/types'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'

interface SupportMessageBubbleProps {
  message: SupportMessage
  /** True when the message belongs to the signed-in user. */
  isOwn: boolean
  /** Admin view: staff replies read as the admin's own, so mirror the layout. */
  mirrorForAdmin?: boolean
}

function formatTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function SupportMessageBubble({
  message,
  isOwn,
  mirrorForAdmin = false,
}: SupportMessageBubbleProps) {
  const { t } = useTranslation()
  // Staff means the admin team or the assistant, whichever side of the
  // marketplace is reading — a customer message is not staff.
  const fromStaff = isStaffSenderRole(message.sender_role)
  // Requester: own messages right, everyone else left. Admin: the mirror of that,
  // so the admin's own replies sit on the right like in any other inbox.
  const onRight = mirrorForAdmin ? fromStaff : isOwn

  const isBot = message.is_bot

  return (
    <div className={cn('flex w-full gap-2.5', onRight ? 'justify-end' : 'justify-start')}>
      {!onRight && (
        <div className="mt-1 shrink-0">
          {isBot ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <Bot className="h-4 w-4" aria-hidden="true" />
            </div>
          ) : (
            <Avatar className="h-8 w-8">
              {message.sender?.avatar ? (
                <AvatarImage src={message.sender.avatar} alt={message.sender_name} />
              ) : null}
              <AvatarFallback className="text-[11px]">
                {message.sender_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      <div className={cn('flex max-w-[78%] flex-col gap-1', onRight && 'items-end')}>
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap',
            isBot
              ? 'border border-slate-200 bg-slate-50 text-slate-800'
              : onRight
                ? 'bg-primary text-primary-foreground'
                : 'border border-slate-200 bg-white text-slate-900',
          )}
        >
          {message.image_url && (
            <img
              src={message.image_url}
              alt={t('Attached image')}
              className="mb-1.5 max-h-64 w-full max-w-[280px] rounded-lg object-cover"
              loading="lazy"
            />
          )}
          {message.body}
        </div>

        <div className="flex items-center gap-2 px-1 text-[11px] text-slate-500">
          {isBot && (
            <Badge variant="secondary" className="gap-1 py-0 text-[10px]">
              <LifeBuoy className="h-3 w-3" aria-hidden="true" />
              {t('Auto')}
            </Badge>
          )}
          <span className="font-medium">{message.sender_name}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={message.created_at}>{formatTime(message.created_at)}</time>
          {onRight && (
            <span className="inline-flex items-center gap-0.5" title={message.read_at ? 'Read' : 'Sent'}>
              {message.read_at ? (
                <CheckCheck className="h-3 w-3 text-sky-500" aria-hidden="true" />
              ) : (
                <Check className="h-3 w-3" aria-hidden="true" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default SupportMessageBubble