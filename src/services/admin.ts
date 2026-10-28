import api from './api'
import type {
  Address,
  ApiResponse,
  Category,
  Coupon,
  CouponPayload,
  CouponStats,
  CouponUsageHistoryItem,
  Notification,
  Order,
  OrderItem,
  Paginated,
  Product,
  Review,
  ShipmentDetail,
  ShipmentEvent,
  User,
  Vendor,
  VendorOrder,
  VendorOrderStatusValue,
  Wallet,
  WalletTransaction,
  WalletTransactionDetail,
} from '@/types'

export interface DashboardStats {
  customer_count: number
  vendor_count: number
  active_vendors: number
  pending_vendors: number
  product_count: number
  pending_products: number
  order_count: number
  revenue: number
  total_commission: number
  vendor_payable: number
  refunds: number
  returns: number
  wallet_balance: number
  payout_requests: number
  today_orders: number
  today_sales: number
}

export interface SalesPoint {
  date: string
  orders: number
  sales: number
}

export interface CommissionPoint {
  date: string
  commission: number
}

export interface TopVendor {
  vendor_id: number
  name: string
  logo: string | null
  sales: number
}

export interface TopCategory {
  category_id: number
  name: string
  sales: number
}

export interface TopProduct {
  product_id: number
  name: string
  image: string | null
  sales: number
  units_sold: number
}

export interface RecentOrder {
  id: number
  order_number: string
  customer_name: string
  total: number
  order_status: string
  payment_status: string
  created_at: string
}

export interface AdminDashboardData extends DashboardStats {
  sales_series: SalesPoint[]
  commission_series: CommissionPoint[]
  top_vendors: TopVendor[]
  top_categories: TopCategory[]
  top_products: TopProduct[]
  recent_orders: RecentOrder[]
}

export interface VendorDetail extends Vendor {
  user?: Pick<User, 'id' | 'name' | 'email' | 'phone' | 'is_active'>
  wallet?: {
    available_balance: number
    pending_balance: number
    held_balance: number
    paid_total: number
    currency: string
  } | null
  product_count?: number
  order_count?: number
  total_sales?: number
  documents?: string[] | null
  pan?: string | null
  gstin?: string | null
  created_at?: string
  bank?: {
    account_name: string | null
    account_number: string | null
    ifsc: string | null
    bank_name: string | null
  } | null
  payouts?: unknown[]
}

export interface UserDetail {
  user: User
  orders: unknown[]
  order_count: number
  total_spent: number
  reviews: Review[]
  reviews_count: number
  reviews_average_rating: number
}

/* ----------------------------- Dashboard ----------------------------- */

export async function getAdminDashboard(days = 30): Promise<AdminDashboardData> {
  const res = await api.get<ApiResponse<AdminDashboardData>>('/admin/dashboard', { params: { days } })
  return res.data
}

/* ------------------------------- Wallet ------------------------------- */

export async function getAdminWallet(): Promise<Wallet> {
  const res = await api.get<ApiResponse<Wallet>>('/admin/wallet')
  return res.data
}

export async function getAdminWalletTransactions(
  params: { page?: number; perPage?: number; type?: string; q?: string } = {},
): Promise<Paginated<WalletTransaction>> {
  const res = await api.get<ApiResponse<Paginated<WalletTransaction>>>('/admin/wallet/transactions', {
    params: {
      page: params.page ?? 1,
      per_page: params.perPage ?? 15,
      type: params.type || undefined,
      q: params.q || undefined,
    },
  })
  return res.data
}

export async function getAdminWalletTransaction(id: number): Promise<WalletTransactionDetail> {
  const res = await api.get<ApiResponse<WalletTransactionDetail>>(`/admin/wallet/transactions/${id}`)
  return res.data
}

/* ------------------------------ Payouts ------------------------------ */

export type VendorPayoutStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED'

export interface AdminPayout {
  id: number
  vendor_id: number
  amount: number
  method: string
  account_details: Record<string, string> | null
  status: VendorPayoutStatus
  request_note: string | null
  admin_note: string | null
  requested_at: string | null
  approved_at: string | null
  paid_at: string | null
  rejected_at: string | null
  created_at: string | null
  updated_at: string | null
  vendor?: {
    id: number
    store_name: string
    logo: string | null
    user?: Pick<User, 'id' | 'name' | 'email'>
  }
}

export interface AdminPayoutParams {
  page?: number
  per_page?: number
  status?: VendorPayoutStatus
  created_days?: number
}

export interface AdminCommission {
  id: number
  vendor_id: number
  order_id: number
  vendor_order_id: number
  eligible_amount: number
  discount_amount: number
  commission_rate: number
  commission_amount: number
  net_payable: number
  status: string
  return_window_ends_at: string | null
  settled_at: string | null
  reversed_at: string | null
  reversal_reason: string | null
  created_at: string
  vendor?: {
    id: number
    store_name: string
    logo: string | null
    user?: Pick<User, 'id' | 'name' | 'email'>
  }
  vendorOrder?: { id: number; vendor_order_number: string; status: string; total: number } | null
}

export interface AdminCommissionParams {
  page?: number
  per_page?: number
  status?: string
  vendor_id?: number
  created_days?: number
}

export interface AdminCommissionSummary {
  pending: number
  pending_amount: number
  total_commission: number
  total_net_payable: number
}

export interface AdminCommissionsResponse {
  summary: AdminCommissionSummary
  commissions: Paginated<AdminCommission>
}

export async function getAdminCommissions(
  params: AdminCommissionParams = {},
): Promise<AdminCommissionsResponse> {
  // `admin/commissions` is the commission *rule* settings; the per-order
  // commission ledger lives under settlements.
  const res = await api.get<ApiResponse<AdminCommissionsResponse>>('/admin/settlements', { params })
  return res.data
}

export interface PayoutSummary {
  pending: number
  approved: number
  paid: number
  rejected: number
  pending_amount: number
  total_amount: number
}

export interface AdminPayoutsResponse {
  summary: PayoutSummary
  payouts: Paginated<AdminPayout>
}

export async function getAdminPayouts(params: AdminPayoutParams = {}): Promise<AdminPayoutsResponse> {
  const res = await api.get<ApiResponse<AdminPayoutsResponse>>('/admin/payouts', { params })
  return res.data
}

export async function approvePayout(id: number, note?: string): Promise<AdminPayout> {
  const res = await api.put<ApiResponse<AdminPayout>>(`/admin/payouts/${id}/approve`, { note })
  return res.data
}

export async function markPayoutPaid(id: number, note?: string): Promise<AdminPayout> {
  const res = await api.put<ApiResponse<AdminPayout>>(`/admin/payouts/${id}/mark-paid`, { note })
  return res.data
}

export async function rejectPayout(id: number, note?: string): Promise<AdminPayout> {
  const res = await api.put<ApiResponse<AdminPayout>>(`/admin/payouts/${id}/reject`, { note })
  return res.data
}

/* ------------------------------ Vendors ------------------------------ */

export interface AdminVendorParams {
  page?: number
  per_page?: number
  search?: string
  status?: string
  created_days?: number
}

export async function getAdminVendors(params: AdminVendorParams = {}): Promise<Paginated<Vendor>> {
  const res = await api.get<ApiResponse<Paginated<Vendor>>>('/admin/vendors', { params })
  return res.data
}

export async function getAdminVendor(id: number): Promise<VendorDetail> {
  const res = await api.get<ApiResponse<VendorDetail>>(`/admin/vendors/${id}`)
  return res.data
}

export interface CreateVendorPayload {
  name: string
  email: string
  password: string
  store_name: string
  commission_rate?: number
}

export async function createAdminVendor(data: CreateVendorPayload): Promise<Vendor> {
  const res = await api.post<ApiResponse<Vendor>>('/admin/vendors', data)
  return res.data
}

export async function updateAdminVendor(id: number, data: Record<string, unknown>): Promise<Vendor> {
  const res = await api.put<ApiResponse<Vendor>>(`/admin/vendors/${id}`, data)
  return res.data
}

export async function approveVendor(
  id: number,
  data: { status: string; commission_rate?: number },
): Promise<Vendor> {
  const res = await api.put<ApiResponse<Vendor>>(`/admin/vendors/${id}/approve`, data)
  return res.data
}

export async function activateVendor(id: number): Promise<Vendor> {
  const res = await api.put<ApiResponse<Vendor>>(`/admin/vendors/${id}/activate`)
  return res.data
}

export async function suspendVendor(id: number): Promise<Vendor> {
  const res = await api.put<ApiResponse<Vendor>>(`/admin/vendors/${id}/suspend`)
  return res.data
}

export async function rejectVendor(id: number): Promise<Vendor> {
  const res = await api.put<ApiResponse<Vendor>>(`/admin/vendors/${id}/reject`)
  return res.data
}

export async function deleteAdminVendor(id: number): Promise<void> {
  await api.delete(`/admin/vendors/${id}`)
}

/* ------------------------------- Users ------------------------------- */

export interface AdminUserParams {
  page?: number
  per_page?: number
  search?: string
  role?: string
  active?: boolean
  created_days?: number
}

export async function getAdminUsers(params: AdminUserParams = {}): Promise<Paginated<User>> {
  const res = await api.get<ApiResponse<Paginated<User>>>('/admin/users', { params })
  return res.data
}

export async function getAdminUser(id: number): Promise<UserDetail> {
  const res = await api.get<ApiResponse<UserDetail>>(`/admin/users/${id}`)
  return res.data
}

export async function blockAdminUser(id: number): Promise<User> {
  const res = await api.put<ApiResponse<User>>(`/admin/users/${id}/block`)
  return res.data
}

export async function unblockAdminUser(id: number): Promise<User> {
  const res = await api.put<ApiResponse<User>>(`/admin/users/${id}/unblock`)
  return res.data
}

export async function toggleAdminUserActive(id: number): Promise<User> {
  const res = await api.put<ApiResponse<User>>(`/admin/users/${id}/toggle-active`)
  return res.data
}

/* ------------------------------ Products ------------------------------ */

export interface AdminProductParams {
  page?: number
  per_page?: number
  search?: string
  approval_status?: string
  status?: string
  category_id?: number
  vendor_id?: number
  created_days?: number
  created_from?: string
  created_to?: string
}

export async function getAdminProducts(params: AdminProductParams = {}): Promise<Paginated<Product>> {
  const res = await api.get<ApiResponse<Paginated<Product>>>('/admin/products', { params })
  return res.data
}

export async function getAdminProduct(id: number): Promise<Product> {
  const res = await api.get<ApiResponse<Product>>(`/admin/products/${id}`)
  return res.data
}

export async function approveAdminProduct(id: number): Promise<Product> {
  const res = await api.put<ApiResponse<Product>>(`/admin/products/${id}/approve`)
  return res.data
}

export async function rejectAdminProduct(id: number, reason?: string): Promise<Product> {
  const res = await api.put<ApiResponse<Product>>(`/admin/products/${id}/reject`, { reason })
  return res.data
}

export async function publishAdminProduct(id: number): Promise<Product> {
  const res = await api.put<ApiResponse<Product>>(`/admin/products/${id}/publish`)
  return res.data
}

export async function unpublishAdminProduct(id: number): Promise<Product> {
  const res = await api.put<ApiResponse<Product>>(`/admin/products/${id}/unpublish`)
  return res.data
}

export async function featureAdminProduct(id: number): Promise<Product> {
  const res = await api.put<ApiResponse<Product>>(`/admin/products/${id}/feature`)
  return res.data
}

export async function bestSellerAdminProduct(id: number): Promise<Product> {
  const res = await api.put<ApiResponse<Product>>(`/admin/products/${id}/best-seller`)
  return res.data
}

export async function deleteAdminProduct(id: number): Promise<void> {
  await api.delete(`/admin/products/${id}`)
}

export interface AdminReturnPolicyPayload {
  is_returnable: boolean
  return_days: number | null
  return_policy: string | null
}

export async function updateAdminProductReturnPolicy(
  id: number,
  data: AdminReturnPolicyPayload,
): Promise<Product> {
  const res = await api.put<ApiResponse<Product>>(`/admin/products/${id}/return-policy`, data)
  return res.data
}

/* ------------------------------- Orders ------------------------------- */

export interface AdminOrderParams {
  page?: number
  per_page?: number
  search?: string
  status?: string
  payment_status?: string
  created_days?: number
  created_from?: string
  created_to?: string
}

export interface OrderStatusHistory {
  id: number
  from_status: string
  to_status: string
  actor?: { type: string; name?: string; email?: string } | null
  notes?: string | null
  changed_at: string
}

export interface OrderDetail extends Order {
  razorpay_payment_id?: string | null
  cancelled_at?: string | null
  placed_at?: string
  notes?: string | null
  user?: Pick<User, 'id' | 'name' | 'email' | 'phone'>
  order_address?: Address | null
  status_histories?: OrderStatusHistory[]
  vendor_orders?: unknown[]
}

export async function getAdminOrders(params: AdminOrderParams = {}): Promise<Paginated<Order>> {
  const res = await api.get<ApiResponse<Paginated<Order>>>('/admin/orders', { params })
  return res.data
}

export async function getAdminOrder(id: number): Promise<OrderDetail> {
  const res = await api.get<ApiResponse<OrderDetail>>(`/admin/orders/${id}`)
  return res.data
}

export async function updateAdminOrderStatus(id: number, status: string): Promise<Order> {
  const res = await api.put<ApiResponse<Order>>(`/admin/orders/${id}/status`, { status })
  return res.data
}

/* ------------------------------ Coupons ------------------------------ */

export interface AdminCouponParams {
  search?: string
  type?: string
  is_active?: boolean
  page?: number
  per_page?: number
}

export async function getAdminCoupons(
  params: AdminCouponParams = {},
): Promise<Paginated<Coupon>> {
  const res = await api.get<ApiResponse<Paginated<Coupon>>>('/admin/coupons', { params })
  return res.data
}

export async function getAdminCoupon(id: number): Promise<Coupon> {
  const res = await api.get<ApiResponse<Coupon>>(`/admin/coupons/${id}`)
  return res.data
}

export async function createAdminCoupon(data: CouponPayload): Promise<Coupon> {
  const res = await api.post<ApiResponse<Coupon>>('/admin/coupons', data)
  return res.data
}

export async function updateAdminCoupon(id: number, data: CouponPayload): Promise<Coupon> {
  const res = await api.put<ApiResponse<Coupon>>(`/admin/coupons/${id}`, data)
  return res.data
}

export async function toggleAdminCoupon(id: number): Promise<Coupon> {
  const res = await api.put<ApiResponse<Coupon>>(`/admin/coupons/${id}/toggle`)
  return res.data
}

export async function deleteAdminCoupon(id: number): Promise<void> {
  await api.delete(`/admin/coupons/${id}`)
}

export async function getCouponUsage(id: number): Promise<CouponStats> {
  const res = await api.get<ApiResponse<CouponStats>>(`/admin/coupons/${id}/usage`)
  return res.data
}

export async function getCouponHistory(
  id: number,
  page = 1,
): Promise<Paginated<CouponUsageHistoryItem>> {
  const res = await api.get<ApiResponse<Paginated<CouponUsageHistoryItem>>>(
    `/admin/coupons/${id}/history`,
    { params: { page, per_page: 10 } },
  )
  return res.data
}

/* ----------------------------- Categories ----------------------------- */

export async function getAdminCategories(params?: {
  search?: string
  page?: number
  per_page?: number
}): Promise<Paginated<Category>> {
  const res = await api.get<ApiResponse<Paginated<Category>>>('/admin/categories', { params })
  return res.data
}

export async function createAdminCategory(data: Partial<Category>): Promise<Category> {
  const res = await api.post<ApiResponse<Category>>('/admin/categories', data)
  return res.data
}

export async function updateAdminCategory(id: number, data: Partial<Category>): Promise<Category> {
  const res = await api.put<ApiResponse<Category>>(`/admin/categories/${id}`, data)
  return res.data
}

export async function deleteAdminCategory(id: number): Promise<void> {
  await api.delete(`/admin/categories/${id}`)
}

/* ----------------------------- Returns ------------------------------- */

export type ReturnStatusValue =
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PICKUP_SCHEDULED'
  | 'PICKED_UP'
  | 'RECEIVED'
  | 'INSPECTING'
  | 'APPROVED_FOR_REFUND'
  | 'REFUNDED'
  | 'CLOSED'

export interface AdminReturn {
  id: number
  order_id: number
  order_item_id: number
  user_id: number
  quantity: number
  reason: string | null
  description: string | null
  images: string[] | null
  status: ReturnStatusValue
  status_notes: string | null
  pickup_address_id: number | null
  pickup_scheduled_at: string | null
  picked_up_at: string | null
  received_at: string | null
  inspecting_at: string | null
  approved_for_refund_at: string | null
  refunded_at: string | null
  closed_at: string | null
  pick_created_at: string | null
  created_at: string
  updated_at: string
  user?: Pick<User, 'id' | 'name' | 'email' | 'phone'>
  order?: Pick<Order, 'id' | 'order_number' | 'total' | 'payment_method' | 'created_at'>
  order_item?: Pick<
    OrderItem,
    'id' | 'product_id' | 'product_name' | 'product_image' | 'quantity' | 'unit_price' | 'total'
  >
  pickup_address?: Address | null
  refunds?: AdminRefund[]
}

export interface AdminRefund {
  id: number
  order_id: number
  order_item_id: number
  user_id: number
  product_return_id: number | null
  amount: number | string
  quantity: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INITIATED' | 'COMPLETED'
  method: string | null
  wallet_amount: number | string
  gateway_amount: number | string
  reason: string | null
  razorpay_refund_id: string | null
  processed_at: string | null
  created_at: string
}

export interface AdminReturnParams {
  page?: number
  per_page?: number
  status?: ReturnStatusValue
  order_number?: string
  search?: string
  created_days?: number
}

/**
 * The returns endpoint returns its per-status breakdown alongside the page so the
 * status cards can show whole-range counts rather than counts of the current page.
 */
export type PaginatedReturns = Paginated<AdminReturn> & {
  in_range_total: number
  refunded: number
  by_status: Record<string, number>
}

export interface AdminRefundParams {
  page?: number
  per_page?: number
  status?: string
  created_days?: number
}

export async function getAdminReturns(params: AdminReturnParams = {}): Promise<PaginatedReturns> {
  const res = await api.get<ApiResponse<PaginatedReturns>>('/admin/returns', { params })
  return res.data
}

export async function getAdminReturn(id: number): Promise<AdminReturn> {
  const res = await api.get<ApiResponse<AdminReturn>>(`/admin/returns/${id}`)
  return res.data
}

export async function updateAdminReturnStatus(
  id: number,
  status: ReturnStatusValue,
  notes?: string,
): Promise<AdminReturn> {
  const res = await api.put<ApiResponse<AdminReturn>>(`/admin/returns/${id}/status`, {
    status,
    notes,
  })
  return res.data
}

export async function getAdminRefunds(params: AdminRefundParams = {}): Promise<Paginated<AdminRefund>> {
  const res = await api.get<ApiResponse<Paginated<AdminRefund>>>('/admin/refunds', { params })
  return res.data
}

export async function processAdminRefund(id: number): Promise<{ refund: AdminRefund; refunded_to?: string | null }> {
  const res = await api.post<ApiResponse<{ refund: AdminRefund; refunded_to?: string | null }>>(
    `/admin/refunds/${id}/process`,
  )
  return res.data
}

/* ----------------------------- Shipments ------------------------------ */

export interface AdminShipmentParams {
  page?: number
  per_page?: number
  search?: string
  status?: string
}

export async function getAdminShipments(
  params: AdminShipmentParams = {},
): Promise<Paginated<ShipmentDetail>> {
  const res = await api.get<ApiResponse<Paginated<ShipmentDetail>>>('/admin/shipments', { params })
  return res.data
}

export async function getAdminShipment(id: number): Promise<ShipmentDetail> {
  const res = await api.get<ApiResponse<ShipmentDetail>>(`/admin/shipments/${id}`)
  return res.data
}

export async function getAdminShipmentEvents(id: number): Promise<ShipmentEvent[]> {
  const res = await api.get<ApiResponse<ShipmentEvent[]>>(`/admin/shipments/${id}/events`)
  return res.data
}

export async function scheduleAdminShipmentPickup(
  id: number,
  data: { pickup_date?: string; pickup_time?: string } = {},
): Promise<ShipmentDetail> {
  const res = await api.post<ApiResponse<{ shipment: ShipmentDetail }>>(`/admin/shipments/${id}/pickup`, data)
  return res.data.shipment
}

export async function retryAdminShipment(id: number, weight = 1.0): Promise<ShipmentDetail> {
  const res = await api.post<ApiResponse<{ shipment: ShipmentDetail }>>(`/admin/shipments/${id}/retry`, { weight })
  return res.data.shipment
}

export async function getAdminShipmentLabel(id: number): Promise<string | null> {
  const res = await api.get<ApiResponse<{ label_url: string | null }>>(`/admin/shipments/${id}/label`)
  return res.data.label_url
}

export async function generateAdminShipmentManifest(shipmentIds: number[]): Promise<string | null> {
  const res = await api.post<ApiResponse<{ manifest_url: string | null }>>('/admin/shipments/manifest', {
    shipment_ids: shipmentIds,
  })
  return res.data.manifest_url
}

export async function cancelAdminShipment(id: number): Promise<ShipmentDetail> {
  const res = await api.post<ApiResponse<{ shipment: ShipmentDetail }>>(`/admin/shipments/${id}/cancel`)
  return res.data.shipment
}

/* ------------------------ Shiprocket Settings ------------------------ */

export interface ShiprocketSettings {
  id: number
  enabled: boolean
  environment: 'test' | 'production'
  base_url: string | null
  email: string | null
  password_set: boolean
  token_set: boolean
  webhook_secret_set: boolean
  default_pickup_location: string | null
  pickup_locations: string[]
  base_url_default: string
  webhook_url: string
}

export type ShiprocketSettingsPayload = Partial<
  Pick<
    ShiprocketSettings,
    | 'enabled'
    | 'environment'
    | 'base_url'
    | 'email'
    | 'default_pickup_location'
    | 'pickup_locations'
  >
> & {
  password?: string
  token?: string
  webhook_secret?: string
}

export interface ShiprocketConnectionResult {
  base_url: string
  token_generated: boolean
}

export async function getAdminShiprocketSettings(): Promise<ShiprocketSettings> {
  const res = await api.get<ApiResponse<ShiprocketSettings>>('/admin/shiprockets/settings')
  return res.data
}

export async function updateAdminShiprocketSettings(
  payload: ShiprocketSettingsPayload,
): Promise<ShiprocketSettings> {
  const res = await api.put<ApiResponse<ShiprocketSettings>>('/admin/shiprockets/settings', payload)
  return res.data
}

export async function testAdminShiprocketConnection(): Promise<ShiprocketConnectionResult> {
  const res = await api.post<ApiResponse<ShiprocketConnectionResult>>('/admin/shiprockets/test')
  return res.data
}

export interface ShiprocketPickupLocation {
  pickup_location_id?: number
  pickup_location?: string
  name?: string
  address_line_1?: string
  city?: string
  state?: string
  pincode?: string
  phone?: string
}

export async function getAdminShiprocketPickupLocations(): Promise<ShiprocketPickupLocation[]> {
  const res = await api.get<ApiResponse<{ pickup_locations: ShiprocketPickupLocation[] }>>(
    '/admin/shiprockets/pickup-locations',
  )
  return res.data.pickup_locations
}

/* --------------------------- Vendor Orders ---------------------------- */

export interface AdminVendorOrderParams {
  page?: number
  per_page?: number
  search?: string
  status?: string
  vendor_id?: number
}

export async function getAdminVendorOrders(
  params: AdminVendorOrderParams = {},
): Promise<Paginated<VendorOrder>> {
  const res = await api.get<ApiResponse<Paginated<VendorOrder>>>('/admin/vendor-orders', { params })
  return res.data
}

export async function getAdminVendorOrder(id: number): Promise<VendorOrder> {
  const res = await api.get<ApiResponse<{ vendor_order: VendorOrder }>>(`/admin/vendor-orders/${id}`)
  return res.data.vendor_order
}

export async function updateAdminVendorOrderStatus(
  id: number,
  status: VendorOrderStatusValue,
): Promise<VendorOrder> {
  const res = await api.put<ApiResponse<{ vendor_order: VendorOrder }>>(
    `/admin/vendor-orders/${id}/status`,
    { status },
  )
  return res.data.vendor_order
}

/* ---------------------------- Notifications --------------------------- */

export async function getAdminNotifications(
  page = 1,
  perPage = 15,
  type?: string,
): Promise<Paginated<Notification>> {
  const res = await api.get<ApiResponse<Paginated<Notification>>>('/admin/notifications', {
    params: { page, per_page: perPage, type: type || undefined },
  })
  return res.data
}

export async function getAdminNotificationsUnreadCount(): Promise<{ count: number }> {
  const res = await api.get<ApiResponse<{ count: number }>>('/admin/notifications/unread-count')
  return res.data
}

export async function markAdminNotificationRead(id: string): Promise<Notification> {
  const res = await api.put<ApiResponse<Notification>>(`/admin/notifications/${id}/read`)
  return res.data
}

export async function markAllAdminNotificationsRead(): Promise<void> {
  await api.post('/admin/notifications/read-all')
}

export async function deleteAdminNotification(id: string): Promise<void> {
  await api.delete(`/admin/notifications/${id}`)
}

/* ------------------------------- Reports ------------------------------ */

export type AdminReportType =
  | 'sales'
  | 'orders'
  | 'products'
  | 'vendors'
  | 'customers'
  | 'commission'
  | 'payments'
  | 'refunds'
  | 'returns'
  | 'shipping'
  | 'wallet'
  | 'payouts'

export interface AdminReportFilters {
  from?: string
  to?: string
  vendor_id?: number
  category_id?: number
}

export interface AdminReport {
  summary: Record<string, number>
  items: Record<string, unknown>[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export async function getAdminReport(
  type: AdminReportType,
  filters?: AdminReportFilters,
): Promise<AdminReport> {
  const res = await api.get<ApiResponse<AdminReport>>(`/admin/reports/${type}`, { params: filters })
  return res.data
}

export function getAdminReportExportUrl(type: AdminReportType, filters?: AdminReportFilters): string {
  const params = new URLSearchParams()
  if (filters?.from) params.set('from', filters.from)
  if (filters?.to) params.set('to', filters.to)
  if (filters?.vendor_id) params.set('vendor_id', String(filters.vendor_id))
  if (filters?.category_id) params.set('category_id', String(filters.category_id))
  const qs = params.toString()
  return `/api/v1/admin/reports/${type}/export${qs ? `?${qs}` : ''}`
}