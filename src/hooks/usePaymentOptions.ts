import { useQuery } from '@tanstack/react-query'
import { getPaymentOptions } from '@/services/payment'

export function usePaymentOptions(enabled = true) {
  return useQuery({
    queryKey: ['payment-options'],
    queryFn: getPaymentOptions,
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}