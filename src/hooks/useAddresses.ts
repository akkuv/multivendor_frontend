import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
  type AddressPayload,
} from '@/services/address'
import type { Address } from '@/types'

export function useAddresses(enabled = true) {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: getAddresses,
    enabled,
  })
}

export function useCreateAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AddressPayload) => createAddress(data),
    onSuccess: (address: Address) => {
      queryClient.setQueryData(
        ['addresses'],
        (old: Address[] | undefined) => [...(old ?? []), address],
      )
    },
  })
}

export function useUpdateAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AddressPayload> }) =>
      updateAddress(id, data),
    onSuccess: (updated: Address) => {
      queryClient.setQueryData(['addresses'], (old: Address[] | undefined) =>
        (old ?? []).map((a) => (a.id === updated.id ? updated : a)),
      )
    },
  })
}

export function useDeleteAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteAddress(id),
    onSuccess: (_: unknown, id: number) => {
      queryClient.setQueryData(['addresses'], (old: Address[] | undefined) =>
        (old ?? []).filter((a) => a.id !== id),
      )
    },
  })
}
