import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  closeSupportConversation,
  createAdminProductQuery,
  createOrderQuery,
  createProductQuery,
  createVendorProductQuery,
  getCustomerProductQueries,
  getCustomerProductQueriesUnreadCount,
  getCustomerProductQuery,
  getCustomerSupport,
  getCustomerSupportUnreadCount,
  getSupportConversation,
  getSupportCounts,
  getSupportInbox,
  getVendorOrderQueries,
  getVendorOrderQueriesUnreadCount,
  getVendorOrderQuery,
  getVendorProductQueries,
  getVendorProductQueriesUnreadCount,
  getVendorProductQuery,
  getVendorSupport,
  getVendorSupportUnreadCount,
  markCustomerProductQueryRead,
  markCustomerSupportRead,
  markSupportRead,
  markVendorOrderQueryRead,
  markVendorProductQueryRead,
  markVendorSupportRead,
  reopenSupportConversation,
  sendCustomerProductQueryMessage,
  sendCustomerSupportMessage,
  sendSupportReply,
  sendVendorOrderQueryMessage,
  sendVendorProductQueryMessage,
  sendVendorSupportMessage,
  type SupportInboxFilter,
  type SupportInboxKind,
} from '@/services/support'
import { getEcho, isRealtimeConfigured } from '@/lib/reverb'
import type {
  CreateOrderQueryPayload,
  CreateProductQueryPayload,
  SendSupportMessageResult,
  SupportConversation,
  SupportMessageEvent,
  VendorSupportPayload,
} from '@/types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

/* ------------------------------------------------------------------ */
/* Shared                                                              */
/* ------------------------------------------------------------------ */

/**
 * Subscribe to a conversation's websocket channel.
 *
 * Returns the connection state so the UI can tell the user whether messages are
 * arriving live or falling back to a slower refresh. The backend is the source
 * of truth: the event only triggers a refetch, it never renders directly.
 */
function useSupportChannel(
  conversationId: number | null,
  onMessage: (event: SupportMessageEvent) => void,
): 'connecting' | 'live' | 'offline' {
  const token = useAuthStore((state) => state.token)
  const [status, setStatus] = useState<'connecting' | 'live' | 'offline'>('offline')

  useEffect(() => {
    if (!conversationId || !token || !isRealtimeConfigured()) {
      setStatus('offline')
      return
    }

    let echo: ReturnType<typeof getEcho>
    try {
      echo = getEcho(token)
    } catch {
      setStatus('offline')
      return
    }

    setStatus('connecting')

    const channelName = `support.conversation.${conversationId}`
    const channel = echo.private(channelName)

    channel.listen('.support.message.sent', (payload: SupportMessageEvent) => onMessage(payload))

    // `subscribed` fires only once the server has authorised the channel, which
    // is the honest signal that messages will arrive live. A refusal means the
    // token or the channel check failed, so fall back to polling rather than
    // showing a "live" badge that is not.
    channel.subscribed(() => setStatus('live'))
    channel.error(() => setStatus('offline'))

    return () => {
      // Leaving the channel rather than disconnecting: the same socket is shared
      // with the admin inbox, so tearing it down would break both.
      echo.leave(channelName)
      setStatus('offline')
    }
    // `onMessage` is intentionally excluded: callers pass an inline function and
    // re-subscribing on every render would thrash the socket.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, token])

  return status
}

/* ------------------------------------------------------------------ */
/* Query keys                                                          */
/* ------------------------------------------------------------------ */

// Hoisted so they are referentially stable across renders; a fresh array
// literal per render would defeat every `invalidateQueries` prefix match.
const VENDOR_SUPPORT_KEY = ['support', 'vendor'] as const
const VENDOR_UNREAD_KEY = ['support', 'vendor-unread'] as const
const CUSTOMER_SUPPORT_KEY = ['support', 'customer'] as const
const CUSTOMER_UNREAD_KEY = ['support', 'customer-unread'] as const
const INBOX_KEY = ['support', 'inbox'] as const
const COUNTS_KEY = ['support', 'counts'] as const
const VENDOR_ORDER_QUERIES_KEY = ['support', 'order-queries', 'vendor'] as const
const VENDOR_ORDER_QUERIES_UNREAD_KEY = ['support', 'order-queries', 'vendor-unread'] as const
const VENDOR_PRODUCT_QUERIES_KEY = ['support', 'product-queries', 'vendor'] as const
const VENDOR_PRODUCT_QUERIES_UNREAD_KEY = ['support', 'product-queries', 'vendor-unread'] as const
const CUSTOMER_PRODUCT_QUERIES_KEY = ['support', 'product-queries', 'customer'] as const
const CUSTOMER_PRODUCT_QUERIES_UNREAD_KEY = ['support', 'product-queries', 'customer-unread'] as const

/* ------------------------------------------------------------------ */
/* Requester side (vendor and customer share one shape)                */
/* ------------------------------------------------------------------ */

/**
 * One requester's own support thread.
 *
 * The vendor and customer chats are the same conversation with the same
 * components, so they share this hook and differ only in the endpoints, the
 * badge, and the query keys. Factoring it this way means a change to the chat
 * behaviour cannot land in one and miss the other.
 */
function useRequesterSupport(
  keys: { thread: readonly unknown[]; unread: readonly unknown[] },
  load: () => Promise<VendorSupportPayload>,
  send: (payload: { body: string; skip_bot?: boolean }) => Promise<SendSupportMessageResult>,
  markReadRequest: () => Promise<SupportConversation>,
) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: keys.thread,
    queryFn: load,
    // Safety net for when the socket cannot connect. The websocket is what makes
    // delivery feel instant; this only stops the transcript going stale.
    refetchInterval: 2_000,
    refetchIntervalInBackground: true,
  })

  const conversationId = query.data?.conversation.id ?? null

  /**
   * A websocket event only tells us something changed, so refetch rather than
   * splicing the payload in. Keeps the rendered transcript identical whether it
   * arrived by socket or by the fallback poll.
   */
  const refetch = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: keys.thread })
  }, [queryClient, keys.thread])

  const connectionStatus = useSupportChannel(conversationId, refetch)

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: keys.thread })
    void queryClient.invalidateQueries({ queryKey: keys.unread })
  }, [queryClient, keys.thread, keys.unread])

  const sendMutation = useMutation({ mutationFn: send, onSuccess: refresh })

  const markReadMutation = useMutation({ mutationFn: markReadRequest, onSuccess: refresh })

  return {
    ...query,
    conversation: query.data?.conversation ?? null,
    messages: query.data?.messages.data ?? [],
    suggestions: query.data?.suggestions ?? [],
    connectionStatus,
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
    sendError: sendMutation.error,
    markRead: markReadMutation.mutate,
  }
}

/* ------------------------------------------------------------------ */
/* Vendor side                                                         */
/* ------------------------------------------------------------------ */

export function useVendorSupport() {
  return useRequesterSupport(
    { thread: VENDOR_SUPPORT_KEY, unread: VENDOR_UNREAD_KEY },
    () => getVendorSupport(),
    sendVendorSupportMessage,
    markVendorSupportRead,
  )
}

export function useVendorSupportUnreadCount() {
  return useQuery({
    queryKey: VENDOR_UNREAD_KEY,
    queryFn: getVendorSupportUnreadCount,
    refetchInterval: 5_000,
  })
}

/* ------------------------------------------------------------------ */
/* Vendor order queries                                                */
/* ------------------------------------------------------------------ */

export function useVendorOrderQueries() {
  return useQuery({
    queryKey: VENDOR_ORDER_QUERIES_KEY,
    queryFn: () => getVendorOrderQueries(),
    refetchInterval: 5_000,
  })
}

export function useVendorOrderQueriesUnreadCount() {
  return useQuery({
    queryKey: VENDOR_ORDER_QUERIES_UNREAD_KEY,
    queryFn: getVendorOrderQueriesUnreadCount,
    refetchInterval: 5_000,
  })
}

/**
 * One vendor order query thread. Same shape as the admin inbox thread hook:
 * the transcript refetches on a websocket message, and the list plus badge
 * refresh alongside so the row preview and unread state stay honest.
 */
export function useVendorOrderQuery(id: number | null) {
  const queryClient = useQueryClient()
  const queryKey = useMemo(
    () => ['support', 'order-queries', 'vendor', 'conversation', id] as const,
    [id],
  )

  const invalidateRelated = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey })
    void queryClient.invalidateQueries({ queryKey: VENDOR_ORDER_QUERIES_KEY })
    void queryClient.invalidateQueries({ queryKey: VENDOR_ORDER_QUERIES_UNREAD_KEY })
  }, [queryClient, queryKey])

  const query = useQuery({
    queryKey,
    queryFn: () => getVendorOrderQuery(id as number),
    enabled: id !== null,
    // Safety net for when the socket cannot connect.
    refetchInterval: 2_000,
    refetchIntervalInBackground: true,
  })

  const conversationId = query.data?.conversation.id ?? null

  const refetch = useCallback(() => {
    invalidateRelated()
  }, [invalidateRelated])

  const connectionStatus = useSupportChannel(conversationId, refetch)

  const replyMutation = useMutation({
    mutationFn: ({
      id: conversationIdToReply,
      body,
      image_url,
    }: {
      id: number
      body: string
      image_url?: string
    }) => sendVendorOrderQueryMessage(conversationIdToReply, { body, image_url }),
    onSuccess: invalidateRelated,
  })

  const markReadMutation = useMutation({
    mutationFn: (conversationIdToRead: number) => markVendorOrderQueryRead(conversationIdToRead),
    onSuccess: invalidateRelated,
  })

  return {
    ...query,
    conversation: query.data?.conversation ?? null,
    messages: query.data?.messages.data ?? [],
    connectionStatus,
    reply: replyMutation.mutateAsync,
    isSending: replyMutation.isPending,
    sendError: replyMutation.error,
    markRead: (conversationIdToRead: number) => markReadMutation.mutate(conversationIdToRead),
  }
}

/**
 * Raise (or continue) an admin query about an order, then refresh the admin
 * inbox, its badge and the vendor's side so all three agree immediately.
 */
export function useCreateOrderQuery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateOrderQueryPayload) => createOrderQuery(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INBOX_KEY })
      void queryClient.invalidateQueries({ queryKey: COUNTS_KEY })
      void queryClient.invalidateQueries({ queryKey: VENDOR_ORDER_QUERIES_KEY })
      void queryClient.invalidateQueries({ queryKey: VENDOR_ORDER_QUERIES_UNREAD_KEY })
    },
  })
}

/* ------------------------------------------------------------------ */
/* Vendor product queries                                              */
/* ------------------------------------------------------------------ */

export function useVendorProductQueries() {
  return useQuery({
    queryKey: VENDOR_PRODUCT_QUERIES_KEY,
    queryFn: () => getVendorProductQueries(),
    refetchInterval: 5_000,
  })
}

export function useVendorProductQueriesUnreadCount() {
  return useQuery({
    queryKey: VENDOR_PRODUCT_QUERIES_UNREAD_KEY,
    queryFn: getVendorProductQueriesUnreadCount,
    refetchInterval: 5_000,
  })
}

/**
 * Start a product query about one of the vendor's own products, then refresh
 * the vendor's product-query list and badge so the new thread appears at once.
 */
export function useCreateVendorProductQuery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateProductQueryPayload) => createVendorProductQuery(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: VENDOR_PRODUCT_QUERIES_KEY })
      void queryClient.invalidateQueries({ queryKey: VENDOR_PRODUCT_QUERIES_UNREAD_KEY })
    },
  })
}

/**
 * One vendor product query thread: the transcript refetches on a websocket
 * message, and the list plus badge refresh alongside so the row preview and
 * unread state stay honest.
 */
export function useVendorProductQuery(id: number | null) {
  const queryClient = useQueryClient()
  const queryKey = useMemo(
    () => ['support', 'product-queries', 'vendor', 'conversation', id] as const,
    [id],
  )

  const invalidateRelated = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey })
    void queryClient.invalidateQueries({ queryKey: VENDOR_PRODUCT_QUERIES_KEY })
    void queryClient.invalidateQueries({ queryKey: VENDOR_PRODUCT_QUERIES_UNREAD_KEY })
  }, [queryClient, queryKey])

  const query = useQuery({
    queryKey,
    queryFn: () => getVendorProductQuery(id as number),
    enabled: id !== null,
    // Safety net for when the socket cannot connect.
    refetchInterval: 2_000,
    refetchIntervalInBackground: true,
  })

  const conversationId = query.data?.conversation.id ?? null

  const refetch = useCallback(() => {
    invalidateRelated()
  }, [invalidateRelated])

  const connectionStatus = useSupportChannel(conversationId, refetch)

  const replyMutation = useMutation({
    mutationFn: ({
      id: conversationIdToReply,
      body,
      image_url,
    }: {
      id: number
      body: string
      image_url?: string
    }) => sendVendorProductQueryMessage(conversationIdToReply, { body, image_url }),
    onSuccess: invalidateRelated,
  })

  const markReadMutation = useMutation({
    mutationFn: (conversationIdToRead: number) => markVendorProductQueryRead(conversationIdToRead),
    onSuccess: invalidateRelated,
  })

  return {
    ...query,
    conversation: query.data?.conversation ?? null,
    messages: query.data?.messages.data ?? [],
    connectionStatus,
    reply: replyMutation.mutateAsync,
    isSending: replyMutation.isPending,
    sendError: replyMutation.error,
    markRead: (conversationIdToRead: number) => markReadMutation.mutate(conversationIdToRead),
  }
}

/* ------------------------------------------------------------------ */
/* Customer side                                                       */
/* ------------------------------------------------------------------ */

export function useCustomerSupport() {
  return useRequesterSupport(
    { thread: CUSTOMER_SUPPORT_KEY, unread: CUSTOMER_UNREAD_KEY },
    () => getCustomerSupport(),
    sendCustomerSupportMessage,
    markCustomerSupportRead,
  )
}

export function useCustomerSupportUnreadCount() {
  return useQuery({
    queryKey: CUSTOMER_UNREAD_KEY,
    queryFn: getCustomerSupportUnreadCount,
    refetchInterval: 5_000,
  })
}

/* ------------------------------------------------------------------ */
/* Customer product queries                                            */
/* ------------------------------------------------------------------ */

export function useCustomerProductQueries() {
  return useQuery({
    queryKey: CUSTOMER_PRODUCT_QUERIES_KEY,
    queryFn: () => getCustomerProductQueries(),
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  })
}

export function useCustomerProductQueriesUnreadCount() {
  return useQuery({
    queryKey: CUSTOMER_PRODUCT_QUERIES_UNREAD_KEY,
    queryFn: getCustomerProductQueriesUnreadCount,
    refetchInterval: 5_000,
  })
}

/**
 * One customer product query thread, opened from the account page or right
 * after asking about a product. Refetches on websocket messages; the list and
 * the account badge refresh alongside so unread state stays honest.
 */
export function useCustomerProductQuery(id: number | null) {
  const queryClient = useQueryClient()
  const queryKey = useMemo(
    () => ['support', 'product-queries', 'customer', 'conversation', id] as const,
    [id],
  )

  const invalidateRelated = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey })
    void queryClient.invalidateQueries({ queryKey: CUSTOMER_PRODUCT_QUERIES_KEY })
    void queryClient.invalidateQueries({ queryKey: CUSTOMER_PRODUCT_QUERIES_UNREAD_KEY })
  }, [queryClient, queryKey])

  const query = useQuery({
    queryKey,
    queryFn: () => getCustomerProductQuery(id as number),
    enabled: id !== null,
    // Safety net for when the socket cannot connect.
    refetchInterval: 2_000,
    refetchIntervalInBackground: true,
  })

  const conversationId = query.data?.conversation.id ?? null

  const refetch = useCallback(() => {
    invalidateRelated()
  }, [invalidateRelated])

  const connectionStatus = useSupportChannel(conversationId, refetch)

  const replyMutation = useMutation({
    mutationFn: ({
      id: conversationIdToReply,
      body,
      image_url,
    }: {
      id: number
      body: string
      image_url?: string
    }) => sendCustomerProductQueryMessage(conversationIdToReply, { body, image_url }),
    onSuccess: invalidateRelated,
  })

  const markReadMutation = useMutation({
    mutationFn: (conversationIdToRead: number) => markCustomerProductQueryRead(conversationIdToRead),
    onSuccess: invalidateRelated,
  })

  return {
    ...query,
    conversation: query.data?.conversation ?? null,
    messages: query.data?.messages.data ?? [],
    connectionStatus,
    reply: replyMutation.mutateAsync,
    isSending: replyMutation.isPending,
    sendError: replyMutation.error,
    markRead: (conversationIdToRead: number) => markReadMutation.mutate(conversationIdToRead),
  }
}

/**
 * Ask about a product from the product page, then refresh the customer's
 * product-query list and badge so the new thread appears immediately.
 */
export function useCreateProductQuery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateProductQueryPayload) => createProductQuery(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CUSTOMER_PRODUCT_QUERIES_KEY })
      void queryClient.invalidateQueries({ queryKey: CUSTOMER_PRODUCT_QUERIES_UNREAD_KEY })
    },
  })
}

/* ------------------------------------------------------------------ */
/* Admin side                                                          */
/* ------------------------------------------------------------------ */

export function useSupportInbox(kind: SupportInboxKind, filter: SupportInboxFilter) {
  return useQuery({
    queryKey: [...INBOX_KEY, kind, filter],
    queryFn: () => getSupportInbox(kind, { filter }),
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  })
}

/**
 * Start a product query from the marketplace team about any product, then
 * refresh the admin product-query inbox and its sidebar badge so the new
 * thread and its "waiting on you" state appear immediately.
 */
export function useCreateAdminProductQuery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateProductQueryPayload) => createAdminProductQuery(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INBOX_KEY })
      void queryClient.invalidateQueries({ queryKey: COUNTS_KEY })
      void queryClient.invalidateQueries({ queryKey: VENDOR_PRODUCT_QUERIES_KEY })
      void queryClient.invalidateQueries({ queryKey: VENDOR_PRODUCT_QUERIES_UNREAD_KEY })
    },
  })
}

/**
 * Badge totals for the admin sidebar, kept separate from the inbox so the layout
 * does not pull a page of conversations on every poll.
 */
export function useSupportInboxCounts(kind: SupportInboxKind) {
  return useQuery({
    queryKey: [...COUNTS_KEY, kind],
    queryFn: () => getSupportCounts(kind),
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  })
}

export function useSupportConversation(kind: SupportInboxKind, id: number | null) {
  const queryClient = useQueryClient()
  const queryKey = useMemo(() => ['support', kind, 'conversation', id] as const, [kind, id])

  /**
   * The inbox row (unread badge, "waiting on you") and the sidebar counts are
   * derived from the same message, so they have to refresh alongside the thread.
   */
  const invalidateRelated = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey })
    void queryClient.invalidateQueries({ queryKey: INBOX_KEY })
    void queryClient.invalidateQueries({ queryKey: COUNTS_KEY })
  }, [queryClient, queryKey])

  const query = useQuery({
    queryKey,
    queryFn: () => getSupportConversation(kind, id as number),
    enabled: id !== null,
    // Same socket-offline safety net as the requester chat.
    refetchInterval: 1_000,
    refetchIntervalInBackground: true,
  })

  const conversationId = query.data?.conversation.id ?? null

  const refetch = useCallback(() => {
    invalidateRelated()
  }, [invalidateRelated])

  const connectionStatus = useSupportChannel(conversationId, refetch)

  const replyMutation = useMutation({
    mutationFn: ({
      id: conversationIdToReply,
      body,
      image_url,
    }: {
      id: number
      body: string
      image_url?: string
    }) => sendSupportReply(kind, conversationIdToReply, { body, image_url }),
    onSuccess: invalidateRelated,
  })

  const markReadMutation = useMutation({
    mutationFn: (conversationIdToRead: number) => markSupportRead(kind, conversationIdToRead),
    onSuccess: invalidateRelated,
  })

  const closeMutation = useMutation({
    mutationFn: (conversationIdToClose: number) => closeSupportConversation(kind, conversationIdToClose),
    onSuccess: invalidateRelated,
  })

  const reopenMutation = useMutation({
    mutationFn: (conversationIdToReopen: number) => reopenSupportConversation(kind, conversationIdToReopen),
    onSuccess: invalidateRelated,
  })

  return {
    ...query,
    conversation: query.data?.conversation ?? null,
    messages: query.data?.messages.data ?? [],
    suggestions: query.data?.suggestions ?? [],
    connectionStatus,
    reply: replyMutation.mutateAsync,
    isSending: replyMutation.isPending,
    sendError: replyMutation.error,
    markRead: (conversationIdToRead: number) => markReadMutation.mutate(conversationIdToRead),
    closeConversation: (conversationIdToClose: number) => closeMutation.mutateAsync(conversationIdToClose),
    reopenConversation: (conversationIdToReopen: number) => reopenMutation.mutateAsync(conversationIdToReopen),
  }
}

/* ------------------------------------------------------------------ */
/* Shared: marking the displayed conversation as read                  */
/* ------------------------------------------------------------------ */

/**
 * Mark the conversation currently on screen as read.
 *
 * Opening a thread counts as reading it — the same rule as the support chat —
 * so a query reached by a deep link or auto-selected from the list clears its
 * unread badge instead of waiting for a row click. Each conversation is marked
 * once per visit: a fresh message arriving while it is already on screen must
 * not mark itself read before the reader has actually seen it.
 */
export function useMarkThreadReadOnOpen(
  activeId: number | null,
  conversations: readonly SupportConversation[],
  field: 'unread_for_admin' | 'unread_for_vendor' | 'unread_count',
  markRead: (id: number) => void,
): void {
  const queryClient = useQueryClient()
  const markedIds = useRef<Set<number>>(new Set())

  useEffect(() => {
    if (activeId === null || markedIds.current.has(activeId)) return

    const row = conversations.find((conversation) => conversation.id === activeId)
    if (!row || (row[field] ?? 0) <= 0) return

    markedIds.current.add(activeId)
    markRead(activeId)
    // Clear the matching notification badge now that the thread is open, instead
    // of waiting for the next poll.
    void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] })
    void queryClient.invalidateQueries({ queryKey: ['vendor', 'notifications'] })
  }, [activeId, conversations, field, markRead, queryClient])
}

/**
 * Adopt a `?open=<conversation_id>` deep link — where notification redirects
 * land when they point at a query inbox — by selecting the thread once and
 * then stripping the param so later in-page navigation doesn't re-trigger it.
 */
export function useThreadOpenParam(setSelectedId: (id: number) => void): void {
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const open = Number(searchParams.get('open'))
    if (!Number.isFinite(open) || open <= 0) return

    setSelectedId(open)
    const next = new URLSearchParams(searchParams)
    next.delete('open')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, setSelectedId])
}
