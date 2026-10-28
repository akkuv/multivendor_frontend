import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addToWishlist,
  clearWishlist,
  getWishlist,
  getWishlistNotifications,
  markWishlistNotificationsRead,
  moveWishlistItemToCart,
  removeFromWishlist,
  updateWishlistNotifications,
  type MoveToCartPayload,
  type UpdateNotificationsPayload,
} from '@/services/wishlist'
import type { Cart, Paginated, Product, WishlistItem } from '@/types'

export function useWishlist(enabled = true) {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
    enabled,
    select: (data) => data.data,
  })
}

export function useWishlistCount(enabled = true) {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
    enabled,
    select: (data) => data.total ?? 0,
  })
}

export function useWishlistIds(enabled = true) {
  const { data: items } = useWishlist(enabled)
  return new Set(items?.map((i) => i.product.id) ?? [])
}

export function useToggleWishlist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (product: Product): Promise<unknown> => {
      const cached = queryClient.getQueryData<Paginated<WishlistItem>>(['wishlist'])
      const isWishlisted = cached?.data?.some((i) => i.product.id === product.id) ?? false
      return isWishlisted ? removeFromWishlist(product) : addToWishlist(product.id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  })
}

export function useAddToWishlist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (productId: number) => addToWishlist(productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  })
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (product: Product) => removeFromWishlist(product),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  })
}

export function useClearWishlist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => clearWishlist(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  })
}

export function useMoveToCart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ product, payload }: { product: Product; payload?: MoveToCartPayload }) =>
      moveWishlistItemToCart(product, payload),
    onSuccess: (cart: Cart) => {
      queryClient.setQueryData(['cart'], cart)
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })
}

export function useUpdateWishlistNotifications() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: number; payload: UpdateNotificationsPayload }) =>
      updateWishlistNotifications(productId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  })
}

export function useWishlistNotifications(enabled = true) {
  return useQuery({
    queryKey: ['wishlist-notifications'],
    queryFn: getWishlistNotifications,
    enabled,
    select: (data) => data.data,
  })
}

export function useMarkWishlistNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => markWishlistNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist-notifications'] }),
  })
}