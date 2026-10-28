import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
  type AddToCartPayload,
} from '@/services/cart'
import type { Cart } from '@/types'

export function useCart(enabled = true) {
  return useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    enabled,
  })
}

function useCartUpdater() {
  const queryClient = useQueryClient()
  return {
    setCart: (cart: Cart) => queryClient.setQueryData(['cart'], cart),
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  }
}

export function useAddToCart() {
  const { setCart, invalidate } = useCartUpdater()
  return useMutation({
    mutationFn: (payload: AddToCartPayload) => addToCart(payload),
    onSuccess: (cart: Cart) => {
      setCart(cart)
      invalidate()
    },
  })
}

export function useUpdateCartItem() {
  const { setCart, invalidate } = useCartUpdater()
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      updateCartItem(itemId, quantity),
    onSuccess: (cart: Cart) => {
      setCart(cart)
      invalidate()
    },
  })
}

export function useRemoveCartItem() {
  const { setCart, invalidate } = useCartUpdater()
  return useMutation({
    mutationFn: (itemId: number) => removeCartItem(itemId),
    onSuccess: (cart: Cart) => {
      setCart(cart)
      invalidate()
    },
  })
}

export function useClearCart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => clearCart(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['cart'] })
    },
  })
}