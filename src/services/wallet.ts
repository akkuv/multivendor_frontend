import api from './api'
import type {
  ApiResponse,
  Paginated,
  Wallet,
  WalletRechargeResponse,
  WalletTransaction,
} from '@/types'

export type WalletTransactionFilter = 'all' | 'credit' | 'debit' | 'refund' | 'recharge'

export async function getWallet(): Promise<Wallet> {
  const res = await api.get<ApiResponse<Wallet>>('/user/wallet')
  return res.data
}

export async function getWalletTransactions(
  filter: WalletTransactionFilter = 'all',
  page = 1,
  perPage = 15,
): Promise<Paginated<WalletTransaction>> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  })

  if (filter === 'credit' || filter === 'debit') {
    params.set('direction', filter)
  } else if (filter === 'refund' || filter === 'recharge') {
    params.set('type', filter.toUpperCase())
  }

  const res = await api.get<ApiResponse<Paginated<WalletTransaction>>>(
    `/user/wallet/transactions?${params.toString()}`,
  )
  return res.data
}

export async function getWalletTransaction(id: number): Promise<WalletTransaction> {
  const res = await api.get<ApiResponse<WalletTransaction>>(`/user/wallet/transactions/${id}`)
  return res.data
}

export interface RechargeInput {
  amount: number
}

export async function rechargeWallet(
  input: RechargeInput,
): Promise<WalletRechargeResponse> {
  const res = await api.post<ApiResponse<WalletRechargeResponse>>('/user/wallet/recharge', input)
  return res.data
}

export async function confirmRecharge(input: {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}): Promise<Wallet> {
  const res = await api.post<ApiResponse<Wallet>>('/user/wallet/recharge/verify', input)
  return res.data
}