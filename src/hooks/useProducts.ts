import { useQuery } from '@tanstack/react-query'
import {
  getFeaturedProducts,
  getProduct,
  getProductOffers,
  getProducts,
  type ProductQuery,
} from '@/services/product'

export function useProducts(query?: ProductQuery, enabled = true) {
  return useQuery({
    queryKey: ['products', query ?? null],
    queryFn: () => getProducts(query),
    enabled,
  })
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: getFeaturedProducts,
  })
}

export function useProduct(idOrSlug: string | number | undefined) {
  return useQuery({
    queryKey: ['product', idOrSlug],
    queryFn: () => getProduct(idOrSlug as string | number),
    enabled: idOrSlug != null && idOrSlug !== '',
  })
}

export function useProductOffers(id: number | undefined) {
  return useQuery({
    queryKey: ['product', id, 'offers'],
    queryFn: () => getProductOffers(id as number),
    enabled: id != null,
  })
}
