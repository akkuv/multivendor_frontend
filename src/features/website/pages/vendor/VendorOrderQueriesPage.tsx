import { useMemo, useState } from 'react'
import { ExternalLink, MessageCircleQuestion, Search, ShoppingBag } from 'lucide-react'
import type { TFunction } from 'i18next'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useMarkThreadReadOnOpen, useThreadOpenParam, useVendorOrderQueries, useVendorOrderQuery } from '@/hooks/useSupport'
import { tStatus } from '@/i18n/status'
import type { SupportConversation } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import OrderQueryThread from '@/components/support/OrderQueryThread'
import { useTranslation } from 'react-i18next'

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
 * The backend stores the subject of an order query as "Order enquiry: :order".
 * Translate it against that key so it follows the app language live, the same
 * way enum statuses do via tStatus.
 */
function formatSubject(t: TFunction, subject: string | null): string {
  if (!subject) return t('Order Query')

  const prefix = 'Order enquiry: '
  if (subject.startsWith(prefix)) {
    return t('Order enquiry: {{order}}', { order: subject.slice(prefix.length) })
  }

  return subject
}

function OrderQueryRow({
  conversation,
  isActive,
  onSelect,
}: {
  conversation: SupportConversation
  isActive: boolean
  onSelect: () => void
}) {
  const { t } = useTranslation()
  const unread = conversation.unread_for_vendor ?? 0
  const preview = conversation.latest_message

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
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">
              {conversation.order?.order_number ?? t('Order')}
            </p>
            <span className="shrink-0 text-[11px] text-slate-400">
              {relativeTime(conversation.last_message_at, t)}
            </span>
          </div>

          {conversation.subject ? (
            <p className="mt-0.5 truncate text-xs font-medium text-slate-600">
              {formatSubject(t, conversation.subject)}
            </p>
          ) : null}

          <p className="mt-0.5 truncate text-xs text-slate-500">
            {preview ? preview.body : t('No messages yet')}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {unread > 0 && (
              <Badge variant="default" className="px-1.5 py-0 text-[10px]">
                {t('{{count}} new', { count: unread })}
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

/**
 * The vendor's order queries: admin-initiated, order-linked questions about
 * the vendor's fulfilment of a specific order. There is no assistant here —
 * every reply goes to a person on the marketplace team.
 */
export function VendorOrderQueriesPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  // Notification redirects land with ?open=<conversation_id>.
  useThreadOpenParam(setSelectedId)

  const list = useVendorOrderQueries()
  const conversations = useMemo(() => list.data?.data ?? [], [list.data])
  const unreadCount = list.data?.unread_count ?? 0

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return conversations

    return conversations.filter((conversation) => {
      const orderNumber = conversation.order?.order_number ?? ''
      const subject = conversation.subject ?? ''
      const preview = conversation.latest_message?.body ?? ''
      return `${orderNumber} ${subject} ${preview}`.toLowerCase().includes(term)
    })
  }, [conversations, search])

  // The most recent query is the default; an explicit selection wins.
  const activeId = selectedId ?? conversations[0]?.id ?? null

  const thread = useVendorOrderQuery(activeId)

  const handleSelect = (id: number) => {
    setSelectedId(id)
    thread.markRead(id)
  }

  // Opening the thread counts as reading it: deep links and auto-selected
  // queries clear their unread badge instead of waiting for a row click.
  useMarkThreadReadOnOpen(activeId, conversations, 'unread_for_vendor', thread.markRead)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <MessageCircleQuestion className="h-6 w-6 text-primary" /> {t('Order Queries')}
          </h1>
          <p className="text-muted-foreground">
            {t('Questions from the marketplace team about your orders.')}
          </p>
        </div>

        {unreadCount > 0 && <Badge variant="default">{t('{{count}} unread', { count: unreadCount })}</Badge>}
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* List */}
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="border-b p-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('Search queries…')}
                aria-label={t('Search queries')}
                className="pl-8"
              />
            </div>
          </div>
          <div className="max-h-[58vh] overflow-y-auto">
            {list.isLoading ? (
              <div className="space-y-2 p-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <MessageCircleQuestion className="h-6 w-6 text-slate-300" aria-hidden="true" />
                <p className="text-sm font-medium">{t('Nothing here yet')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('When the admin asks about an order, it will appear here.')}
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <Search className="h-6 w-6 text-slate-300" aria-hidden="true" />
                <p className="text-sm font-medium">{t('No queries match your search.')}</p>
              </div>
            ) : (
              filtered.map((conversation) => (
                <OrderQueryRow
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
        <OrderQueryThread
          conversation={thread.conversation}
          messages={thread.messages}
          connectionStatus={thread.connectionStatus}
          isLoading={thread.isLoading}
          isError={thread.isError}
          isSending={thread.isSending}
          currentUserId={user?.id}
          onReply={async (body, imageUrl) => {
            if (activeId === null) return
            await thread.reply({
              id: activeId,
              body,
              ...(imageUrl ? { image_url: imageUrl } : {}),
            })
          }}
          onRetry={() => void thread.refetch()}
          allowImages
          orderHref={
            thread.conversation?.order?.vendor_order_id
              ? `/vendor/orders/${thread.conversation.order.vendor_order_id}`
              : undefined
          }
          header={
            <div className="py-0.5">
              <p className="truncate font-semibold">
                {thread.conversation?.order?.vendor_order_id ? (
                  <Link
                    to={`/vendor/orders/${thread.conversation.order.vendor_order_id}`}
                    className="inline-flex max-w-full items-center gap-1.5 font-semibold text-primary hover:underline"
                    title={t('View full order')}
                  >
                    <span className="truncate">{thread.conversation.order.order_number}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </Link>
                ) : (
                  <span className="truncate">
                    {thread.conversation?.order?.order_number ?? t('Order Query')}
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {thread.conversation?.order
                  ? t('Order status: {{status}}', {
                      status: tStatus(t, thread.conversation.order.order_status),
                    })
                  : t('Marketplace team')}
                {thread.conversation?.order?.customer
                  ? ` · ${thread.conversation.order.customer.name}`
                  : ''}
              </p>
            </div>
          }
          composerPlaceholder={t('Reply to the marketplace team…')}
          emptyTitle={t('Select an order query')}
          emptyDescription={t('Pick a query on the left to read the thread and reply.')}
        />
      </div>
    </div>
  )
}

export default VendorOrderQueriesPage