import api from './api'
import type {
  ApiResponse,
  CreateOrderQueryPayload,
  CreateOrderQueryResult,
  CreateProductQueryPayload,
  CreateProductQueryResult,
  Paginated,
  ProductQueriesPayload,
  SendSupportMessageResult,
  SupportConversation,
  SupportInboxCounts,
  SupportInboxPayload,
  SupportMessage,
  VendorOrderQueriesPayload,
  VendorSupportPayload,
} from '@/types'

/* ------------------------------------------------------------------ */
/* Vendor side                                                         */
/* ------------------------------------------------------------------ */

/**
 * The vendor's single support thread. Created on the backend the first time it
 * is opened, so callers never have to handle a "no conversation yet" state.
 */
export async function getVendorSupport(params: {
  per_page?: number
} = {}): Promise<VendorSupportPayload> {
  const res = await api.get<ApiResponse<VendorSupportPayload>>('/vendor/support', {
    params: { per_page: params?.per_page ?? 50 },
  })

  return res.data
}

export async function sendVendorSupportMessage(
  payload: { body: string; skip_bot?: boolean },
): Promise<SendSupportMessageResult> {
  const res = await api.post<ApiResponse<SendSupportMessageResult>>(
    '/vendor/support/messages',
    payload,
  )

  return res.data
}

export async function markVendorSupportRead(): Promise<SupportConversation> {
  const res = await api.post<ApiResponse<{ marked: number; conversation: SupportConversation }>>(
    '/vendor/support/read',
  )

  return res.data.conversation
}

export async function getVendorSupportUnreadCount(): Promise<number> {
  const res = await api.get<ApiResponse<{ unread_count: number }>>('/vendor/support/unread-count')

  return res.data.unread_count
}

/* ------------------------------------------------------------------ */
/* Order queries (vendor side)                                         */
/* ------------------------------------------------------------------ */

/**
 * Every order query the admin has raised with this vendor. Unlike the everyday
 * support chat there is no assistant — every reply goes to a person.
 */
export async function getVendorOrderQueries(params: {
  per_page?: number
} = {}): Promise<VendorOrderQueriesPayload> {
  const res = await api.get<ApiResponse<VendorOrderQueriesPayload>>('/vendor/order-queries', {
    params: { per_page: params?.per_page ?? 20 },
  })

  return res.data
}

export async function getVendorOrderQuery(
  id: number,
  params?: { per_page?: number },
): Promise<{ conversation: SupportConversation; messages: Paginated<SupportMessage> }> {
  const res = await api.get<
    ApiResponse<{ conversation: SupportConversation; messages: Paginated<SupportMessage> }>
  >(`/vendor/order-queries/${id}`, { params: { per_page: params?.per_page ?? 50 } })

  return res.data
}

export async function sendVendorOrderQueryMessage(
  id: number,
  payload: { body: string; image_url?: string },
): Promise<SendSupportMessageResult> {
  const res = await api.post<ApiResponse<SendSupportMessageResult>>(
    `/vendor/order-queries/${id}/messages`,
    payload,
  )

  return res.data
}

export async function markVendorOrderQueryRead(id: number): Promise<SupportConversation> {
  const res = await api.post<ApiResponse<{ marked: number; conversation: SupportConversation }>>(
    `/vendor/order-queries/${id}/read`,
  )

  return res.data.conversation
}

export async function getVendorOrderQueriesUnreadCount(): Promise<number> {
  const res = await api.get<ApiResponse<{ unread_count: number }>>('/vendor/order-queries/unread-count')

  return res.data.unread_count
}

/* ------------------------------------------------------------------ */
/* Product queries (vendor side)                                       */
/* ------------------------------------------------------------------ */

/**
 * Every product query customers have raised about this vendor's products, plus
 * the queries this vendor opened itself. Unlike the everyday support chat there
 * is no assistant — every reply goes to a person, and the vendor answers
 * alongside the admin team.
 */
export async function getVendorProductQueries(params: {
  per_page?: number
} = {}): Promise<ProductQueriesPayload> {
  const res = await api.get<ApiResponse<ProductQueriesPayload>>('/vendor/product-queries', {
    params: { per_page: params?.per_page ?? 20 },
  })

  return res.data
}

/**
 * Start a product query about one of the vendor's own products, addressed to
 * the marketplace team.
 */
export async function createVendorProductQuery(
  payload: CreateProductQueryPayload,
): Promise<CreateProductQueryResult> {
  const res = await api.post<ApiResponse<CreateProductQueryResult>>('/vendor/product-queries', payload)

  return res.data
}

export async function getVendorProductQuery(
  id: number,
  params?: { per_page?: number },
): Promise<{ conversation: SupportConversation; messages: Paginated<SupportMessage> }> {
  const res = await api.get<
    ApiResponse<{ conversation: SupportConversation; messages: Paginated<SupportMessage> }>
  >(`/vendor/product-queries/${id}`, { params: { per_page: params?.per_page ?? 50 } })

  return res.data
}

export async function sendVendorProductQueryMessage(
  id: number,
  payload: { body: string; image_url?: string },
): Promise<SendSupportMessageResult> {
  const res = await api.post<ApiResponse<SendSupportMessageResult>>(
    `/vendor/product-queries/${id}/messages`,
    payload,
  )

  return res.data
}

export async function markVendorProductQueryRead(id: number): Promise<SupportConversation> {
  const res = await api.post<ApiResponse<{ marked: number; conversation: SupportConversation }>>(
    `/vendor/product-queries/${id}/read`,
  )

  return res.data.conversation
}

export async function getVendorProductQueriesUnreadCount(): Promise<number> {
  const res = await api.get<ApiResponse<{ unread_count: number }>>('/vendor/product-queries/unread-count')

  return res.data.unread_count
}

/* ------------------------------------------------------------------ */
/* Customer side                                                       */
/* ------------------------------------------------------------------ */

/**
 * The customer's single support thread. Created on the backend the first time
 * it is opened, so callers never handle a "no conversation yet" state.
 */
export async function getCustomerSupport(params: {
  per_page?: number
} = {}): Promise<VendorSupportPayload> {
  const res = await api.get<ApiResponse<VendorSupportPayload>>('/user/support', {
    params: { per_page: params?.per_page ?? 50 },
  })

  return res.data
}

export async function sendCustomerSupportMessage(
  payload: { body: string; skip_bot?: boolean },
): Promise<SendSupportMessageResult> {
  const res = await api.post<ApiResponse<SendSupportMessageResult>>(
    '/user/support/messages',
    payload,
  )

  return res.data
}

export async function markCustomerSupportRead(): Promise<SupportConversation> {
  const res = await api.post<ApiResponse<{ marked: number; conversation: SupportConversation }>>(
    '/user/support/read',
  )

  return res.data.conversation
}

export async function getCustomerSupportUnreadCount(): Promise<number> {
  const res = await api.get<ApiResponse<{ unread_count: number }>>('/user/support/unread-count')

  return res.data.unread_count
}

/* ------------------------------------------------------------------ */
/* Product queries (customer side)                                     */
/* ------------------------------------------------------------------ */

/**
 * Every product query this customer has opened. Each ask is a fresh thread;
 * the vendor who sells the product and the admin team both read and reply.
 */
export async function getCustomerProductQueries(params: {
  per_page?: number
} = {}): Promise<ProductQueriesPayload> {
  const res = await api.get<ApiResponse<ProductQueriesPayload>>('/user/product-queries', {
    params: { per_page: params?.per_page ?? 20 },
  })

  return res.data
}

export async function getCustomerProductQuery(
  id: number,
  params?: { per_page?: number },
): Promise<{ conversation: SupportConversation; messages: Paginated<SupportMessage> }> {
  const res = await api.get<
    ApiResponse<{ conversation: SupportConversation; messages: Paginated<SupportMessage> }>
  >(`/user/product-queries/${id}`, { params: { per_page: params?.per_page ?? 50 } })

  return res.data
}

export async function sendCustomerProductQueryMessage(
  id: number,
  payload: { body: string; image_url?: string },
): Promise<SendSupportMessageResult> {
  const res = await api.post<ApiResponse<SendSupportMessageResult>>(
    `/user/product-queries/${id}/messages`,
    payload,
  )

  return res.data
}

export async function markCustomerProductQueryRead(id: number): Promise<SupportConversation> {
  const res = await api.post<ApiResponse<{ marked: number; conversation: SupportConversation }>>(
    `/user/product-queries/${id}/read`,
  )

  return res.data.conversation
}

export async function getCustomerProductQueriesUnreadCount(): Promise<number> {
  const res = await api.get<ApiResponse<{ unread_count: number }>>('/user/product-queries/unread-count')

  return res.data.unread_count
}

/**
 * Raise a private query about a product from the product page. Always starts a
 * brand new thread, answered by the seller and the marketplace team together.
 */
export async function createProductQuery(
  payload: CreateProductQueryPayload,
): Promise<CreateProductQueryResult> {
  const res = await api.post<ApiResponse<CreateProductQueryResult>>('/user/product-queries', payload)

  return res.data
}

/* ------------------------------------------------------------------ */
/* Admin side                                                          */
/* ------------------------------------------------------------------ */

export type SupportInboxFilter = 'open' | 'awaiting' | 'closed' | 'all'

/**
 * Which admin inbox an admin-support call is for. The two inboxes are separate
 * pages backed by separate endpoints, so the prefix is threaded through rather
 * than duplicating every function.
 */
const INBOX_PREFIX = {
  VENDOR: '/admin/support',
  CUSTOMER: '/admin/customer-support',
  ORDER_QUERY: '/admin/order-queries',
  PRODUCT_QUERY: '/admin/product-queries',
} as const

export type SupportInboxKind = keyof typeof INBOX_PREFIX

export async function getSupportInbox(
  kind: SupportInboxKind,
  params?: { filter?: SupportInboxFilter; per_page?: number },
): Promise<SupportInboxPayload> {
  const res = await api.get<ApiResponse<SupportInboxPayload>>(INBOX_PREFIX[kind], {
    params: { filter: params?.filter ?? 'open', per_page: params?.per_page ?? 20 },
  })

  return res.data
}

/**
 * Badge totals for the admin sidebar, without the conversation list.
 */
export async function getSupportCounts(kind: SupportInboxKind): Promise<SupportInboxCounts> {
  const res = await api.get<ApiResponse<{ counts: SupportInboxCounts }>>(
    `${INBOX_PREFIX[kind]}/counts`,
  )

  return res.data.counts
}

export async function getSupportConversation(
  kind: SupportInboxKind,
  id: number,
  params?: { per_page?: number },
): Promise<{
  conversation: SupportConversation
  messages: Paginated<SupportMessage>
  /** The same quick-question chips the requester is offered, on customer threads. */
  suggestions: string[]
}> {
  const res = await api.get<
    ApiResponse<{
      conversation: SupportConversation
      messages: Paginated<SupportMessage>
      suggestions: string[]
    }>
  >(`${INBOX_PREFIX[kind]}/${id}`, { params: { per_page: params?.per_page ?? 50 } })

  return res.data
}

export async function sendSupportReply(
  kind: SupportInboxKind,
  id: number,
  payload: { body: string; image_url?: string },
): Promise<SendSupportMessageResult> {
  const res = await api.post<ApiResponse<SendSupportMessageResult>>(
    `${INBOX_PREFIX[kind]}/${id}/messages`,
    payload,
  )

  return res.data
}

export async function markSupportRead(
  kind: SupportInboxKind,
  id: number,
): Promise<SupportConversation> {
  const res = await api.post<ApiResponse<{ marked: number; conversation: SupportConversation }>>(
    `${INBOX_PREFIX[kind]}/${id}/read`,
  )

  return res.data.conversation
}

export async function closeSupportConversation(
  kind: SupportInboxKind,
  id: number,
): Promise<SupportConversation> {
  const res = await api.put<ApiResponse<{ conversation: SupportConversation }>>(
    `${INBOX_PREFIX[kind]}/${id}/close`,
  )

  return res.data.conversation
}

export async function reopenSupportConversation(
  kind: SupportInboxKind,
  id: number,
): Promise<SupportConversation> {
  const res = await api.put<ApiResponse<{ conversation: SupportConversation }>>(
    `${INBOX_PREFIX[kind]}/${id}/reopen`,
  )

  return res.data.conversation
}

/**
 * Raise (or continue) an admin query about an order to the vendor who
 * fulfilled it. Reusing the same order and vendor opens the existing thread.
 */
export async function createOrderQuery(
  payload: CreateOrderQueryPayload,
): Promise<CreateOrderQueryResult> {
  const res = await api.post<ApiResponse<CreateOrderQueryResult>>('/admin/order-queries', payload)

  return res.data
}

/**
 * Start a product query from the marketplace team about any product; it is
 * addressed to the vendor who sells it, exactly like an order query.
 */
export async function createAdminProductQuery(
  payload: CreateProductQueryPayload,
): Promise<CreateProductQueryResult> {
  const res = await api.post<ApiResponse<CreateProductQueryResult>>('/admin/product-queries', payload)

  return res.data
}