import api from './api'
import type { ApiResponse, Paginated, Product, ProductListResponse, ProductOffer } from '@/types'

export interface ProductQuery {
  category_id?: number
  category_scope_id?: number
  collection_id?: number
  subcategory_id?: number
  vendor_id?: number
  brand_id?: number
  search?: string
  min_price?: number
  max_price?: number
  min_discount?: number
  min_rating?: number
  in_stock?: boolean
  color?: string
  size?: string
  sort?: string
  featured?: boolean
  best_seller?: boolean
  deals_only?: boolean
  with_facets?: boolean
  per_page?: number
  page?: number
}

export async function getProducts(params?: ProductQuery): Promise<ProductListResponse> {
  const res = await api.get<ApiResponse<ProductListResponse>>('/products', { params })
  return res.data
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const res = await api.get<ApiResponse<Product[]>>('/products/featured')
  return res.data
}

export async function getProduct(idOrSlug: string | number): Promise<Product> {
  const res = await api.get<ApiResponse<Product>>(`/products/${idOrSlug}`)
  return res.data
}

export async function getProductOffers(id: number): Promise<ProductOffer[]> {
  const res = await api.get<ApiResponse<ProductOffer[]>>(`/products/${id}/offers`)
  return res.data
}

export async function getVendorProducts(
  vendorId: number,
  params: { page?: number; per_page?: number } = {},
): Promise<Paginated<Product>> {
  const res = await api.get<ApiResponse<Paginated<Product>>>(`/vendors/${vendorId}/products`, { params })
  return res.data
}
