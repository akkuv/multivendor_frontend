import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createReturnRequest,
  getMyReturn,
  getMyReturns,
  withdrawReturn,
  type CreateReturnPayload,
} from '@/services/returns'

export function useMyReturns() {
  return useQuery({
    queryKey: ['my-returns'],
    queryFn: getMyReturns,
  })
}

export function useMyReturn(id: number | null) {
  return useQuery({
    queryKey: ['my-returns', id],
    queryFn: () => getMyReturn(id as number),
    enabled: id != null,
  })
}

export function useCreateReturnRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateReturnPayload) => createReturnRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-returns'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order'] })
    },
  })
}

export function useWithdrawReturn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => withdrawReturn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-returns'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order'] })
    },
  })
}