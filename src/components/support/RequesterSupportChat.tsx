import { useEffect, useRef, useState } from 'react'
import { Bot, LifeBuoy, MessageSquareText, Sparkles } from 'lucide-react'
import type { SupportConversation, SupportMessage } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import SupportComposer from '@/components/support/SupportComposer'
import SupportMessageBubble from '@/components/support/SupportMessageBubble'
import SupportConnectionPill from '@/components/support/SupportConnectionPill'
import RecentOrdersCard from '@/components/support/RecentOrdersCard'
import { useTranslation } from 'react-i18next'

interface RequesterSupportChatProps {
  conversation: SupportConversation | null
  messages: SupportMessage[]
  suggestions: string[]
  connectionStatus: 'connecting' | 'live' | 'offline'
  isLoading: boolean
  isError: boolean
  isSending: boolean
  /** Who the signed-in user is, so their own messages can be aligned right. */
  currentUserId: number | undefined
  /**
   * Send a message. `askBot` is the state of the "ask the assistant" toggle,
   * which the panel owns but the page turns into an API flag — so unchecking it
   * reaches a human instead of the assistant.
   */
  onSend: (body: string, askBot: boolean) => Promise<void>
  onRetry: () => void
  /**
   * Called when the thread is opened with unread messages. Deliberately fired
   * by the page rather than here, so opening the chat cannot race the mutation
   * the page already owns.
   */
  onMarkRead: () => void
  /** True while the open thread has messages the requester has not seen. */
  hasUnread: boolean
  /** Name shown in the thread header, e.g. the store name for a vendor. */
  headerTitle: string
  composerPlaceholder: string
  /** Explains which of the reader's own live figures the assistant can see. */
  assistantNote: string
  /**
   * The requester's recent orders, shown as context above the first message of
   * the customer support chat. Omit (or pass null) for chats without order
   * context, like the vendor support chat.
   */
  recentOrders?: NonNullable<SupportConversation['recent_orders']> | null
  /** Resolves an order to its detail page; renders the number as plain text when null. */
  recentOrdersHref?: (order: NonNullable<SupportConversation['recent_orders']>[number]) => string | null
}

/**
 * The support chat a requester (vendor or customer) sees.
 *
 * Both requester chats are the same conversation with the same assistant and the
 * same admin team behind it, so they share this panel and differ only in the
 * copy. Sharing it means a change to the transcript, the composer or the
 * assistant toggle cannot land in one and miss the other.
 */
export function RequesterSupportChat({
  conversation,
  messages,
  suggestions,
  connectionStatus,
  isLoading,
  isError,
  isSending,
  currentUserId,
  onSend,
  onRetry,
  onMarkRead,
  hasUnread,
  headerTitle,
  composerPlaceholder,
  assistantNote,
  recentOrders,
  recentOrdersHref,
}: RequesterSupportChatProps) {
  const { t } = useTranslation()
  const [askBot, setAskBot] = useState(true)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Pin to the newest message whenever the transcript changes.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, isSending])

  // Opening the thread counts as reading it, but only when it actually has
  // something unread — otherwise every render would re-post the same request.
  const conversationId = conversation?.id
  useEffect(() => {
    if (hasUnread) {
      onMarkRead()
    }
    // Keyed on the conversation only: an arriving message must not mark itself
    // read before the reader has seen it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  if (isError) {
    return (
      <div className="rounded-2xl border bg-background p-8 text-center">
        <p className="font-semibold">{t('Could not load the support chat.')}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          {t('Try again')}
        </Button>
      </div>
    )
  }

  return (
    <>
      <Card className="overflow-hidden py-0">
        <div className="flex items-center justify-between gap-3 border-b bg-slate-50/60 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{headerTitle}</p>
            <p className="truncate text-xs text-muted-foreground">
              {conversation?.is_waiting_on_admin
                ? 'Waiting for an admin to reply'
                : 'Support replies here — you will see it straight away'}
            </p>
          </div>
          <SupportConnectionPill status={connectionStatus} />
        </div>

        <div
          ref={scrollRef}
          className="h-[52vh] min-h-[360px] space-y-3 overflow-y-auto px-4 py-4"
        >
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-3/5" />
              <Skeleton className="ml-auto h-12 w-2/5" />
              <Skeleton className="h-20 w-4/5" />
            </div>
          ) : (
            <>
              {recentOrders && recentOrders.length > 0 && (
                <RecentOrdersCard orders={recentOrders} orderHref={recentOrdersHref} />
              )}

              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <MessageSquareText className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium">{t('No messages yet')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('Pick a question below, or describe your problem in your own words.')}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <SupportMessageBubble
                      key={message.id}
                      message={message}
                      isOwn={message.sender_user_id === currentUserId}
                    />
                  ))}

                  {isSending && (
                    <div className="flex justify-start" aria-live="polite">
                      <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-3">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:300ms]" />
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {messages.length === 0 && suggestions.length > 0 && (
          <div className="border-t px-4 py-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {t('Try one of these')}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void onSend(suggestion, askBot)}
                  disabled={isSending}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <SupportComposer
          onSend={(body) => onSend(body, askBot)}
          isSending={isSending}
          askBot={askBot}
          onAskBotChange={setAskBot}
          placeholder={composerPlaceholder}
        />
      </Card>

      <Card>
        <CardContent className="flex items-start gap-3 p-4">
          <Bot className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">{assistantNote}</p>
        </CardContent>
      </Card>
    </>
  )
}

/**
 * Heading for a requester's support page, so it reads the same whether a vendor
 * or a customer opens it.
 */
export function SupportPageHeading({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="flex items-center gap-2 text-2xl font-bold">
      <LifeBuoy className="h-6 w-6" /> {children}
    </h1>
  )
}

export default RequesterSupportChat
