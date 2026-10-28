import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adjustVendorInventory,
  cancelVendorShipment,
  createVendorProduct,
  deleteVendorProduct,
  deleteVendorNotification,
  generateVendorShipmentManifest,
  getVendorDashboard,
  getVendorInventory,
  getVendorNotifications,
  getVendorNotificationsUnreadCount,
  getVendorOrder,
  getVendorOrders,
  getVendorPayout,
  getVendorPayouts,
  getVendorProduct,
  getVendorProducts,
  getVendorProfile,
  getVendorReport,
  getVendorReturn,
  getVendorReturns,
  getVendorShipment,
  getVendorShipmentLabel,
  getVendorShipments,
  getVendorWalletBalance,
  getVendorWalletDashboard,
  getVendorWalletTransactions,
  markAllVendorNotificationsRead,
  markVendorNotificationRead,
  requestVendorPayout,
  requestVendorShipmentPickup,
  retryVendorShipment,
  getVendorCourierRates,
  shipVendorOrder,
  toggleVendorProduct,
  updateVendorOrderItemStatus,
  updateVendorOrderStatus,
  updateVendorProduct,
  updateVendorProfile,
  updateVendorReturnStatus,
  type InventoryAdjustPayload,
  type ProductPayload,
  type RequestVendorPayoutPayload,
  type ShipVendorOrderPayload,
  type UpdateVendorProfilePayload,
  type VendorOrderQuery,
  type VendorProductQuery,
  type VendorReturnQuery,
  type VendorReturnStatusPayload,
  type VendorShipmentQuery,
} from '@/services/vendor'
import type { Product, VendorOrderStatusValue, VendorReportType } from '@/types'

export function useVendorDashboard() {
  return useQuery({
    queryKey: ['vendor', 'dashboard'],
    queryFn: getVendorDashboard,
  })
}

export function useVendorProducts(params?: VendorProductQuery) {
  return useQuery({
    queryKey: ['vendor', 'products', params ?? {}],
    queryFn: () => getVendorProducts(params),
  })
}

export function useVendorProduct(id: number | undefined) {
  return useQuery({
    queryKey: ['vendor', 'product', id],
    queryFn: () => getVendorProduct(id as number),
    enabled: id != null,
  })
}

export function useVendorInventory(productId: number | undefined) {
  return useQuery({
    queryKey: ['vendor', 'products', productId, 'inventory'],
    queryFn: () => getVendorInventory(productId as number, { per_page: 50 }),
    enabled: productId != null,
  })
}

export function useAdjustVendorInventory(productId: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: InventoryAdjustPayload) =>
      adjustVendorInventory(productId as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', 'product', productId] })
      queryClient.invalidateQueries({
        queryKey: ['vendor', 'products', productId, 'inventory'],
      })
    },
  })
}

export function useCreateVendorProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ProductPayload) => createVendorProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', 'dashboard'] })
    },
  })
}

export function useUpdateVendorProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProductPayload> }) =>
      updateVendorProduct(id, data),
    onSuccess: (product: Product) => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', 'product', product.id] })
    },
  })
}

export function useDeleteVendorProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteVendorProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', 'dashboard'] })
    },
  })
}

export function useToggleVendorProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => toggleVendorProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', 'product'] })
    },
  })
}

export function useVendorOrders(params?: VendorOrderQuery) {
  return useQuery({
    queryKey: ['vendor', 'orders', params ?? {}],
    queryFn: () => getVendorOrders(params),
  })
}

export function useVendorOrder(id: number | null) {
  return useQuery({
    queryKey: ['vendor', 'order', id],
    queryFn: () => getVendorOrder(id as number),
    enabled: id != null,
  })
}

export function useUpdateVendorOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: VendorOrderStatusValue }) =>
      updateVendorOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', 'order'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', 'dashboard'] })
    },
  })
}

export function useUpdateVendorOrderItemStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderItemId, status }: { orderItemId: number; status: VendorOrderStatusValue }) =>
      updateVendorOrderItemStatus(orderItemId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', 'order'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', 'dashboard'] })
    },
  })
}

export function useShipVendorOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload?: ShipVendorOrderPayload }) =>
      shipVendorOrder(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', 'order'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', 'shipments'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', 'shipment'] })
    },
  })
}

export function useVendorReturns(params?: VendorReturnQuery) {
  return useQuery({
    queryKey: ['vendor', 'returns', params ?? {}],
    queryFn: () => getVendorReturns(params),
  })
}

export function useVendorReturn(id: number | null) {
  return useQuery({
    queryKey: ['vendor', 'return', id],
    queryFn: () => getVendorReturn(id as number),
    enabled: id != null,
  })
}

export function useUpdateVendorReturnStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { id: number } & VendorReturnStatusPayload) =>
      updateVendorReturnStatus(payload.id, {
        status: payload.status,
        notes: payload.notes,
        auto_refund: payload.auto_refund,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'returns'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', 'return'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', 'dashboard'] })
    },
  })
}

export function useVendorShipments(params?: VendorShipmentQuery) {
  return useQuery({
    queryKey: ['vendor', 'shipments', params ?? {}],
    queryFn: () => getVendorShipments(params),
  })
}

export function useVendorShipment(id: number | null) {
  return useQuery({
    queryKey: ['vendor', 'shipment', id],
    queryFn: () => getVendorShipment(id as number),
    enabled: id != null,
  })
}

export function useRequestVendorShipmentPickup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload?: { pickup_date?: string; pickup_time?: string }
    }) => requestVendorShipmentPickup(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'shipments'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', 'shipment'] })
    },
  })
}

export function useRetryVendorShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload?: { weight?: number } }) =>
      retryVendorShipment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'shipments'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', 'shipment'] })
    },
  })
}

export function useCancelVendorShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => cancelVendorShipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'shipments'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', 'shipment'] })
    },
  })
}

export function useVendorShipmentLabel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => getVendorShipmentLabel(id),
    onSuccess: (labelUrl, id) => {
      if (labelUrl) {
        queryClient.setQueryData(['vendor', 'shipment', id], (old: { label_url?: string | null } | undefined) =>
          old ? { ...old, label_url: labelUrl } : old,
        )
      }
    },
  })
}

export function useGenerateVendorShipmentManifest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (shipmentIds: number[]) => generateVendorShipmentManifest(shipmentIds),
    onSuccess: (manifestUrl) => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'shipments'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', 'shipment'] })
      if (manifestUrl) {
        window.open(manifestUrl, '_blank', 'noopener,noreferrer')
      }
    },
  })
}

export function useVendorCourierRates(vendorOrderId: number | null, weight = 1.0, enabled = true) {
  return useQuery({
    queryKey: ['vendor', 'courier-rates', vendorOrderId, weight],
    queryFn: () => getVendorCourierRates(vendorOrderId as number, weight),
    enabled: enabled && vendorOrderId != null,
    retry: false,
    staleTime: 60_000,
  })
}

export function useVendorWalletDashboard(page = 1, perPage = 12) {
  return useQuery({
    queryKey: ['vendor', 'wallet', page, perPage],
    queryFn: () => getVendorWalletDashboard(page, perPage),
  })
}

export function useVendorWallet() {
  return useQuery({
    queryKey: ['vendor', 'wallet', 'balance'],
    queryFn: getVendorWalletBalance,
  })
}

export function useVendorWalletTransactions(page = 1, perPage = 12) {
  return useQuery({
    queryKey: ['vendor', 'wallet', 'transactions', page, perPage],
    queryFn: () => getVendorWalletTransactions(page, perPage),
  })
}

export function useVendorPayouts(page = 1, perPage = 12) {
  return useQuery({
    queryKey: ['vendor', 'payouts', page, perPage],
    queryFn: () => getVendorPayouts({ page, per_page: perPage }),
  })
}

export function useVendorPayout(id: number | null) {
  return useQuery({
    queryKey: ['vendor', 'payout', id],
    queryFn: () => getVendorPayout(id as number),
    enabled: id != null,
  })
}

export function useRequestVendorPayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RequestVendorPayoutPayload) => requestVendorPayout(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'payouts'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', 'wallet'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', 'wallet', 'balance'] })
    },
  })
}

export function useVendorReport(type: VendorReportType, filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['vendor', 'report', type, filters ?? {}],
    queryFn: () => getVendorReport(type, filters),
  })
}

export function useVendorProfile() {
  return useQuery({
    queryKey: ['vendor', 'profile'],
    queryFn: getVendorProfile,
  })
}

export function useUpdateVendorProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateVendorProfilePayload) => updateVendorProfile(payload),
    onSuccess: (profile) => {
      queryClient.setQueryData(['vendor', 'profile'], profile)
    },
  })
}

export function useVendorNotifications(page = 1, perPage = 15, refetchInterval = 0) {
  return useQuery({
    queryKey: ['vendor', 'notifications', page, perPage],
    queryFn: () => getVendorNotifications(page, perPage),
    refetchInterval,
  })
}

export function useVendorNotificationsUnreadCount(refetchInterval = 15_000) {
  return useQuery({
    queryKey: ['vendor', 'notifications', 'unread'],
    queryFn: getVendorNotificationsUnreadCount,
    refetchInterval,
  })
}

export function useMarkVendorNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markVendorNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'notifications'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', 'notifications', 'unread'] })
    },
  })
}

export function useMarkAllVendorNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => markAllVendorNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'notifications'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', 'notifications', 'unread'] })
    },
  })
}

export function useDeleteVendorNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteVendorNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'notifications'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', 'notifications', 'unread'] })
    },
  })
}

export function useVendorWalletBalance() {
  return useQuery({
    queryKey: ['vendor', 'wallet', 'balance'],
    queryFn: getVendorWalletBalance,
  })
}
