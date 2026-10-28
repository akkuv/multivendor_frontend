import { useMemo, useState } from 'react'
import { Archive, ArchiveRestore, ExternalLink, MessageSquareText, Package, Plus, Search } from 'lucide-react'
import type { TFunction } from 'i18next'
import { Link, useParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useMarkThreadReadOnOpen, useSupportConversation, useSupportInbox } from '@/hooks/useSupport'
import { assetUrl } from '@/lib/assets'
import { toast } from '@/lib/toast'
import type { SupportInboxFilter } from '@/services/support'
import type { SupportConversation } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import OrderQueryThread from '@/components/support/OrderQueryThread'
import ProductQueryContext from '@/components/support/ProductQueryContext'
import NewProductQueryDialog from '@/components/support/NewProductQueryDialog'
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
 * The admin side of product queries: product-linked threads about a product,
 * answered by the selling vendor and the marketplace team together. Customers
 * and vendors both open these, and the team can start one about any product —
 * admins read, reply and triage.
 */
function QueryRow({
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
  const customer = conversation.customer
  const product = conversation.product
  const store = conversation.product?.vendor
  const image = product?.images?.[0]

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
          {image ? <AvatarImage src={assetUrl(image)} alt={product?.name} /> : null}
          <AvatarFallback>
            <Package className="h-4 w-4" aria-hidden="true" />
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">{product?.name ?? t('Product')}</p>
            <span className="shrink-0 text-[11px] text-slate-400">
              {relativeTime(conversation.last_message_at, t)}
            </span>
          </div>

          <p className="mt-0.5 truncate text-xs font-medium text-slate-600">
            {customer?.name ??
              (conversation.requester_type === 'VENDOR'
                ? store?.store_name ?? t('Store')
                : t('Customer'))}
            {store ? ` · ${store.store_name}` : ''}
          </p>

          <p className="mt-0.5 truncate text-xs text-slate-500">
            {preview ? preview.body : t('No messages yet')}
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

/**
 * The admin side of product queries: product-linked threads about a product,
 * answered by the selling vendor and the marketplace team together. Customers
 * and vendors both open these, and the team can start one about any product —
 * admins read, reply and triage.
 */
export function AdminProductQueriesPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const { id } = useParams<{ id: string }>()

  const routeThreadId = id ? Number(id) : null

  const [filter, setFilter] = useState<SupportInboxFilter>('open')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [newOpen, setNewOpen] = useState(false)

  const inbox = useSupportInbox('PRODUCT_QUERY', filter)
  const conversations = useMemo(() => inbox.data?.data ?? [], [inbox.data])
  const counts = inbox.data?.counts

  const activeId = useMemo(() => {
    if (selectedId !== null) return selectedId
    if (routeThreadId !== null) return routeThreadId

    const waiting = conversations.find((c) => c.is_waiting_on_admin && !c.is_closed)

    return (waiting ?? conversations[0])?.id ?? null
  }, [conversations, selectedId, routeThreadId])

  const thread = useSupportConversation('PRODUCT_QUERY', activeId)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) return conversations

    return conversations.filter((conversation) => {
      const haystack = [
        conversation.product?.name,
        conversation.product?.vendor?.store_name,
        conversation.customer?.name,
        conversation.subject,
        conversation.latest_message?.body,
      ]

      return haystack.filter(Boolean).some((field) => field!.toLowerCase().includes(term))
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

  const activeConversation = thread.conversation
  const activeCustomer = activeConversation?.customer
  const activeStore = activeConversation?.product?.vendor

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <MessageSquareText className="h-6 w-6 text-primary" /> {t('Product Queries')}
          </h1>
          <p className="text-muted-foreground">
            {t('Customer questions about products, answered with the selling vendor.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {counts && (counts.awaiting_admin > 0 || counts.unread_messages > 0) && (
            <>
              {counts.awaiting_admin > 0 && (
                <Badge variant="warning">{t('{{count}} waiting on you', { count: counts.awaiting_admin })}</Badge>
              )}
              {counts.unread_messages > 0 && (
                <Badge variant="default">{t('{{count}} unread', { count: counts.unread_messages })}</Badge>
              )}
            </>
          )}
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" /> {t('New Query')}
          </Button>
        </div>
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
                placeholder={t('Search product, customer or message…')}
                className="pl-8"
                aria-label={t('Search product queries')}
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
                    ? t('No product query matches your search.')
                    : t('No product queries in this view.')}
                </p>
              </div>
            ) : (
              filtered.map((conversation) => (
                <QueryRow
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
        <div className="flex min-w-0 flex-col gap-4">
          <ProductQueryContext conversation={activeConversation} role="admin" />
          <OrderQueryThread
            conversation={activeConversation}
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
            mirrorForAdmin
            actions={
              activeConversation?.is_closed ? (
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
              )
            }
            header={
              <div className="py-0.5">
                <p className="truncate font-semibold">
                  {activeConversation?.product ? (
                    <Link
                      to={`/product/${activeConversation.product.slug}`}
                      title={t('View product details')}
                      className="inline-flex max-w-full items-center gap-1.5 font-semibold text-primary hover:underline"
                    >
                      <span className="truncate">{activeConversation.product.name}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    </Link>
                  ) : (
                    t('Product Query')
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {activeCustomer
                    ? t('{{name}} asked', { name: activeCustomer.name })
                    : activeConversation?.requester_type === 'VENDOR'
                      ? t('{{store}} asked about this product', {
                          store: activeStore?.store_name ?? t('Store'),
                        })
                      : t('A customer asked about this product')}
                  {activeStore ? ` · ${activeStore.store_name}` : ''}
                </p>
              </div>
            }
            composerPlaceholder={
              activeConversation?.requester_type === 'VENDOR'
                ? t('Reply to {{store}}…', { store: activeStore?.store_name ?? t('vendor') })
                : t('Reply to {{store}} and the customer…', {
                    store: activeStore?.store_name ?? t('vendor'),
                  })
            }
            emptyTitle={t('Select a product query')}
            emptyDescription={t('Pick a query on the left to read the thread and reply.')}
            closedNote={t('This conversation is closed. Writing a new message reopens it automatically.')}
            errorTitle={t('Could not load this product query.')}
          />
        </div>
      </div>

      <NewProductQueryDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        role="admin"
        onCreated={(conversationId) => {
          setNewOpen(false)
          setFilter('open')
          setSelectedId(conversationId)
        }}
      />
    </div>
  )
}

export default AdminProductQueriesPage