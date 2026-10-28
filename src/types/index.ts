export type Role = 'SUPER_ADMIN' | 'VENDOR' | 'CUSTOMER'

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
  errors: Record<string, string[]> | null
}

export interface Paginated<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ProductFacetValue {
  value: string
  count: number
}

export interface ProductFacetAttribute {
  name: string
  values: ProductFacetValue[]
}

export interface ProductFacetCategory {
  id: number
  name: string
  slug: string
  count: number
}

export interface ProductFacets {
  brands: ProductFacetCategory[]
  categories: ProductFacetCategory[]
  subcategories: ProductFacetCategory[]
  min_price: number
  max_price: number
  attributes: ProductFacetAttribute[]
}

export interface ProductListResponse extends Paginated<Product> {
  facets?: ProductFacets
}

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  role: Role
  avatar: string | null
  is_active: boolean
  created_at: string
  vendor?: Vendor
  wallet?: Wallet
}

export interface Vendor {
  id: number
  user_id: number
  store_name: string
  slug: string
  description: string | null
  logo: string | null
  banner: string | null
  address_line1?: string | null
  address_line2?: string | null
  city: string | null
  state: string | null
  country: string | null
  pincode: string | null
  gstin?: string | null
  pan?: string | null
  commission_rate: number
  shipping_charge?: number | null
  free_shipping_threshold?: number | null
  is_approved: boolean
  status: string
  rating_avg?: number | null
  rating_count?: number
  products_count?: number
  bank_account_name?: string | null
  bank_account_number?: string | null
  bank_ifsc?: string | null
  bank_name?: string | null
  upi_id?: string | null
  created_at?: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  parent_id: number | null
  icon: string | null
  image: string | null
  sort_order: number
  is_active: boolean
  status: string
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
  children_count?: number
  products_count?: number
  parent?: Category
  children?: Category[]
}

/**
 * A card in the "Featured Categories" homepage section. The admin may pin a
 * category and/or override the image, heading, caption and link per card.
 */
export interface FeaturedCategoryCard {
  id: number | null
  name: string
  slug: string | null
  parent_id?: number | null
  image: string | null
  title?: string | null
  subtitle?: string | null
  url?: string | null
}

/**
 * A tile in the homepage "Categories" ring. Editor-owned tiles carry an uploaded
 * image, heading and description; category-backed tiles fall back to the category
 * name/image and derive their link from the slug.
 */
export interface HomeCategoryCard {
  id: number | null
  name: string
  slug: string | null
  image: string | null
  title?: string | null
  description?: string | null
  url?: string | null
  products_count?: number | null
}

export interface Brand {
  id: number
  name: string
  slug: string
  logo: string | null
  description: string | null
  is_active: boolean
  category_ids?: number[]
  categories?: Category[]
  products_count?: number
  meta_title: string | null
  meta_description: string | null
  created_at: string
  updated_at: string
}

export interface Collection {
  id: number
  name: string
  slug: string
  description: string | null
  image: string | null
  banner_image: string | null
  gender: 'unisex' | 'male' | 'female' | 'kids'
  is_active: boolean
  sort_order: number
  product_ids?: number[]
  products_count?: number
  meta_title: string | null
  meta_description: string | null
  created_at: string
  updated_at: string
}

export type AttributeType = 'SELECT' | 'RADIO' | 'BUTTON' | 'COLOR'

export interface Attribute {
  id: number
  name: string
  slug: string
  type: AttributeType
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  values_count?: number
  values?: AttributeValue[]
}

export interface AttributeValue {
  id: number
  attribute_id: number
  value: string
  slug: string
  swatch_color: string | null
  swatch_image: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  attribute?: Attribute
}

export interface Color {
  id: number
  name: string
  slug: string
  hex_code: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SizeGroup {
  id: number
  name: string
  slug: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  sizes_count?: number
  sizes?: Size[]
}

export interface Size {
  id: number
  size_group_id: number
  name: string
  slug: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  group?: SizeGroup
}

export interface ProductImage {
  id: number
  product_id: number
  url: string
  alt_text: string | null
  sort_order: number
  is_primary: boolean
}

export interface ProductVideo {
  id: number
  product_id: number
  url: string
  provider: string
  thumbnail_url: string | null
  sort_order: number
}

export interface CatalogListParams {
  page?: number
  per_page?: number
  search?: string
  is_active?: boolean
  gender?: string
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
}

export interface ProductManufacturerInfo {
  manufacturer?: string
  manufacturer_address?: string
  packer?: string
  packer_address?: string
  importer?: string
  importer_address?: string
  country_of_origin?: string
}

export interface ProductFee {
  id: number
  name: string
  amount: number
}

export interface Product {
  id: number
  vendor_id: number
  category_id: number
  brand_id: number | null
  subcategory_id: number | null
  collection_ids?: number[]
  name: string
  slug: string
  short_description: string | null
  description: string | null
  highlights: string[]
  specifications: string[] | Record<string, string>
  manufacturer_info: ProductManufacturerInfo | null
  tax_class: string | null
  gst: number | null
  hsn_code: string | null
  price: number
  mrp: number | null
  discount_percent: number
  stock: number
  available_stock: number
  sku: string | null
  images: string[]
  attributes: Record<string, string>
  is_active: boolean
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  approval_status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
  featured: boolean
  best_seller: boolean
  is_returnable: boolean
  return_days: number | null
  return_policy: string | null
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
  rejected_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  approved_at: string | null
  rating?: {
    average: number | null
    count: number
  }
  vendor?: Vendor
  category?: Category
  subcategory?: Category
  brand?: Brand
  collections?: Collection[]
  videos?: ProductVideo[]
  variants?: ProductVariant[]
  fees?: ProductFee[]
  faqs?: ProductFaq[]
}

export interface ProductFaq {
  id: number
  product_id: number
  question: string
  answer: string
  sort_order: number
}

export interface ProductVariant {
  id: number
  product_id: number
  sku: string | null
  barcode: string | null
  price: number
  mrp: number | null
  cost_price: number | null
  discount: number
  stock: number
  reserved_stock: number
  available_stock: number
  weight: number | null
  length: number | null
  width: number | null
  height: number | null
  status: 'ACTIVE' | 'INACTIVE'
  attributes: Record<string, string>
  images: string[]
}

export interface InventoryTransaction {
  id: number
  product_id: number
  product_variant_id: number | null
  type: 'ADD' | 'RETURN' | 'DAMAGED'
  quantity: number
  stock_before: number
  stock_after: number
  reason: string | null
  reference_type: string | null
  reference_id: number | null
  created_by: number | null
  created_at: string
  variant?: ProductVariant
}

export interface CartItem {
  id: number
  product_id: number
  product_variant_id: number | null
  quantity: number
  unit_price: number
  mrp: number | null
  unit_discount: number
  discount: number
  tax: number
  tax_rate: number
  subtotal: number
  fees: ProductFee[]
  fees_total: number
  available_stock: number
  product?: Product
  vendor?: Vendor
  variant?: ProductVariant
}

export interface CartVendorGroup {
  vendor_id: number
  vendor: Vendor | null
  items: CartItem[]
  item_count: number
  subtotal: number
  discount: number
  tax: number
  fees_total: number
  shipping: number
  coupon_discount: number
  cod_charge: number
  total: number
}

export interface Cart {
  id: number
  vendor_groups: CartVendorGroup[]
  items: CartItem[]
  item_count: number
  subtotal: number
  discount: number
  coupon_discount: number
  tax: number
  fees_total: number
  shipping: number
  cod_charge: number
  wallet_amount: number
  grand_total: number
  total: number
  savings: number
  messages: string[]
}

export interface CartTotals {
  subtotal: number
  discount: number
  coupon_discount: number
  tax: number
  fees_total: number
  shipping: number
  cod_charge: number
  wallet_amount: number
  grand_total: number
  total: number
  savings: number
  item_count: number
}

export interface WishlistItem {
  id: number
  product: Product
  price_at_add: string | null
  notify_price_drops: boolean
  notify_back_in_stock: boolean
  added_at: string
}

export interface WishlistNotification {
  id: number
  type: 'price_drop' | 'back_in_stock'
  old_price: string | null
  new_price: string | null
  is_read: boolean
  created_at: string
  product: {
    id: number
    name: string
    images: string[]
  } | null
}

export interface Address {
  id: number
  type: string
  name: string
  phone: string
  address_line1: string
  address_line2: string | null
  landmark: string | null
  city: string
  state: string
  country: string
  pincode: string
  is_default: boolean
}

export interface OrderItem {
  id: number
  product_id: number
  vendor_id: number
  product_name: string
  product_image: string | null
  unit_price: number
  quantity: number
  total: number
  fees_total: number
  fees: ProductFee[]
  commission_rate: number
  commission_amount: number
  status: string
  return_policy?: {
    is_returnable: boolean
    return_days: number | null
    return_policy: string | null
  } | null
  has_active_return?: boolean
  vendor?: Vendor
}

export interface Order {
  id: number
  order_number: string
  subtotal: number
  discount: number
  tax: number
  fees_total: number
  shipping_charge: number
  cod_charge: number
  wallet_amount: number
  total: number
  order_status: string
  payment_status: string
  payment_method: string | null
  razorpay_order_id: string | null
  paid_at: string | null
  created_at: string
  items: OrderItem[]
  shipping_address?: Address
  shipment?: ShipmentDetail | null
  user?: { id: number; name: string; email: string }
}

export type MyReturnStatusValue = VendorReturnStatusValue

export interface MyReturn {
  id: number
  order_id: number
  order_item_id: number
  user_id: number
  quantity: number
  reason: string | null
  description: string | null
  images: string[] | null
  status: MyReturnStatusValue
  status_notes: string | null
  pickup_address_id: number | null
  pickup_scheduled_at: string | null
  picked_up_at: string | null
  received_at: string | null
  inspecting_at: string | null
  approved_for_refund_at: string | null
  refunded_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  order_item?: Pick<OrderItem, 'id' | 'product_id' | 'product_name' | 'product_image' | 'quantity' | 'unit_price' | 'total'>
  order?: Pick<Order, 'id' | 'order_number' | 'total' | 'created_at'>
}

export interface Shipment {
  id: number
  order_id: number
  provider: string
  tracking_number: string | null
  status: string
  charges: number
  weight: number | null
  courier_name: string | null
  shipped_at: string | null
  delivered_at: string | null
  created_at?: string
}

export interface Coupon {
  id: number
  vendor_id: number | null
  code: string
  type: 'PERCENTAGE' | 'FIXED'
  value: number
  min_amount: number
  max_discount: number | null
  starts_at: string | null
  expires_at: string | null
  usage_limit: number | null
  per_user_limit: number | null
  first_order_only: boolean
  used_count: number
  is_active: boolean
  product_ids?: number[]
  category_ids?: number[]
  brand_ids?: number[]
  vendor_ids?: number[]
}

export interface ProductOffer {
  id: number
  code: string
  type: 'PERCENTAGE' | 'FIXED'
  value: number
  min_amount: number | null
  max_discount: number | null
  first_order_only: boolean
  starts_at: string | null
  expires_at: string | null
}

export interface CouponPayload extends Partial<Coupon> {
  vendor_id?: number | null
}

export interface CouponUsageHistoryItem {
  id: number
  discount_amount: number
  user: { id: number; name: string; email: string } | null
  order_number: string | null
  created_at: string
}

export interface CouponStats {
  coupon: Coupon
  redeemed_count: number
  distinct_users: number
  total_discount: number
  usage_limit: number | null
  per_user_limit: number | null
  remaining: number | null
  first_redeemed_at: string | null
  latest_redeemed_at: string | null
}

export interface Wallet {
  id: number
  currency: string
  available_balance: number
  pending_balance: number
  total_balance: number
  status: string
}

export type WalletTransactionTypeValue =
  | 'RECHARGE'
  | 'ORDER_PAYMENT'
  | 'CREDIT'
  | 'DEBIT'
  | 'REFUND'
  | 'ADJUSTMENT'
  | 'COMMISSION'
  | 'WITHDRAWAL'
  | 'ORDER_PAYOUT'

export interface WalletTransaction {
  id: number
  wallet_id: number
  type: WalletTransactionTypeValue
  amount: number
  balance_before: number
  balance_after: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  description: string | null
  reference_type: string | null
  reference_id: number | null
  created_at: string
}

export interface WalletTransactionDetail extends WalletTransaction {
  wallet: Wallet
  reference: {
    type: string
    label: string
    summary: string
  } | null
}

export interface WalletRechargeResponse {
  razorpay: {
    order_id: string
    amount: number
    currency: string
    key: string
  }
}

export interface PaymentMethodOption {
  value: 'wallet' | 'razorpay' | 'cod'
  label: string
  enabled: boolean
}

export interface PaymentOptions {
  currency: string
  methods: PaymentMethodOption[]
  wallet: { enabled: boolean }
  razorpay: { enabled: boolean }
  cod: {
    enabled: boolean
    min_amount: number
    max_amount: number | null
    fee: number
  }
  free_delivery: {
    threshold: number | null
  }
}

export interface PaymentSettings {
  id: number
  razorpay_enabled: boolean
  cod_enabled: boolean
  wallet_enabled: boolean
  razorpay_key_id: string | null
  razorpay_key_secret_set: boolean
  razorpay_webhook_secret_set: boolean
  razorpay_mode: string
  cod_min_amount: number
  cod_max_amount: number | null
  cod_fee: number
  free_delivery_threshold: number | null
  currency: string
  created_at?: string
  updated_at?: string
}

export interface ReviewUser {
  id: number
  name: string
  avatar: string | null
}

export interface Review {
  id: number
  product_id: number
  vendor_id: number | null
  rating: number
  title: string | null
  body: string | null
  images: string[]
  is_verified: boolean
  is_approved: boolean
  is_hidden: boolean
  reported_at: string | null
  report_reason: string | null
  created_at: string
  updated_at: string
  user?: ReviewUser
  product?: Pick<Product, 'id' | 'name' | 'images'>
  vendor?: {
    id: number
    store_name: string
  } | null
}

export interface ReviewPayload {
  product_id?: number
  rating: number
  title?: string
  body?: string
  images?: string[]
}

export interface ReviewStats {
  total: number
  average_rating: number
  approved: number
  pending: number
  hidden: number
  reported: number
  rating_distribution: Record<number, number>
}

export interface VendorReview {
  id: number
  vendor_id: number
  rating: number
  title: string | null
  body: string | null
  is_verified: boolean
  is_approved: boolean
  is_hidden: boolean
  reported_at: string | null
  report_reason: string | null
  created_at: string
  updated_at: string
  user?: ReviewUser
  vendor?: Pick<Vendor, 'id' | 'store_name'>
}

export interface VendorReviewPayload {
  vendor_id: number
  rating: number
  title?: string
  body?: string
}

export interface ProductAnswer {
  id: number
  answer: string
  vendor: { id: number; store_name: string } | null
  created_at: string
}

export interface ProductQuestion {
  id: number
  product_id: number
  question: string
  is_answered: boolean
  is_hidden: boolean
  reported_at: string | null
  report_reason: string | null
  created_at: string
  updated_at: string
  user?: ReviewUser
  product?: Pick<Product, 'id' | 'name'>
  answers?: ProductAnswer[]
  answers_count?: number
}

export interface ProductQuestionPayload {
  question: string
}

export interface ProductAnswerPayload {
  answer: string
}

/* -------------------------- Vendor panel ----------------------------- */

export type VendorOrderStatusValue =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REFUNDED'
  | 'CANCELLED'

export interface OrderStatusHistory {
  id: number
  from_status: string | null
  to_status: string | null
  actor?: { type: string; name?: string; email?: string } | null
  notes: string | null
  changed_at: string
}

export interface VendorOrder {
  id: number
  vendor_order_number: string
  order_id: number
  vendor?: Vendor
  subtotal: number
  discount: number
  tax: number
  fees_total: number
  shipping_charge: number
  cod_charge: number
  wallet_amount: number
  total: number
  status: VendorOrderStatusValue
  status_label: string
  items?: OrderItem[]
  shipment?: ShipmentDetail | null
  status_histories?: OrderStatusHistory[]
  order?: {
    id: number
    order_number: string
    customer?: { id: number; name: string; email: string } | null
    payment_method: string | null
    payment_status: string
    order_status: string
    placed_at: string
    order_address?: Address | null
    status_histories?: OrderStatusHistory[]
  }
  confirmed_at: string | null
  packed_at: string | null
  ready_to_ship_at: string | null
  shipped_at: string | null
  out_for_delivery_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

export interface ShipmentEvent {
  id: number
  shipment_id: number
  status: string
  status_label: string | null
  location: string | null
  description: string | null
  is_webhook: boolean
  occurred_at: string
}

export interface ShipmentDetail extends Shipment {
  vendor_order_id: number
  shiprocket_order_id: string | null
  shipment_id: string | null
  tracking_url: string | null
  courier_id: string | null
  pickup_location: string | null
  picker: string | null
  pickup_status: string | null
  pickup_status_label: string | null
  status_label: string | null
  last_event: string | null
  external_status: string | null
  error_message: string | null
  retry_count: number
  label_url: string | null
  manifest_url: string | null
  pickup_requested_at: string | null
  events: ShipmentEvent[]
  order?: Order
  vendor_order?: VendorOrder
}

export type VendorReturnStatusValue =
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

export interface VendorReturn {
  id: number
  order_id: number
  order_item_id: number
  user_id: number
  quantity: number
  reason: string | null
  description: string | null
  images: string[] | null
  status: VendorReturnStatusValue
  status_notes: string | null
  pickup_address_id: number | null
  pickup_scheduled_at: string | null
  picked_up_at: string | null
  received_at: string | null
  inspecting_at: string | null
  approved_for_refund_at: string | null
  refunded_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  user?: Pick<User, 'id' | 'name' | 'email'>
  order?: Pick<Order, 'id' | 'order_number' | 'total' | 'payment_method' | 'created_at'>
  order_item?: Pick<
    OrderItem,
    'id' | 'product_id' | 'product_name' | 'product_image' | 'quantity' | 'unit_price' | 'total'
  >
  pickup_address?: Address | null
  refunds?: Array<{
    id: number
    status: string
    method?: string | null
    amount: number | string
    created_at?: string
  }>
}

export type VendorPayoutStatusValue = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED'

export interface VendorPayout {
  id: number
  vendor_id: number
  amount: number
  method: string
  account_details: Record<string, unknown> | null
  status: VendorPayoutStatusValue
  request_note: string | null
  admin_note: string | null
  requested_at: string
  approved_at: string | null
  paid_at: string | null
  rejected_at: string | null
  created_at: string
}

export interface VendorWalletDashboard {
  wallet: {
    available_balance: number
    pending_balance: number
    held_balance: number
    paid_total: number
    total_balance: number
    currency: string
  }
  pending_settlement: number
  transactions: Paginated<VendorWalletTransaction>
}

export interface VendorWalletTransaction extends WalletTransaction {
  reference?: { type: string; label: string | null; summary: string | null }
}

export interface VendorReport {
  summary: Record<string, number>
  items: Record<string, unknown>[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface VendorProfileDetail extends Vendor {
  user?: Pick<User, 'id' | 'name' | 'email' | 'phone' | 'is_active'>
  address_line1: string | null
  address_line2: string | null
  gstin: string | null
  shipping_charge: number
  free_shipping_threshold: number | null
}

export type VendorReportType =
  | 'sales'
  | 'orders'
  | 'products'
  | 'commission'
  | 'wallet'
  | 'payouts'
  | 'returns'

export interface VendorReportFilters {
  from?: string
  to?: string
  category_id?: number
  limit?: number
  page?: number
  by_day?: boolean
}

export interface Notification {
  id: string
  type: string | null
  title: string | null
  message: string | null
  meta: Record<string, unknown>
  read_at: string | null
  created_at: string
}

/* -------------------------- Homepage ----------------------------------- */

export type HomeSectionType =
  | 'HERO'
  | 'PERSONALIZATION'
  | 'VALUE_PROPS'
  | 'MINI_BANNERS'
  | 'CATEGORIES'
  | 'BEST_SELLERS'
  | 'FEATURED_CATEGORIES'
  | 'EDITORS_PICKS'
  | 'SPLIT_COLLAGE'
  | 'IMAGE_BANNER'
  | 'TEXT_BANNER'
  | 'VIDEO_BANNER'
  | 'PRODUCT_CAROUSEL'
  | 'INSTAGRAM_DIARIES'
  | 'TRENDING_STYLES'
  | 'ICON_INFO'
  | 'VISIT_STORES'
  | 'STORE_LOCATIONS'
  | 'TESTIMONIALS'
  | 'RICH_TEXT'
  | 'FAQ'
  | 'VENDOR_STORES'

export interface HomeValueProp {
  icon: string
  title: string
  description: string
}

export interface HomeSplitCollageContent {
  eyebrow: string
  heading: string
  description: string
  video: string
  poster: string
  images: string[]
  button_text: string
  button_url: string
  media_position: 'left' | 'right'
}

export interface HomeImageBannerContent {
  image: string
  image_mobile: string
  alt: string
  link_url: string
}

/** KALKI "Shop With A Stylist" band: optional background image + centred text + one button. */
export interface HomeTextBannerContent {
  image: string
  alt: string
  description: string
  button_text: string
  button_url: string
}

/**
 * KALKI "bridal wedding dresses" top banner: an autoplaying video with a bottom-anchored
 * headline (section title) + description and one CTA overlaid on it. `video_mobile` is an
 * optional portrait clip swapped in below 750px, like KALKI's separate mobile video.
 */
export interface HomeVideoBannerContent {
  video: string
  video_mobile: string
  poster: string
  description: string
  button_text: string
  button_url: string
}

/**
 * KALKI "HANDCRAFTED WITH LOVE" (`List_collections_template_new`): a cream box with
 * a left text column (heading + subtitle from the section columns, plus a black
 * uppercase "Shop Now" button) and an autoplaying carousel of portrait 5:7 product
 * cards. Each card is admin-managed: image, product name, price and destination.
 */
export interface HomeProductCarouselItem {
  image: string
  title: string
  price: string
  url: string
}

export interface HomeProductCarouselContent {
  button_text: string
  button_url: string
  items: HomeProductCarouselItem[]
}

export interface HomeInstagramDiaryItem {
  image: string
  video: string
  poster: string
  caption: string
  permalink: string
  likes: string
  comments: string
}

export interface HomeInstagramDiariesContent {
  heading: string
  handle: string
  avatar: string
  items: HomeInstagramDiaryItem[]
  button_text: string
  button_url: string
}

export interface HomeTrendingStyleItem {
  image: string
  video: string
  title: string
  url: string
}

export interface HomeTrendingStylesContent {
  heading: string
  items: HomeTrendingStyleItem[]
}

export interface HomePersonalizationContent {
  button_text: string
  button_url: string
}

export interface HomeIconInfoItem {
  icon: string
  title: string
  description: string
  url: string
}

export interface HomeIconInfoContent {
  items: HomeIconInfoItem[]
}

export interface HomeVisitStoresContent {
  eyebrow: string
  title: string
  description: string
  button_text: string
  button_url: string
}

export interface HomeStoreLocationItem {
  image: string
  name: string
  button_text: string
  button_url: string
  secondary_button_text: string
  secondary_button_url: string
}

export interface HomeStoreLocationsContent {
  heading: string
  items: HomeStoreLocationItem[]
}

/** Free-form HTML block written with the admin rich text editor. */
export interface HomeRichTextContent {
  html: string
}

export interface HomeFaqItem {
  question: string
  answer: string
}

export interface HomeFaqContent {
  items: HomeFaqItem[]
}

export interface HomeBanner {
  id: number
  title: string | null
  subtitle: string | null
  image: string | null
  mobile_image: string | null
  button_text: string | null
  url: string | null
  start_date: string | null
  end_date: string | null
  position: string
  sort_order: number
  is_active: boolean
}

export interface HomeSection {
  id: number
  type: HomeSectionType
  title: string | null
  subtitle: string | null
  config: Record<string, unknown>
  sort_order: number
  content: unknown
}

export interface HomePageData {
  sections: HomeSection[]
}

export interface Testimonial {
  id: number
  author_name: string
  author_role: string | null
  author_avatar: string | null
  image: string | null
  url?: string | null
  content: string
  rating: number
  sort_order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface HomepageSection {
  id: number
  custom_page_id: number | null
  type: HomeSectionType
  title: string | null
  subtitle: string | null
  config: Record<string, unknown> | null
  sort_order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface AdminHomepageSectionPayload {
  custom_page_id?: number | null
  type: HomeSectionType
  title?: string | null
  subtitle?: string | null
  config?: Record<string, unknown> | null
  sort_order?: number
  is_active?: boolean
}

/* ------------------------------ Custom pages ---------------------------- */

/** A standalone storefront page built from the same sections as the homepage. */
export interface CustomPage {
  id: number
  slug: string
  title: string
  meta_title: string | null
  meta_description: string | null
  sort_order: number
  is_active: boolean
  sections_count?: number
  created_at?: string
  updated_at?: string
}

export interface CustomPageData {
  page: {
    slug: string
    title: string
    meta_title: string | null
    meta_description: string | null
  }
  sections: HomeSection[]
}

export interface AdminCustomPagePayload {
  title: string
  slug?: string | null
  meta_title?: string | null
  meta_description?: string | null
  sort_order?: number
  is_active?: boolean
}

export interface AdminBannerPayload {
  title?: string | null
  subtitle?: string | null
  image?: string | null
  mobile_image?: string | null
  button_text?: string | null
  url?: string | null
  start_date?: string | null
  end_date?: string | null
  position?: string
  sort_order?: number
  is_active?: boolean
}

/* -------------------------- Category Pages ------------------------------ */

export interface CategoryPage {
  id: number
  category: Category
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  meta_title: string | null
  meta_description: string | null
  is_active: boolean
  is_custom: boolean
}

export interface CategoryPageSection {
  id: number
  type: HomeSectionType
  title: string | null
  subtitle: string | null
  config: Record<string, unknown> | null
  sort_order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface CategoryPageListingConfig {
  /** Which product-scope query param the grid and its paging links use. */
  scope_key: 'category_scope_id' | 'category_id'
  scope_value: number
  /** Destination used by "load more" links, or null for in-page paging. */
  scope_url: string | null
}

export interface CategoryPageData {
  page: CategoryPage
  listing: CategoryPageListingConfig
  sections: HomeSection[]
}

export interface AdminCategoryPage {
  id: number
  category_id: number
  category: Pick<Category, 'id' | 'slug' | 'name' | 'image' | 'is_active'>
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  meta_title: string | null
  meta_description: string | null
  sort_order: number
  is_active: boolean
  sections?: CategoryPageSection[]
  created_at?: string
  updated_at?: string
}

export interface AdminCategoryPagePayload {
  category_id: number
  title?: string | null
  subtitle?: string | null
  description?: string | null
  meta_title?: string | null
  meta_description?: string | null
  sort_order?: number
  is_active?: boolean
}

/* -------------------------- Website Settings -------------------------- */

export interface NavLinkConfig {
  label: string
  url: string
  new_tab?: boolean
  /** Per-page departments bar override; `null` means "use the global bar". */
  departments?: NavLinkDepartments | null
}

/** A departments bar scoped to a single navigation link page. */
export interface NavLinkDepartments {
  enabled: boolean
  category_ids: number[] | null
  show_all: boolean
  show_shop_all: boolean
  show_collections: boolean
}

export interface DepartmentsSettings {
  enabled: boolean
  category_ids: number[] | null
  show_all: boolean
  show_shop_all: boolean
  show_collections: boolean
}

export interface NavbarSettings {
  announcement: {
    enabled: boolean
    text: string
    url: string | null
  }
  logo: {
    text: string
    image: string | null
    url: string
  }
  links: NavLinkConfig[]
  departments: DepartmentsSettings
}

export interface FooterColumnConfig {
  title: string
  links: NavLinkConfig[]
}

export interface FooterSocialLinkConfig {
  platform: string
  url: string
  label: string
  enabled: boolean
}

export interface FooterSocialSettings {
  enabled: boolean
  title: string
  description: string
  style: 'icons' | 'labeled'
  links: FooterSocialLinkConfig[]
}

export interface FooterSettings {
  about: {
    text: string
  }
  columns: FooterColumnConfig[]
  social: FooterSocialSettings
  contact: {
    email: string
    phone: string
    address: string
  }
  copyright: string
}

export interface MailSettings {
  mail_mailer: string
  mail_host: string
  mail_port: string
  mail_username: string
  mail_password: string
  mail_encryption: string
  mail_from_address: string
  mail_from_name: string
}

export interface WebsiteContent {
  navbar: NavbarSettings
  footer: FooterSettings
  mail?: MailSettings
}

/* ------------------------------------------------------------------ */
/* Vendor / customer <-> admin support chat                             */
/* ------------------------------------------------------------------ */

export type SupportSenderRole = 'VENDOR' | 'CUSTOMER' | 'SUPER_ADMIN' | 'BOT'

/** Which side of the marketplace opened the conversation. */
export type SupportRequesterType = 'VENDOR' | 'CUSTOMER'

/**
 * What a support conversation is about. `GENERAL` is everyday chat; `ORDER_QUERY`
 * is an admin-initiated thread about a specific order, addressed to its vendor;
 * `PRODUCT_QUERY` is a customer-initiated thread about a product, addressed to
 * the selling vendor and the admin team together.
 */
export type SupportConversationKind = 'GENERAL' | 'ORDER_QUERY' | 'PRODUCT_QUERY'

/** Staff are the admin team plus the assistant; everyone else is a requester. */
const STAFF_SENDER_ROLES: SupportSenderRole[] = ['SUPER_ADMIN', 'BOT']

export function isStaffSenderRole(role: SupportSenderRole): boolean {
  return STAFF_SENDER_ROLES.includes(role)
}

export interface SupportMessage {
  id: number
  support_conversation_id: number
  sender_user_id: number | null
  sender_role: SupportSenderRole
  sender_name: string
  body: string
  /** Absolute URL of an attached image, present when the sender picked one. */
  image_url?: string | null
  is_bot: boolean
  read_at: string | null
  created_at: string
  sender?: {
    id: number
    name: string
    avatar: string | null
  } | null
}

export interface SupportConversation {
  id: number
  kind: SupportConversationKind
  subject: string | null
  requester_type: SupportRequesterType
  vendor_id: number | null
  vendor_user_id: number | null
  customer_user_id: number | null
  last_message_at: string | null
  last_admin_reply_at: string | null
  last_requester_reply_at: string | null
  is_closed: boolean
  closed_at: string | null
  is_waiting_on_admin: boolean
  created_at: string
  unread_count?: number
  unread_for_admin?: number
  /** Unread admin messages, present on the vendor's own order-query list. */
  unread_for_vendor?: number
  /** The order an admin query concerns; present only on order-query threads. */
  order?: {
    id: number
    order_number: string
    order_status: string
    total: string
    created_at: string
    /** The vendor-order row the "view full order" links point at. */
    vendor_order_id?: number | null
    customer?: {
      id: number
      name: string
      email: string
    } | null
    /**
     * Item lines of the order, present when the thread payload loaded them.
     * Powers the order-details card shown with the first message.
     */
    items?: Array<{
      id: number
      product_name: string
      product_image: string | null
      quantity: number
      unit_price: number
      total: number
    }> | null
    subtotal: number
    discount: number
    tax: number
    shipping_charge: number
    cod_charge: number
    fees_total: number
    wallet_amount: number
  } | null
  /** The product a customer is asking about; present only on product-query threads. */
  product?: {
    id: number
    name: string
    slug: string
    status: string
    images: string[]
    /** Selling price, present when the thread payload loaded the product. */
    price?: number
    /** Compare-at price; null when the product has none. */
    mrp?: number | null
    vendor?: {
      id: number
      store_name: string
      slug: string
      logo: string | null
      status: string
    } | null
  } | null
  /**
   * The asking customer's orders in which this product was bought, newest
   * first; present only when a product-query thread is opened. Lets the
   * thread show the purchase history next to the product being asked about.
   */
  product_purchases?: Array<{
    id: number
    order_number: string
    order_status: string
    total: string
    created_at: string
    quantity: number
    /** The vendor-order row the "view full order" links point at, when known. */
    vendor_order_id?: number | null
  }> | null
  /**
   * The customer's recent orders on their support chat, newest first, shown as
   * context next to the first message on both the customer and admin sides.
   */
  recent_orders?: Array<{
    id: number
    order_number: string
    order_status: string
    total: number
    created_at: string
    items?: Array<{ product_name: string; quantity: number }> | null
  }> | null
  vendor?: {
    id: number
    store_name: string
    slug: string
    logo: string | null
    status: string
  } | null
  vendor_user?: {
    id: number
    name: string
    email: string
    phone: string | null
  } | null
  customer?: {
    id: number
    name: string
    email: string
    phone: string | null
    avatar: string | null
  } | null
  latest_message?: {
    id: number
    sender_role: SupportSenderRole
    sender_name: string
    body: string
    is_bot: boolean
    created_at: string
  } | null
}

export interface SupportInboxCounts {
  open_count: number
  awaiting_admin: number
  unread_messages: number
}

export interface VendorSupportPayload {
  conversation: SupportConversation
  messages: Paginated<SupportMessage>
  suggestions: string[]
}

export interface SupportInboxPayload extends Paginated<SupportConversation> {
  counts: SupportInboxCounts
}

/** Payload for the admin creating a query to a vendor about an order. */
export interface CreateOrderQueryPayload {
  order_id: number
  vendor_id: number
  subject: string
  body: string
}

export interface CreateOrderQueryResult {
  conversation: SupportConversation
  message: SupportMessage | null
}

/** The vendor's own order-query inbox, with the total unread badge. */
export interface VendorOrderQueriesPayload extends Paginated<SupportConversation> {
  unread_count: number
}

/** A product-query inbox (customer or vendor side), with the total unread badge. */
export interface ProductQueriesPayload extends Paginated<SupportConversation> {
  unread_count: number
}

/** Payload for a customer raising a private query about a product. */
export interface CreateProductQueryPayload {
  product_id: number
  body: string
  /** URL returned by the shared image upload endpoint, when one is attached. */
  image_url?: string
}

export interface CreateProductQueryResult {
  conversation: SupportConversation
  message: SupportMessage | null
}

export interface SendSupportMessageResult {
  message: SupportMessage
  bot_reply: SupportMessage | null
  conversation: SupportConversation
}

/** Payload pushed over the `support.conversation.{id}` websocket channel. */
export interface SupportMessageEvent {
  conversation_id: number
  requester_type: SupportRequesterType
  message_id: number
  message: SupportMessage
  conversation: {
    id: number
    last_message_at: string | null
    last_admin_reply_at: string | null
    last_requester_reply_at: string | null
    is_closed: boolean
    unread_count: number
  }
}
