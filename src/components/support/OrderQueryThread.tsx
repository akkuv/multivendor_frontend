import { useEffect, useRef } from 'react'
import { MessageSquareText } from 'lucide-react'
import type { SupportConversation, SupportMessage } from '@/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import SupportComposer from '@/components/support/SupportComposer'
import SupportConnectionPill from '@/components/support/SupportConnectionPill'
import SupportMessageBubble from '@/components/support/SupportMessageBubble'
import OrderContextCard from '@/components/support/OrderContextCard'
import { useTranslation } from 'react-i18next'

interface OrderQueryThreadProps {
  conversation: SupportConversation | null
  messages: SupportMessage[]
  connectionStatus: 'connecting' | 'live' | 'offline'
  isLoading: boolean
  isError: boolean
  isSending: boolean
  /** Who the signed-in user is, so the vendor's own replies align right. */
  currentUserId: number | undefined
  onReply: (body: string, imageUrl?: string) => Promise<void>
  onRetry: () => void
  /** Let the composer attach and send an image on the query threads. */
  allowImages?: boolean
  /** The order/vendor context shown in the thread header. */
  header: React.ReactNode
  /** Optional extra header controls, e.g. the admin close/reopen buttons. */
  actions?: React.ReactNode
  composerPlaceholder: string
  emptyTitle: string
  emptyDescription: string
  /** Admin view: the admin's own replies sit right, mirrored like other inboxes. */
  mirrorForAdmin?: boolean
  /** Copy for the closed-thread banner; defaults to the order-query wording. */
  closedNote?: string
  /** Copy for the load-error state; defaults to the order-query wording. */
  errorTitle?: string
  /** Where the order-details card's "view full order" link goes; plain text when absent. */
  orderHref?: string | null
}

/**
 * The conversation pane of an order query: an admin-initiated, order-linked
 * thread with the vendor. Shared by the admin inbox and the vendor's order
 * queries page — both sides read the same transcript, so both render it the
 * same way and only the header and message alignment differ.
 */
export function OrderQueryThread({
  conversation,
  messages,
  connectionStatus,
  isLoading,
  isError,
  isSending,
  currentUserId,
  onReply,
  onRetry,
  allowImages = false,
  header,
  actions,
  composerPlaceholder,
  emptyTitle,
  emptyDescription,
  mirrorForAdmin = false,
  closedNote,
  errorTitle,
  orderHref,
}: OrderQueryThreadProps) {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Pin to the newest message whenever the transcript changes.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, isSending])

  if (conversation === null) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 p-8 text-center">
        <MessageSquareText className="h-8 w-8 text-slate-300" aria-hidden="true" />
        <p className="font-medium">{t(emptyTitle)}</p>
        <p className="max-w-xs text-sm text-muted-foreground">{t(emptyDescription)}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50/60 px-4 py-3">
        <div className="min-w-0">{header}</div>

        <div className="flex items-center gap-2">
          <SupportConnectionPill status={connectionStatus} />
          {actions}
        </div>
      </div>

      {conversation.is_closed && (
        <div className="border-b bg-amber-50 px-4 py-2 text-xs text-amber-800">
          {closedNote ?? t('This conversation is closed. The vendor can still write, which reopens it automatically.')}
        </div>
      )}

      <div ref={scrollRef} className="h-[52vh] min-h-[360px] space-y-3 overflow-y-auto px-4 py-4">
        {conversation.order && (
          <OrderContextCard order={conversation.order} orderHref={orderHref} />
        )}

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-3/5" />
            <Skeleton className="ml-auto h-12 w-2/5" />
          </div>
        ) : isError ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {errorTitle ?? t('Could not load this order query.')}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
              {t('Try again')}
            </Button>
          </div>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {t('No messages yet in this conversation.')}
          </p>
        ) : (
          messages.map((message) => (
            <SupportMessageBubble
              key={message.id}
              message={message}
              isOwn={mirrorForAdmin ? message.sender_role === 'SUPER_ADMIN' : message.sender_user_id === currentUserId}
              mirrorForAdmin={mirrorForAdmin}
            />
          ))
        )}
      </div>

      <SupportComposer
        onSend={onReply}
        isSending={isSending}
        allowImages={allowImages}
        placeholder={composerPlaceholder}
      />
    </div>
  )
}

export default OrderQueryThread