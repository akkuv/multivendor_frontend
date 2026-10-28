import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Archive,
  ArchiveRestore,
  LifeBuoy,
  MessageSquareText,
  Search,
  Sparkles,
  Store,
  User as UserIcon,
} from 'lucide-react'
import type { TFunction } from 'i18next'
import { useMarkThreadReadOnOpen, useSupportConversation, useSupportInbox } from '@/hooks/useSupport'
import { assetUrl } from '@/lib/assets'
import { toast } from '@/lib/toast'
import type { SupportInboxFilter, SupportInboxKind } from '@/services/support'
import type { SupportConversation } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import SupportComposer from '@/components/support/SupportComposer'
import SupportConnectionPill from '@/components/support/SupportConnectionPill'
import SupportMessageBubble from '@/components/support/SupportMessageBubble'
import RecentOrdersCard from '@/components/support/RecentOrdersCard'
import { useTranslation } from 'react-i18next'

const FILTERS: { value: SupportInboxFilter; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'awaiting', label: 'Waiting on you' },
  { value: 'closed', label: 'Closed' },
  { value: 'all', label: 'All' },
]

function relativeTime(value: string | null, t: TFunction): string {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return t('just now')
  if (seconds < 3600) return t('{{minutes}}m ago', { minutes: Math.floor(seconds / 60) })
  if (seconds < 86_400) return t('{{hours}}h ago', { hours: Math.floor(seconds / 3600) })

  return date.toLocaleDateString()
}

/**
 * The name, avatar and email to show for whoever opened a conversation.
 *
 * A conversation is either a vendor (identified by their store) or a customer
 * (identified by their account), so the inbox reads `requester_type` rather than
 * assuming the vendor shape is the only one.
 */
function requesterSummary(conversation: SupportConversation) {
  if (conversation.requester_type === 'CUSTOMER') {
    const customer = conversation.customer

    return {
      name: customer?.name ?? `Customer #${conversation.customer_user_id}`,
      email: customer?.email ?? '',
      avatar: customer?.avatar ? assetUrl(customer.avatar) : null,
      fallbackIcon: <UserIcon className="h-4 w-4" aria-hidden="true" />,
    }
  }

  const store = conversation.vendor

  return {
    name: store?.store_name ?? `Vendor #${conversation.vendor_id}`,
    email: conversation.vendor_user?.email ?? '',
    avatar: store?.logo ? assetUrl(store.logo) : null,
    fallbackIcon: <Store className="h-4 w-4" aria-hidden="true" />,
  }
}

function ConversationRow({
  conversation,
  isActive,
  onSelect,
}: {
  conversation: SupportConversation
  isActive: boolean
  onSelect: () => void
}) {
  const { t } = useTranslation()
  const unread = conversation.unread_for_admin ?? 0
  const preview = conversation.latest_message
  const requester = requesterSummary(conversation)

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={isActive}
      className={[
        'w-full border-b px-3 py-3 text-left transition-colors',
        isActive ? 'bg-slate-100' : 'hover:bg-slate-50',
      ].join(' ')}
    >
      <div className="flex items-start gap-2.5">
        <Avatar className="h-9 w-9 shrink-0">
          {requester.avatar ? (
            <AvatarImage src={requester.avatar} alt={requester.name} />
          ) : null}
          <AvatarFallback>{requester.fallbackIcon}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">{requester.name}</p>
            <span className="shrink-0 text-[11px] text-slate-400">
              {relativeTime(conversation.last_message_at, t)}
            </span>
          </div>

          <p className="mt-0.5 truncate text-xs text-slate-500">
            {preview
              ? `${preview.is_bot ? `${t('Assistant')}: ` : ''}${preview.body}`
              : t('No messages yet')}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {unread > 0 && (
              <Badge variant="default" className="px-1.5 py-0 text-[10px]">
                {t('{{count}} new', { count: unread })}
              </Badge>
            )}
            {conversation.is_waiting_on_admin && !conversation.is_closed && (
              <Badge variant="warning" className="px-1.5 py-0 text-[10px]">
                {t('Waiting on you')}
              </Badge>
            )}
            {conversation.is_closed && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                {t('Closed')}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

interface AdminSupportInboxProps {
  kind: SupportInboxKind
  heading: string
  description: string
  /** Noun for the requester, e.g. "vendor" — used in prompts and empty states. */
  requesterNoun: string
  searchPlaceholder: string
}

/**
 * The admin side of support chat, for one requester type.
 *
 * The vendor and customer inboxes are the same triage problem — one thread per
 * requester, newest first, waiting threads first — so they share this component
 * and differ only in which endpoint they read and how they label a requester.
 * One implementation means a fix to reading, replying or closing lands in both.
 */
export function AdminSupportInbox({
  kind,
  heading,
  description,
  requesterNoun,
  searchPlaceholder,
}: AdminSupportInboxProps) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<SupportInboxFilter>('open')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const inbox = useSupportInbox(kind, filter)
  // Memoised so the derived selection and search below do not re-run on every
  // render of the inbox.
  const conversations = useMemo(() => inbox.data?.data ?? [], [inbox.data])
  const counts = inbox.data?.counts

  // The active thread is derived, not stored: an explicit selection wins,
  // otherwise land on the thread most in need of an answer so opening the inbox
  // never shows an already-resolved conversation.
  const activeId = useMemo(() => {
    if (selectedId !== null) return selectedId

    const waiting = conversations.find((c) => c.is_waiting_on_admin && !c.is_closed)

    return (waiting ?? conversations[0])?.id ?? null
  }, [conversations, selectedId])

  const thread = useSupportConversation(kind, activeId)

  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [thread.messages.length, thread.isSending])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) return conversations

    return conversations.filter((conversation) => {
      const requester = requesterSummary(conversation)

      return [requester.name, requester.email, conversation.latest_message?.body]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(term))
    })
  }, [conversations, search])

  const handleSelect = (id: number) => {
    setSelectedId(id)
    thread.markRead(id)
  }

  // Opening the thread counts as reading it: deep links and auto-selected
  // queries clear their unread badge instead of waiting for a row click.
  useMarkThreadReadOnOpen(activeId, conversations, 'unread_for_admin', thread.markRead)

  const handleClose = async () => {
    if (activeId === null) return

    try {
      await thread.closeConversation(activeId)
      toast({ title: t('Conversation closed.'), variant: 'success' })
      // Drop the explicit selection so the list re-picks the next open thread
      // instead of leaving a closed one on screen.
      setSelectedId(null)
    } catch {
      toast({
        title: t('Could not close the conversation.'),
        description: thread.sendError?.message,
        variant: 'destructive',
      })
    }
  }

  const handleReopen = async () => {
    if (activeId === null) return

    try {
      await thread.reopenConversation(activeId)
      toast({ title: t('Conversation reopened.'), variant: 'success' })
    } catch {
      toast({
        title: t('Could not reopen the conversation.'),
        description: thread.sendError?.message,
        variant: 'destructive',
      })
    }
  }

  const activeRequester = thread.conversation ? requesterSummary(thread.conversation) : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <LifeBuoy className="h-6 w-6" /> {t(heading)}
          </h1>
          <p className="text-muted-foreground">{t(description)}</p>
        </div>

        {counts && (counts.open_count > 0 || counts.awaiting_admin > 0 || counts.unread_messages > 0) && (
          <div className="flex gap-2">
            {counts.open_count > 0 && (
              <Badge variant="secondary">{t('{{count}} open chats', { count: counts.open_count })}</Badge>
            )}
            {counts.awaiting_admin > 0 && (
              <Badge variant="warning">{t('{{count}} waiting on you', { count: counts.awaiting_admin })}</Badge>
            )}
            {counts.unread_messages > 0 && (
              <Badge variant="default">{t('{{count}} unread', { count: counts.unread_messages })}</Badge>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Inbox */}
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="space-y-2 border-b p-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t(searchPlaceholder)}
                className="pl-8"
                aria-label={t('Search conversations')}
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFilter(option.value)}
                  className={[
                    'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                    filter === option.value
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  ].join(' ')}
                >
                  {t(option.label)}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[62vh] overflow-y-auto">
            {inbox.isLoading ? (
              <div className="space-y-2 p-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <MessageSquareText className="h-6 w-6 text-slate-300" aria-hidden="true" />
                <p className="text-sm font-medium">{t('Nothing here')}</p>
                <p className="text-xs text-muted-foreground">
                  {search.trim()
                    ? t('No conversation matches your search.')
                    : t('No {{noun}} conversations in this view.', { noun: requesterNoun })}
                </p>
              </div>
            ) : (
              filtered.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  isActive={conversation.id === activeId}
                  onSelect={() => handleSelect(conversation.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Thread */}
        <div className="overflow-hidden rounded-xl border bg-white">
          {activeId === null ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 p-8 text-center">
              <MessageSquareText className="h-8 w-8 text-slate-300" aria-hidden="true" />
              <p className="font-medium">{t('Select a conversation')}</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                {t('Pick a {{noun}} on the left to read the thread and reply.', { noun: requesterNoun })}
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50/60 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{activeRequester?.name ?? t('Loading…')}</p>
                  <p className="truncate text-xs text-muted-foreground">{activeRequester?.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  <SupportConnectionPill status={thread.connectionStatus} />
                  {thread.conversation?.is_closed ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleReopen()}
                      disabled={thread.isSending}
                    >
                      <ArchiveRestore className="h-3.5 w-3.5" /> {t('Reopen')}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleClose()}
                      disabled={thread.isSending}
                    >
                      <Archive className="h-3.5 w-3.5" /> {t('Close')}
                    </Button>
                  )}
                </div>
              </div>

              {thread.conversation?.is_closed && (
                <div className="border-b bg-amber-50 px-4 py-2 text-xs text-amber-800">
                  {t('This conversation is closed. Replying or closing nothing — the {{noun}} can still write, which reopens it automatically.', {
                    noun: requesterNoun,
                  })}
                </div>
              )}

              <div
                ref={scrollRef}
                className="h-[52vh] min-h-[360px] space-y-3 overflow-y-auto px-4 py-4"
              >
                {thread.isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-3/5" />
                    <Skeleton className="ml-auto h-12 w-2/5" />
                  </div>
                ) : (
                  <>
                    {thread.conversation?.recent_orders &&
                      thread.conversation.recent_orders.length > 0 && (
                        <RecentOrdersCard orders={thread.conversation.recent_orders} />
                      )}

                    {thread.messages.length === 0 ? (
                      <p className="py-10 text-center text-sm text-muted-foreground">
                        {t('No messages yet in this conversation.')}
                      </p>
                    ) : (
                      thread.messages.map((message) => (
                        <SupportMessageBubble
                          key={message.id}
                          message={message}
                          isOwn={message.sender_role === 'SUPER_ADMIN'}
                          mirrorForAdmin
                        />
                      ))
                    )}
                  </>
                )}
              </div>

              {/* The customer's chat offers quick questions; the admin sees the
                  same chips so they know what the customer was prompted with. */}
              {thread.messages.length === 0 && thread.suggestions.length > 0 && (
                <div className="border-t px-4 py-3">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('Try one of these')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {thread.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          if (activeId !== null) {
                            void thread.reply({ id: activeId, body: suggestion })
                          }
                        }}
                        disabled={thread.isSending}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <SupportComposer
                onSend={async (body) => {
                  await thread.reply({ id: activeId, body })
                }}
                isSending={thread.isSending}
                placeholder={t('Reply to {{name}}…', { name: activeRequester?.name ?? t(requesterNoun) })}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminSupportInbox
