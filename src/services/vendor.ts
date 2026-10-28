import api from './api'
import type {
  ApiResponse,
  InventoryTransaction,
  Notification,
  Paginated,
  Product,
  ShipmentDetail,
  ShipmentEvent,
  VendorOrder,
  VendorOrderStatusValue,
  VendorPayout,
  VendorProfileDetail,
  VendorReport,
  VendorReportFilters,
  VendorReportType,
  VendorReturn,
  VendorReturnStatusValue,
  VendorWalletDashboard,
  VendorWalletTransaction,
} from '@/types'

export interface VendorDashboard {
  product_count: number
  order_count: number
  pending_orders: number
  revenue: number
  wallet_balance: number
  recent_orders: unknown[]
}

export interface ProductImageInput {
  url: string
  alt_text?: string | null
  is_primary?: boolean
  sort_order?: number
}

export interface ProductFeeInput {
  name: string
  amount: number | string
}

export interface ProductVideoInput {
  url: string
  provider?: string
  thumbnail_url?: string | null
  sort_order?: number
}

export interface ProductFaqInput {
  question: string
  answer: string
  sort_order?: number
}

export interface ProductVariantInput {
  id?: number
  sku?: string
  barcode?: string
  price?: number
  mrp?: number
  cost_price?: number
  discount?: number
  stock?: number
  status?: 'ACTIVE' | 'INACTIVE'
  weight?: number
  length?: number
  width?: number
  height?: number
  attributes?: Record<string, string>
  images?: string[]
}

export interface ProductPayload {
  category_id?: number
  subcategory_id?: number | null
  brand_id?: number | null
  collection_ids?: number[]
  name: string
  short_description?: string | null
  description?: string | null
  highlights?: string[]
  specifications?: string[]
  manufacturer_info?: {
    manufacturer?: string
    manufacturer_address?: string
    packer?: string
    packer_address?: string
    importer?: string
    importer_address?: string
    country_of_origin?: string
  } | null
  tax_class?: string | null
  gst?: number | null
  hsn_code?: string | null
  price?: number
  mrp?: number | null
  stock?: number
  sku?: string | null
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  featured?: boolean
  best_seller?: boolean
  is_returnable?: boolean
  return_days?: number | null
  return_policy?: string | null
  meta_title?: string | null
  meta_description?: string | null
  meta_keywords?: string | null
  is_active?: boolean
  images?: (string | ProductImageInput)[]
  videos?: ProductVideoInput[]
  variants?: ProductVariantInput[]
  fees?: ProductFeeInput[]
  faqs?: ProductFaqInput[]
}

export interface VendorProductQuery {
  page?: number
  per_page?: number
  search?: string
}

export async function getVendorDashboard(): Promise<VendorDashboard> {
  const res = await api.get<ApiResponse<VendorDashboard>>('/vendor/dashboard')
  return res.data
}

export async function getVendorProducts(params?: VendorProductQuery): Promise<Paginated<Product>> {
  const res = await api.get<ApiResponse<Paginated<Product>>>('/vendor/products', { params })
  return res.data
}

export async function getVendorProduct(id: number): Promise<Product> {
  const res = await api.get<ApiResponse<Product>>(`/vendor/products/${id}`)
  return res.data
}

export async function createVendorProduct(data: ProductPayload): Promise<Product> {
  const res = await api.post<ApiResponse<Product>>('/vendor/products', data)
  return res.data
}

export async function updateVendorProduct(id: number, data: Partial<ProductPayload>): Promise<Product> {
  const res = await api.put<ApiResponse<Product>>(`/vendor/products/${id}`, data)
  return res.data
}

export async function deleteVendorProduct(id: number): Promise<void> {
  await api.delete(`/vendor/products/${id}`)
}

export async function toggleVendorProduct(id: number): Promise<Product> {
  const res = await api.put<ApiResponse<Product>>(`/vendor/products/${id}/toggle`)
  return res.data
}

export async function getVendorInventory(
  productId: number,
  params?: { page?: number; per_page?: number; variant_id?: number; type?: string },
): Promise<Paginated<InventoryTransaction>> {
  const res = await api.get<ApiResponse<Paginated<InventoryTransaction>>>(
    `/vendor/products/${productId}/inventory/transactions`,
    { params },
  )
  return res.data
}

export interface InventoryAdjustPayload {
  variant_id?: number | null
  type: 'ADD' | 'RETURN' | 'DAMAGED'
  quantity: number
  reason?: string
}

export async function adjustVendorInventory(
  productId: number,
  payload: InventoryAdjustPayload,
): Promise<InventoryTransaction> {
  const res = await api.post<ApiResponse<InventoryTransaction>>(
    `/vendor/products/${productId}/inventory/adjust`,
    payload,
  )
  return res.data
}

export interface VendorOrderQuery {
  page?: number
  per_page?: number
  status?: string
  search?: string
}

export async function getVendorOrders(params?: VendorOrderQuery): Promise<Paginated<VendorOrder>> {
  const res = await api.get<ApiResponse<Paginated<VendorOrder>>>('/vendor/orders', { params })
  return res.data
}

export async function getVendorOrder(id: number): Promise<VendorOrder> {
  const res = await api.get<ApiResponse<VendorOrder>>(`/vendor/orders/${id}`)
  return res.data
}

export async function updateVendorOrderStatus(
  id: number,
  status: VendorOrderStatusValue,
): Promise<{ vendor_order: VendorOrder }> {
  const res = await api.put<ApiResponse<{ vendor_order: VendorOrder }>>(
    `/vendor/orders/${id}/status`,
    { status },
  )
  return res.data
}

export async function updateVendorOrderItemStatus(
  orderItemId: number,
  status: VendorOrderStatusValue,
): Promise<{ vendor_order: VendorOrder }> {
  const res = await api.put<ApiResponse<{ vendor_order: VendorOrder }>>(
    `/vendor/order-items/${orderItemId}/status`,
    { status },
  )
  return res.data
}

export interface ShipVendorOrderPayload {
  weight?: number
  courier_id?: number | null
}

export async function shipVendorOrder(
  id: number,
  payload?: ShipVendorOrderPayload,
): Promise<{ shipment: ShipmentDetail }> {
  const res = await api.post<ApiResponse<{ shipment: ShipmentDetail }>>(
    `/vendor/orders/${id}/ship`,
    payload ?? {},
  )
  return res.data
}

/* ---- Returns ---- */

export interface VendorReturnQuery {
  page?: number
  per_page?: number
  status?: string
  search?: string
}

export async function getVendorReturns(params?: VendorReturnQuery): Promise<Paginated<VendorReturn>> {
  const res = await api.get<ApiResponse<Paginated<VendorReturn>>>('/vendor/returns', { params })
  return res.data
}

export async function getVendorReturn(id: number): Promise<VendorReturn> {
  const res = await api.get<ApiResponse<VendorReturn>>(`/vendor/returns/${id}`)
  return res.data
}

export interface VendorReturnStatusPayload {
  status: VendorReturnStatusValue
  notes?: string | null
  auto_refund?: boolean
}

export async function updateVendorReturnStatus(id: number, data: VendorReturnStatusPayload): Promise<VendorReturn> {
  const res = await api.put<ApiResponse<VendorReturn>>(`/vendor/returns/${id}/status`, data)
  return res.data
}

/* ---- Shipments ---- */

export interface VendorShipmentQuery {
  page?: number
  per_page?: number
  status?: string
  search?: string
}

export async function getVendorShipments(
  params?: VendorShipmentQuery,
): Promise<Paginated<ShipmentDetail>> {
  const res = await api.get<ApiResponse<Paginated<ShipmentDetail>>>('/vendor/shipments', { params })
  return res.data
}

export async function getVendorShipment(id: number): Promise<ShipmentDetail> {
  const res = await api.get<ApiResponse<ShipmentDetail>>(`/vendor/shipments/${id}`)
  return res.data
}

export async function getVendorShipmentEvents(id: number): Promise<ShipmentEvent[]> {
  const res = await api.get<ApiResponse<ShipmentEvent[]>>(`/vendor/shipments/${id}/events`)
  return res.data
}

export async function requestVendorShipmentPickup(
  id: number,
  payload?: { pickup_date?: string; pickup_time?: string },
): Promise<{ shipment: ShipmentDetail }> {
  const res = await api.post<ApiResponse<{ shipment: ShipmentDetail }>>(
    `/vendor/shipments/${id}/pickup`,
    payload ?? {},
  )
  return res.data
}

export async function retryVendorShipment(
  id: number,
  payload?: { weight?: number },
): Promise<{ shipment: ShipmentDetail }> {
  const res = await api.post<ApiResponse<{ shipment: ShipmentDetail }>>(
    `/vendor/shipments/${id}/retry`,
    payload ?? {},
  )
  return res.data
}

export async function getVendorShipmentLabel(id: number): Promise<string | null> {
  const res = await api.get<ApiResponse<{ label_url: string | null }>>(`/vendor/shipments/${id}/label`)
  return res.data.label_url
}

export async function generateVendorShipmentManifest(shipmentIds: number[]): Promise<string | null> {
  const res = await api.post<ApiResponse<{ manifest_url: string | null }>>('/vendor/shipments/manifest', {
    shipment_ids: shipmentIds,
  })
  return res.data.manifest_url
}

export async function cancelVendorShipment(id: number): Promise<{ shipment: ShipmentDetail }> {
  const res = await api.post<ApiResponse<{ shipment: ShipmentDetail }>>(`/vendor/shipments/${id}/cancel`)
  return res.data
}

/* ---- Courier rate shopping ---- */

export interface CourierRate {
  courier_id: number | null
  courier_name: string
  rate: number
  cod_available: boolean
  days: number | null
  is_recommended: boolean
}

export interface CourierRates {
  available: boolean
  message: string | null
  recommended_courier_id: number | null
  couriers: CourierRate[]
}

export async function getVendorCourierRates(
  vendorOrderId: number,
  weight = 1.0,
): Promise<CourierRates> {
  const res = await api.get<ApiResponse<CourierRates>>(`/vendor/orders/${vendorOrderId}/couriers`, {
    params: { weight },
  })
  return res.data
}

/* ---- Wallet ---- */

export type VendorWalletBalance = {
  available_balance: number
  pending_balance: number
  held_balance: number
  total_balance: number
  currency: string
  status?: string
}

export async function getVendorWalletDashboard(
  page = 1,
  perPage = 12,
): Promise<VendorWalletDashboard> {
  const res = await api.get<ApiResponse<VendorWalletDashboard>>('/vendor/wallet', {
    params: { page, per_page: perPage },
  })
  return res.data
}

export async function getVendorWalletBalance(): Promise<VendorWalletBalance> {
  const res = await api.get<ApiResponse<VendorWalletBalance>>('/vendor/wallet/balance')
  return res.data
}

export async function getVendorWalletTransactions(
  page = 1,
  perPage = 12,
): Promise<Paginated<VendorWalletTransaction>> {
  const res = await api.get<ApiResponse<Paginated<VendorWalletTransaction>>>(
    '/vendor/wallet/transactions',
    { params: { page, per_page: perPage } },
  )
  return res.data
}

/* ---- Payouts ---- */

export interface VendorPayoutQuery {
  page?: number
  per_page?: number
}

export async function getVendorPayouts(params?: VendorPayoutQuery): Promise<Paginated<VendorPayout>> {
  const res = await api.get<ApiResponse<Paginated<VendorPayout>>>('/vendor/payouts', { params })
  return res.data
}

export async function getVendorPayout(id: number): Promise<VendorPayout> {
  const res = await api.get<ApiResponse<VendorPayout>>(`/vendor/payouts/${id}`)
  return res.data
}

export interface RequestVendorPayoutPayload {
  amount: number
  method?: string
  account_details?: Record<string, unknown>
  note?: string
}

export async function requestVendorPayout(payload: RequestVendorPayoutPayload): Promise<VendorPayout> {
  const res = await api.post<ApiResponse<VendorPayout>>('/vendor/payouts', payload)
  return res.data
}

/* ---- Reports ---- */

export async function getVendorReport(
  type: VendorReportType,
  filters?: VendorReportFilters,
): Promise<VendorReport> {
  const res = await api.get<ApiResponse<VendorReport>>(`/vendor/reports/${type}`, {
    params: filters,
  })
  return res.data
}

export function getVendorReportExportUrl(type: VendorReportType, filters?: VendorReportFilters): string {
  const params = new URLSearchParams()
  if (filters?.from) params.set('from', filters.from)
  if (filters?.to) params.set('to', filters.to)
  if (filters?.category_id) params.set('category_id', String(filters.category_id))
  const qs = params.toString()
  return `/api/v1/vendor/reports/${type}/export${qs ? `?${qs}` : ''}`
}

/* ---- Profile ---- */

export interface UpdateVendorProfilePayload {
  store_name?: string
  description?: string | null
  logo?: string | null
  banner?: string | null
  address_line1?: string
  address_line2?: string | null
  city?: string
  state?: string
  country?: string
  pincode?: string
  gstin?: string | null
}

export async function getVendorProfile(): Promise<VendorProfileDetail> {
  const res = await api.get<ApiResponse<VendorProfileDetail>>('/vendor/profile')
  return res.data
}

export async function updateVendorProfile(
  payload: UpdateVendorProfilePayload,
): Promise<VendorProfileDetail> {
  const res = await api.put<ApiResponse<VendorProfileDetail>>('/vendor/profile', payload)
  return res.data
}

/* ---- Notifications ---- */

export async function getVendorNotifications(
  page = 1,
  perPage = 15,
): Promise<Paginated<Notification>> {
  const res = await api.get<ApiResponse<Paginated<Notification>>>('/vendor/notifications', {
    params: { page, per_page: perPage },
  })
  return res.data
}

export async function getVendorNotificationsUnreadCount(): Promise<{ count: number }> {
  const res = await api.get<ApiResponse<{ count: number }>>('/vendor/notifications/unread-count')
  return res.data
}

export async function markVendorNotificationRead(id: string): Promise<Notification> {
  const res = await api.put<ApiResponse<Notification>>(`/vendor/notifications/${id}/read`)
  return res.data
}

export async function markAllVendorNotificationsRead(): Promise<void> {
  await api.post('/vendor/notifications/read-all')
}

export async function deleteVendorNotification(id: string): Promise<void> {
  await api.delete(`/vendor/notifications/${id}`)
}
