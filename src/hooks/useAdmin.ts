import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { invalidateHomePageCache } from '@/hooks/useHome'
import { toast } from '@/lib/toast'

function invalidateHomePage(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: ['home'] })
  invalidateHomePageCache()
}

function successToast(message: string): void {
  toast({ variant: 'success', title: 'Success', description: message })
}

function errorToast(error: unknown): void {
  toast({
    variant: 'destructive',
    title: 'Error',
    description: error instanceof Error && error.message ? error.message : 'Something went wrong. Please try again.',
  })
}
import {
  activateVendor,
  approveAdminProduct,
  approvePayout,
  approveVendor,
  bestSellerAdminProduct,
  blockAdminUser,
  cancelAdminShipment,
  createAdminCategory,
  createAdminCoupon,
  createAdminVendor,
  deleteAdminCategory,
  deleteAdminNotification,
  deleteAdminProduct,
  deleteAdminVendor,
  featureAdminProduct,
  getAdminCategories,
  getAdminCoupons,
  getAdminDashboard,
  getAdminNotifications,
  getAdminNotificationsUnreadCount,
  getAdminOrder,
  getAdminOrders,
  getAdminCommissions,
  getAdminPayouts,
  getAdminProduct,
  getAdminProducts,
  getAdminRefunds,
  getAdminReport,
  getAdminReturn,
  getAdminReturns,
  getAdminShipment,
  getAdminShipmentEvents,
  getAdminShipmentLabel,
  getAdminShipments,
  generateAdminShipmentManifest,
  getAdminUser,
  getAdminUsers,
  getAdminVendor,
  getAdminVendorOrder,
  getAdminVendorOrders,
  getAdminVendors,
  getAdminShiprocketPickupLocations,
  getAdminShiprocketSettings,
  getAdminWallet,
  getAdminWalletTransactions,
  getAdminWalletTransaction,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  markPayoutPaid,
  processAdminRefund,
  publishAdminProduct,
  rejectAdminProduct,
  rejectPayout,
  rejectVendor,
  retryAdminShipment,
  scheduleAdminShipmentPickup,
  suspendVendor,
  testAdminShiprocketConnection,
  toggleAdminUserActive,
  unblockAdminUser,
  unpublishAdminProduct,
  updateAdminCategory,
  updateAdminOrderStatus,
  updateAdminReturnStatus,
  updateAdminShiprocketSettings,
  updateAdminVendor,
  updateAdminVendorOrderStatus,
  updateAdminProductReturnPolicy,
  type AdminOrderParams,
  type AdminPayoutParams,
  type AdminCommissionParams,
  type AdminProductParams,
  type AdminRefundParams,
  type AdminReportType,
  type AdminReturnParams,
  type AdminReturnPolicyPayload,
  type AdminShipmentParams,
  type ShiprocketSettingsPayload,
  type AdminUserParams,
  type AdminVendorOrderParams,
  type AdminVendorParams,
  type ReturnStatusValue,
} from '@/services/admin'
import {
  getAdminPaymentSettings,
  testAdminRazorpay,
  updateAdminPaymentSettings,
  type AdminPaymentSettingsPayload,
  type RazorpayTestPayload,
} from '@/services/payment'
import type { Category, HomeBanner, HomepageSection, Testimonial, VendorOrderStatusValue } from '@/types'
import {
  getAdminHomepageSections,
  toggleAdminHomepageSection,
  reorderAdminHomepageSections,
  createAdminHomepageSection,
  updateAdminHomepageSection,
  deleteAdminHomepageSection,
  getAdminBanners,
  createAdminBanner,
  updateAdminBanner,
  deleteAdminBanner,
  toggleAdminBanner,
  reorderAdminBanners,
  getAdminTestimonials,
  createAdminTestimonial,
  updateAdminTestimonial,
  deleteAdminTestimonial,
  toggleAdminTestimonial,
} from '@/services/home'
import { getAdminBrands } from '@/services/catalog'

export function useAdminDashboard(days = 30) {
  return useQuery({
    queryKey: ['admin', 'dashboard', days],
    queryFn: () => getAdminDashboard(days),
  })
}

export function useAdminWallet() {
  return useQuery({
    queryKey: ['admin', 'wallet'],
    queryFn: getAdminWallet,
  })
}

export function useAdminWalletTransactions(params: { page?: number; perPage?: number; type?: string; q?: string } = {}) {
  return useQuery({
    queryKey: ['admin', 'wallet', 'transactions', params],
    queryFn: () => getAdminWalletTransactions(params),
  })
}

export function useAdminWalletTransaction(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'wallet', 'transaction', id],
    queryFn: () => getAdminWalletTransaction(id as number),
    enabled: id != null,
  })
}

export function useAdminPayouts(params: AdminPayoutParams = {}) {
  return useQuery({
    queryKey: ['admin', 'payouts', params],
    queryFn: () => getAdminPayouts(params),
  })
}

export function useAdminCommissions(params: AdminCommissionParams = {}) {
  return useQuery({
    queryKey: ['admin', 'commissions', params],
    queryFn: () => getAdminCommissions(params),
  })
}

export function useApprovePayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) => approvePayout(id, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] }),
  })
}

export function useMarkPayoutPaid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) => markPayoutPaid(id, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] }),
  })
}

export function useRejectPayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) => rejectPayout(id, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] }),
  })
}

export function useAdminVendors(params: AdminVendorParams = {}) {
  return useQuery({
    queryKey: ['admin', 'vendors', params],
    queryFn: () => getAdminVendors(params),
  })
}

export function useAdminVendor(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'vendors', id],
    queryFn: () => getAdminVendor(id as number),
    enabled: id != null,
  })
}

export function useApproveVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: { status: string; commission_rate?: number }
    }) => approveVendor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}

export function useCreateAdminVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAdminVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}

export function useUpdateAdminVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      updateAdminVendor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}

export function useVendorAction(action: 'activate' | 'suspend' | 'reject') {
  const queryClient = useQueryClient()
  const fn =
    action === 'activate' ? activateVendor : action === 'suspend' ? suspendVendor : rejectVendor
  return useMutation({
    mutationFn: (id: number) => fn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}

export function useDeleteAdminVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteAdminVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}

export function useAdminCategories(params?: {
  search?: string
  page?: number
  per_page?: number
}) {
  return useQuery({
    queryKey: ['admin', 'categories', params ?? {}],
    queryFn: () => getAdminCategories(params),
  })
}

export function useCreateAdminCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAdminCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useUpdateAdminCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Category> }) =>
      updateAdminCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useDeleteAdminCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteAdminCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useAdminCoupons() {
  return useQuery({
    queryKey: ['admin', 'coupons'],
    queryFn: () => getAdminCoupons(),
  })
}

export function useCreateAdminCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAdminCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })
    },
  })
}

export function useAdminOrders(params: AdminOrderParams = {}) {
  return useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: () => getAdminOrders(params),
  })
}

export function useAdminOrder(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'order', id],
    queryFn: () => getAdminOrder(id as number),
    enabled: id != null,
  })
}

export function useUpdateAdminOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateAdminOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'order'] })
    },
  })
}

export function useAdminUsers(params: AdminUserParams = {}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => getAdminUsers(params),
  })
}

export function useAdminUser(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'users', 'detail', id],
    queryFn: () => getAdminUser(id as number),
    enabled: id != null,
  })
}

export function useBlockAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => blockAdminUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useUnblockAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => unblockAdminUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useToggleAdminUserActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => toggleAdminUserActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useAdminProducts(params: AdminProductParams = {}) {
  return useQuery({
    queryKey: ['admin', 'products', params],
    queryFn: () => getAdminProducts(params),
  })
}

export function useAdminProduct(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'products', 'detail', id],
    queryFn: () => getAdminProduct(id as number),
    enabled: id != null,
  })
}

export function useAdminProductMutation(action: 'approve' | 'reject') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      action === 'approve' ? approveAdminProduct(id) : rejectAdminProduct(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}

export function useAdminProductPublish(action: 'publish' | 'unpublish') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      action === 'publish' ? publishAdminProduct(id) : unpublishAdminProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
  })
}

export function useAdminProductFlag(action: 'feature' | 'best-seller') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      action === 'feature' ? featureAdminProduct(id) : bestSellerAdminProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
  })
}

export function useDeleteAdminProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteAdminProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
  })
}

export function useUpdateAdminProductReturnPolicy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AdminReturnPolicyPayload }) =>
      updateAdminProductReturnPolicy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
  })
}

export function useAdminPaymentSettings() {
  return useQuery({
    queryKey: ['admin', 'payment-settings'],
    queryFn: getAdminPaymentSettings,
  })
}

export function useUpdateAdminPaymentSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AdminPaymentSettingsPayload) => updateAdminPaymentSettings(data),
    onSuccess: (settings) => {
      queryClient.setQueryData(['admin', 'payment-settings'], settings)
      queryClient.invalidateQueries({ queryKey: ['payment-options'] })
    },
  })
}

export function useTestAdminRazorpay() {
  return useMutation({
    mutationFn: (payload: RazorpayTestPayload = {}) => testAdminRazorpay(payload),
  })
}

export function useAdminReturns(params: AdminReturnParams = {}) {
  return useQuery({
    queryKey: ['admin', 'returns', params],
    queryFn: () => getAdminReturns(params),
  })
}

export function useAdminReturn(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'returns', 'detail', id],
    queryFn: () => getAdminReturn(id as number),
    enabled: id != null,
  })
}

export function useUpdateAdminReturnStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: ReturnStatusValue; notes?: string }) =>
      updateAdminReturnStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'returns'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'refunds'] })
    },
  })
}

export function useAdminRefunds(params: AdminRefundParams = {}) {
  return useQuery({
    queryKey: ['admin', 'refunds', params],
    queryFn: () => getAdminRefunds(params),
  })
}

export function useProcessAdminRefund() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => processAdminRefund(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'refunds'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'returns'] })
    },
  })
}

/* ------------------------------ Shipments ----------------------------- */

export function useAdminShipments(params: AdminShipmentParams = {}) {
  return useQuery({
    queryKey: ['admin', 'shipments', params],
    queryFn: () => getAdminShipments(params),
  })
}

export function useAdminShipment(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'shipments', 'detail', id],
    queryFn: () => getAdminShipment(id as number),
    enabled: id != null,
  })
}

export function useAdminShipmentEvents(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'shipments', 'events', id],
    queryFn: () => getAdminShipmentEvents(id as number),
    enabled: id != null,
  })
}

export function useScheduleAdminShipmentPickup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload?: { pickup_date?: string; pickup_time?: string } }) =>
      scheduleAdminShipmentPickup(id, payload),
    onSuccess: (shipment) => {
      queryClient.setQueryData(['admin', 'shipments', 'detail', shipment.id], shipment)
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipments', 'events'] })
    },
  })
}

export function useRetryAdminShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload?: { weight?: number } }) =>
      retryAdminShipment(id, payload?.weight),
    onSuccess: (shipment) => {
      queryClient.setQueryData(['admin', 'shipments', 'detail', shipment.id], shipment)
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipments', 'events'] })
    },
  })
}

export function useCancelAdminShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => cancelAdminShipment(id),
    onSuccess: (shipment) => {
      queryClient.setQueryData(['admin', 'shipments', 'detail', shipment.id], shipment)
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipments', 'events'] })
      successToast('Shipment cancelled.')
    },
    onError: errorToast,
  })
}

export function useAdminShipmentLabel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => getAdminShipmentLabel(id),
    onSuccess: (labelUrl, id) => {
      if (labelUrl) {
        queryClient.setQueryData(['admin', 'shipments', 'detail', id], (old: { label_url?: string | null } | undefined) =>
          old ? { ...old, label_url: labelUrl } : old,
        )
      }
    },
  })
}

export function useGenerateAdminShipmentManifest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (shipmentIds: number[]) => generateAdminShipmentManifest(shipmentIds),
    onSuccess: (manifestUrl) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipments', 'detail'] })
      if (manifestUrl) {
        window.open(manifestUrl, '_blank', 'noopener,noreferrer')
      }
    },
    onError: errorToast,
  })
}

/* ------------------------- Shiprocket Settings ------------------------ */

export function useAdminShiprocketSettings() {
  return useQuery({
    queryKey: ['admin', 'shiprocket-settings'],
    queryFn: getAdminShiprocketSettings,
  })
}

export function useUpdateAdminShiprocketSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ShiprocketSettingsPayload) => updateAdminShiprocketSettings(payload),
    onSuccess: (settings) => {
      queryClient.setQueryData(['admin', 'shiprocket-settings'], settings)
      successToast('Shipping settings saved.')
    },
    onError: errorToast,
  })
}

export function useTestAdminShiprocketConnection() {
  return useMutation({
    mutationFn: () => testAdminShiprocketConnection(),
  })
}

export function useAdminShiprocketPickupLocations(enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'shiprocket-pickup-locations'],
    queryFn: getAdminShiprocketPickupLocations,
    enabled,
    retry: false,
  })
}

/* ---------------------------- Vendor Orders --------------------------- */

export function useAdminVendorOrders(params: AdminVendorOrderParams = {}) {
  return useQuery({
    queryKey: ['admin', 'vendor-orders', params],
    queryFn: () => getAdminVendorOrders(params),
  })
}

export function useAdminVendorOrder(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'vendor-orders', 'detail', id],
    queryFn: () => getAdminVendorOrder(id as number),
    enabled: id != null,
  })
}

export function useUpdateAdminVendorOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: VendorOrderStatusValue }) =>
      updateAdminVendorOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendor-orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
    },
  })
}

/* ---------------------------- Notifications --------------------------- */

export function useAdminNotifications(page = 1, perPage = 15, type?: string, refetchInterval = 0) {
  return useQuery({
    queryKey: ['admin', 'notifications', page, perPage, type ?? ''],
    queryFn: () => getAdminNotifications(page, perPage, type),
    refetchInterval,
  })
}

export function useAdminNotificationsUnreadCount(refetchInterval = 0) {
  return useQuery({
    queryKey: ['admin', 'notifications', 'unread'],
    queryFn: getAdminNotificationsUnreadCount,
    refetchInterval,
  })
}

export function useMarkAdminNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markAdminNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications', 'unread'] })
    },
  })
}

export function useMarkAllAdminNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => markAllAdminNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications', 'unread'] })
    },
  })
}

export function useDeleteAdminNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAdminNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications', 'unread'] })
    },
  })
}

/* ------------------------------- Reports ------------------------------ */

export function useAdminReport(type: AdminReportType, filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['admin', 'report', type, filters ?? {}],
    queryFn: () => getAdminReport(type, filters),
    enabled: type != null,
  })
}

/* ----------------------------- Homepage Sections ---------------------------- */

export function useAdminHomepageSections(pageId?: number) {
  return useQuery({
    queryKey: ['admin', 'homepage-sections', pageId ?? null],
    queryFn: () => getAdminHomepageSections(pageId),
  })
}

export function useCreateAdminHomepageSection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAdminHomepageSection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'homepage-sections'] })
      invalidateHomePage(queryClient)
      queryClient.invalidateQueries({ queryKey: ['custom-page'] })
      successToast('Section created.')
    },
    onError: (error) => errorToast(error),
  })
}

export function useUpdateAdminHomepageSection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<HomepageSection> }) => updateAdminHomepageSection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'homepage-sections'] })
      invalidateHomePage(queryClient)
      queryClient.invalidateQueries({ queryKey: ['custom-page'] })
      successToast('Section updated.')
    },
    onError: (error) => errorToast(error),
  })
}

export function useDeleteAdminHomepageSection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminHomepageSection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'homepage-sections'] })
      invalidateHomePage(queryClient)
      queryClient.invalidateQueries({ queryKey: ['custom-page'] })
      successToast('Section deleted.')
    },
    onError: (error) => errorToast(error),
  })
}

export function useReorderAdminHomepageSections(pageId?: number) {
  const queryClient = useQueryClient()
  const key = ['admin', 'homepage-sections', pageId ?? null]
  return useMutation({
    mutationFn: reorderAdminHomepageSections,
    onMutate: async (ordered) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<HomepageSection[]>(key)
      if (previous) {
        const byId = new Map(previous.map((s) => [s.id, s]))
        const next = ordered
          .map(({ id }) => byId.get(id))
          .filter((s): s is HomepageSection => Boolean(s))
          .map((s, index) => ({ ...s, sort_order: index }))
        queryClient.setQueryData(key, next)
      }
      return { previous }
    },
    onError: (error, _v, context?: { previous?: HomepageSection[] }) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      errorToast(error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'homepage-sections'] })
      invalidateHomePage(queryClient)
      queryClient.invalidateQueries({ queryKey: ['custom-page'] })
      successToast('Section order updated.')
    },
  })
}

export function useToggleAdminHomepageSection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: toggleAdminHomepageSection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'homepage-sections'] })
      invalidateHomePage(queryClient)
      queryClient.invalidateQueries({ queryKey: ['custom-page'] })
      successToast('Section status updated.')
    },
    onError: (error) => errorToast(error),
  })
}

/* --------------------------------- Banners --------------------------------- */

export function useAdminBanners(params?: { position?: string; is_active?: boolean; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ['admin', 'banners', params ?? {}],
    queryFn: () => getAdminBanners(params),
  })
}

export function useCreateAdminBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAdminBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] })
      invalidateHomePage(queryClient)
      successToast('Banner created.')
    },
    onError: (error) => errorToast(error),
  })
}

export function useUpdateAdminBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<HomeBanner> }) => updateAdminBanner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] })
      invalidateHomePage(queryClient)
      successToast('Banner updated.')
    },
    onError: (error) => errorToast(error),
  })
}

export function useDeleteAdminBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] })
      invalidateHomePage(queryClient)
      successToast('Banner deleted.')
    },
    onError: (error) => errorToast(error),
  })
}

export function useToggleAdminBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: toggleAdminBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] })
      invalidateHomePage(queryClient)
      successToast('Banner status updated.')
    },
    onError: (error) => errorToast(error),
  })
}

export function useReorderAdminBanners() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reorderAdminBanners,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] })
      invalidateHomePage(queryClient)
      successToast('Banner order updated.')
    },
    onError: (error) => errorToast(error),
  })
}

/* -------------------------------- Testimonials ------------------------------- */

export function useAdminTestimonials(params?: { is_active?: boolean; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ['admin', 'testimonials', params ?? {}],
    queryFn: () => getAdminTestimonials(params),
  })
}

export function useCreateAdminTestimonial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAdminTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'testimonials'] })
      invalidateHomePage(queryClient)
      successToast('Testimonial created.')
    },
    onError: (error) => errorToast(error),
  })
}

export function useUpdateAdminTestimonial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Testimonial> }) => updateAdminTestimonial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'testimonials'] })
      invalidateHomePage(queryClient)
      successToast('Testimonial updated.')
    },
    onError: (error) => errorToast(error),
  })
}

export function useDeleteAdminTestimonial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'testimonials'] })
      invalidateHomePage(queryClient)
      successToast('Testimonial deleted.')
    },
    onError: (error) => errorToast(error),
  })
}

export function useToggleAdminTestimonial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: toggleAdminTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'testimonials'] })
      invalidateHomePage(queryClient)
      successToast('Testimonial status updated.')
    },
    onError: (error) => errorToast(error),
  })
}

/* ----------------------------- Admin helpers for homepage ---------------------------- */

export function useAdminBrandsList() {
  return useQuery({
    queryKey: ['admin', 'brands', 'list'],
    queryFn: () => getAdminBrands({ per_page: 100 }),
  })
}
