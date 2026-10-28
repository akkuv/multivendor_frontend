import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  confirmRecharge,
  getWallet,
  getWalletTransaction,
  getWalletTransactions,
  rechargeWallet,
  type RechargeInput,
  type WalletTransactionFilter,
} from '@/services/wallet'

export function useWallet(enabled = true) {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: getWallet,
    enabled,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
}

export function useWalletTransactions(
  filter: WalletTransactionFilter = 'all',
  page = 1,
  enabled = true,
) {
  return useQuery({
    queryKey: ['wallet', 'transactions', filter, page],
    queryFn: () => getWalletTransactions(filter, page),
    enabled,
  })
}

export function useWalletTransaction(id: number | null) {
  return useQuery({
    queryKey: ['wallet', 'transactions', id],
    queryFn: () => getWalletTransaction(id!),
    enabled: id !== null,
  })
}

export function useRechargeWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RechargeInput) => rechargeWallet(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wallet'] }),
  })
}

export function useConfirmRecharge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: confirmRecharge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] })
    },
  })
}