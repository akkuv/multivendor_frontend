import { useEffect, useMemo, useState } from 'react'
import { Archive, ArchiveRestore, ExternalLink, Loader2, MessageSquareText, Plus, Search, Store, X } from 'lucide-react'
import type { TFunction } from 'i18next'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import {
  useCreateOrderQuery,
  useMarkThreadReadOnOpen,
  useSupportConversation,
  useSupportInbox,
} from '@/hooks/useSupport'
import { useAdminOrder, useAdminOrders } from '@/hooks/useAdmin'
import { assetUrl } from '@/lib/assets'
import { toast } from '@/lib/toast'
import { tStatus } from '@/i18n/status'
import type { AdminOrderParams } from '@/services/admin'
import type { SupportInboxFilter } from '@/services/support'
import type { Order, SupportConversation } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import OrderQueryThread from '@/components/support/OrderQueryThread'
import { useTranslation } from 'react-i18next'

const FILTERS: { value: SupportInboxFilter; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'awaiting', label: 'Waiting on you' },
  { value: 'closed', label: 'Closed' },
  { value: 'all', label: 'All' },
]

/**
 * `/admin/orders` rows carry the stores fulfilling each order, so the create
 * dialog can pair an order with the right vendor instead of making the admin
 * guess from a bare order number.
 */
interface AdminOrderWithVendors extends Order {
  vendor_orders?: Array<{ id: number; vendor?: { id: number; store_name: string } | null }>
}

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
  const store = conversation.vendor
  const orderNumber = conversation.order?.order_number

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
          {store?.logo ? <AvatarImage src={assetUrl(store.logo)} alt={store.store_name} /> : null}
          <AvatarFallback>
            <Store className="h-4 w-4" aria-hidden="true" />
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">{store?.store_name ?? t('Vendor')}</p>
            <span className="shrink-0 text-[11px] text-slate-400">
              {relativeTime(conversation.last_message_at, t)}
            </span>
          </div>

          <p className="mt-0.5 truncate text-xs font-medium text-slate-600">
            {orderNumber ? `${t('Order')} #${orderNumber}` : t('Order Query')}
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

interface NewQueryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pre-filled from a vendor-orders row when the query is raised there. */
  initialOrderId?: number | null
  initialVendorId?: number | null
  /** Called with the conversation once a query lands, so the page can open it. */
  onCreated: (conversationId: number) => void
}

/**
 * Raising an admin query: find the order with a search box (order number or
 * customer name, email, phone), pick the vendor who must be fulfilling it, then
 * write the question. Reusing an order + vendor pair opens the existing thread
 * instead of duplicating it.
 */
function NewQueryDialog({
  open,
  onOpenChange,
  initialOrderId,
  initialVendorId,
  onCreated,
}: NewQueryDialogProps) {
  const { t } = useTranslation()
  const createQuery = useCreateOrderQuery()

  const [orderId, setOrderId] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderWithVendors | null>(null)
  const [orderQuery, setOrderQuery] = useState('')
  const [debouncedOrderQuery, setDebouncedOrderQuery] = useState('')
  const [orderFocused, setOrderFocused] = useState(false)
  const [vendorId, setVendorId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  // The search endpoint is keyed by what the admin typed, debounced so a
  // keystroke does not fire a request; with no text the newest orders appear
  // as suggestions once the field is focused.
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedOrderQuery(orderQuery.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [orderQuery])

  const orderParams = useMemo<AdminOrderParams>(
    () => ({ search: debouncedOrderQuery || undefined, per_page: 8, page: 1 }),
    [debouncedOrderQuery],
  )

  const ordersQuery = useAdminOrders(orderParams)

  const orderResults = useMemo<AdminOrderWithVendors[]>(
    () => (ordersQuery.data?.data ?? []) as AdminOrderWithVendors[],
    [ordersQuery.data],
  )

  // A deep link from the vendor-orders page pre-fills the order from its detail
  // endpoint, which now carries the fulfilling vendors.
  const prefillQuery = useAdminOrder(open && initialOrderId ? initialOrderId : null)

  // (Re)initialise whenever the dialog opens, so a closed dialog forgets the
  // previous draft and accepts a fresh pre-fill from the vendor-orders page.
  useEffect(() => {
    if (!open) return

    setVendorId(initialVendorId ? String(initialVendorId) : '')
    setSubject('')
    setBody('')
    setOrderQuery('')
    setDebouncedOrderQuery('')
    setOrderFocused(false)

    if (initialOrderId && prefillQuery.data) {
      const prefilled = prefillQuery.data as AdminOrderWithVendors
      setOrderId(String(prefilled.id))
      setSelectedOrder(prefilled)
    } else if (initialOrderId) {
      // Keep the id for a moment while the detail loads.
      setOrderId(String(initialOrderId))
      setSelectedOrder(null)
    } else {
      setOrderId('')
      setSelectedOrder(null)
    }
  }, [open, initialOrderId, initialVendorId, prefillQuery.data])

  // Only vendors actually fulfilling the chosen order may be asked about it —
  // the validation rejects any other pairing, so stop offering one up front.
  const orderVendors = useMemo(() => {
    const selected = selectedOrder ?? orderResults.find((order) => order.id === Number(orderId))

    return (selected?.vendor_orders ?? [])
      .map((vendorOrder) => vendorOrder.vendor)
      .filter((vendor): vendor is { id: number; store_name: string } => vendor !== null && vendor !== undefined)
  }, [selectedOrder, orderResults, orderId])

  // Changing the order invalidates a previously picked vendor, and an empty
  // selection can never be asked about anything.
  useEffect(() => {
    if (!orderId) {
      setVendorId('')
      return
    }

    if (vendorId && !orderVendors.some((vendor) => vendor.id === Number(vendorId))) {
      setVendorId('')
    }
  }, [orderId, orderVendors, vendorId])

  const canSubmit = orderId !== '' && vendorId !== '' && subject.trim().length >= 3 && body.trim().length > 0 && !createQuery.isPending

  const handleSubmit = async () => {
    try {
      const result = await createQuery.mutateAsync({
        order_id: Number(orderId),
        vendor_id: Number(vendorId),
        subject: subject.trim(),
        body: body.trim(),
      })

      toast({ title: t('Order query created successfully.'), variant: 'success' })
      onOpenChange(false)

      onCreated(result.conversation.id)
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : t('Could not create the order query.')
      toast({ title: t('Could not create the order query.'), description: message, variant: 'destructive' })
    }
  }

  const selectedStores = (selectedOrder?.vendor_orders ?? [])
    .map((vendorOrder) => vendorOrder.vendor?.store_name)
    .filter((store): store is string => Boolean(store))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('New Order Query')}</DialogTitle>
          <DialogDescription>
            {t('Ask a vendor for order-related information. The vendor sees it in their order queries.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="query-order">{t('Order')}</Label>

              {selectedOrder === null ? (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <Input
                    id="query-order"
                    value={orderQuery}
                    onChange={(event) => setOrderQuery(event.target.value)}
                    onFocus={() => setOrderFocused(true)}
                    onBlur={() => window.setTimeout(() => setOrderFocused(false), 150)}
                    placeholder={t('Search order number or customer…')}
                    autoComplete="off"
                    className="pl-8"
                  />

                  {orderFocused && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                      {ordersQuery.isFetching ? (
                        <div className="flex items-center justify-center gap-2 px-3 py-4 text-xs text-slate-500">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          {t('Loading…')}
                        </div>
                      ) : orderResults.length === 0 ? (
                        <p className="px-3 py-4 text-center text-xs text-slate-500">{t('No orders found.')}</p>
                      ) : (
                        <ul>
                          {orderResults.map((order) => {
                            const stores = (order.vendor_orders ?? [])
                              .map((vendorOrder) => vendorOrder.vendor?.store_name)
                              .filter((store): store is string => Boolean(store))

                            return (
                              <li key={order.id}>
                                <button
                                  type="button"
                                  onMouseDown={(event) => {
                                    event.preventDefault()
                                    setSelectedOrder(order)
                                    setOrderId(String(order.id))
                                    setOrderQuery('')
                                    setOrderFocused(false)
                                  }}
                                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50"
                                >
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium text-slate-800">
                                      #{order.order_number}
                                    </span>
                                    <span className="block truncate text-xs text-slate-500">
                                      {order.user?.name ?? ''}
                                      {stores.length > 0 ? ` · ${stores.join(', ')}` : ''}
                                    </span>
                                  </span>
                                  <span className="shrink-0 text-xs text-slate-400">
                                    {tStatus(t, order.order_status)}
                                  </span>
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      #{selectedOrder.order_number}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {selectedOrder.user?.name ?? ''}
                      {selectedStores.length > 0 ? ` · ${selectedStores.join(', ')}` : ''}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedOrder(null)
                      setOrderId('')
                      setVendorId('')
                    }}
                    disabled={createQuery.isPending}
                    className="h-7 px-2 text-xs text-slate-500 hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" /> {t('Change')}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="query-vendor">{t('Vendor')}</Label>
              <Select
                value={vendorId}
                onValueChange={setVendorId}
                disabled={orderId === ''}
              >
                <SelectTrigger id="query-vendor" className="w-full">
                  <SelectValue
                    placeholder={
                      orderId === ''
                        ? t('Select an order first')
                        : t('Select a vendor')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {orderVendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={String(vendor.id)}>
                      {vendor.store_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="query-subject">{t('Subject')}</Label>
            <Input
              id="query-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={255}
              placeholder={t('e.g. Stock confirmation needed')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="query-body">{t('Question')}</Label>
            <Textarea
              id="query-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={4000}
              rows={4}
              placeholder={t('Describe what you need to know about this order…')}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('Cancel')}
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={!canSubmit}>
            {createQuery.isPending ? t('Sending…') : t('Send query')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * The admin side of order queries: order-linked threads with vendors, listed,
 * answered and triaged from one inbox. Raising a query points at an order and
 * the vendor fulfilling it; the vendor answers on their own order-query page.
 */
export function AdminOrderQueriesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()

  const routeThreadId = id ? Number(id) : null
  const createsNew = searchParams.get('new') === '1'
  const initialOrderId = searchParams.get('order_id') ? Number(searchParams.get('order_id')) : null
  const initialVendorId = searchParams.get('vendor_id') ? Number(searchParams.get('vendor_id')) : null

  const [filter, setFilter] = useState<SupportInboxFilter>('open')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(createsNew)

  const inbox = useSupportInbox('ORDER_QUERY', filter)
  const conversations = useMemo(() => inbox.data?.data ?? [], [inbox.data])
  const counts = inbox.data?.counts

  const activeId = useMemo(() => {
    if (selectedId !== null) return selectedId
    if (routeThreadId !== null) return routeThreadId

    const waiting = conversations.find((c) => c.is_waiting_on_admin && !c.is_closed)

    return (waiting ?? conversations[0])?.id ?? null
  }, [conversations, selectedId, routeThreadId])

  const thread = useSupportConversation('ORDER_QUERY', activeId)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) return conversations

    return conversations.filter((conversation) => {
      const haystack = [
        conversation.vendor?.store_name,
        conversation.order?.order_number,
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
    } catch (error) {
      toast({
        title: t('Could not close the conversation.'),
        description: error instanceof Error ? error.message : thread.sendError?.message,
        variant: 'destructive',
      })
    }
  }

  const handleReopen = async () => {
    if (activeId === null) return

    try {
      await thread.reopenConversation(activeId)
      toast({ title: t('Conversation reopened.'), variant: 'success' })
    } catch (error) {
      toast({
        title: t('Could not reopen the conversation.'),
        description: error instanceof Error ? error.message : thread.sendError?.message,
        variant: 'destructive',
      })
    }
  }

  const activeConversation = thread.conversation
  const activeStore = activeConversation?.vendor
  const activeOrder = activeConversation?.order
  const activeCustomer = activeOrder?.customer

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <MessageSquareText className="h-6 w-6 text-primary" /> {t('Order Queries')}
          </h1>
          <p className="text-muted-foreground">
            {t('Questions to vendors about their orders, asked from here and answered by them.')}
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
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> {t('New Query')}
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
                placeholder={t('Search store, order or message…')}
                className="pl-8"
                aria-label={t('Search order queries')}
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
                    ? t('No order query matches your search.')
                    : t('No order queries in this view. Raise one with the New Query button.')}
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
          orderHref={
            activeOrder?.vendor_order_id
              ? `/admin/vendor-orders/${activeOrder.vendor_order_id}`
              : undefined
          }
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
              <p className="truncate font-semibold">{activeStore?.store_name ?? t('Vendor')}</p>
              <p className="truncate text-xs text-muted-foreground">
                {activeOrder ? (
                  <>
                    {t('Order')}{' '}
                    {activeOrder.vendor_order_id ? (
                      <Link
                        to={`/admin/vendor-orders/${activeOrder.vendor_order_id}`}
                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                        title={t('View full order')}
                      >
                        #{activeOrder.order_number}
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </Link>
                    ) : (
                      <span>#{activeOrder.order_number}</span>
                    )}
                  </>
                ) : (
                  t('Order Query')
                )}
                {activeCustomer ? ` · ${activeCustomer.name}` : ''}
              </p>
            </div>
          }
          composerPlaceholder={t('Reply to {{store}}…', { store: activeStore?.store_name ?? t('vendor') })}
          emptyTitle={t('Select an order query')}
          emptyDescription={t('Pick a query on the left to read the thread and reply.')}
        />
      </div>

      <NewQueryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialOrderId={initialOrderId}
        initialVendorId={initialVendorId}
        onCreated={(conversationId) => navigate(`/admin/order-queries/${conversationId}`)}
      />
    </div>
  )
}

export default AdminOrderQueriesPage