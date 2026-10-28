import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelOrder,
  getMyOrders,
  getOrder,
  placeOrder,
  trackOrder,
  verifyPayment,
  type PlaceOrderPayload,
} from '@/services/order'

export function useMyOrders(enabled = true) {
  return useQuery({
    queryKey: ['orders', 'mine'],
    queryFn: getMyOrders,
    enabled,
    refetchOnWindowFocus: true,
    staleTime: 0,
  })
}

export function useOrder(id: number | undefined) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id as number),
    enabled: id != null,
  })
}

export function usePlaceOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PlaceOrderPayload) => placeOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.removeQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => cancelOrder(id, reason),
    onSuccess: (order) => {
      queryClient.setQueryData(['order', order.id], order)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders', 'mine'] })
      void queryClient.refetchQueries({ queryKey: ['orders', 'mine'] })
    },
  })
}

export function useVerifyPayment() {
  return useMutation({
    mutationFn: verifyPayment,
  })
}

export function useOrderTracking(id: number | null) {
  return useQuery({
    queryKey: ['order', 'tracking', id],
    queryFn: () => trackOrder(id as number),
    enabled: id != null,
    retry: false,
    staleTime: 60_000,
  })
}
