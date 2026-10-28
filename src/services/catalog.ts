import api from './api'
import type {
  ApiResponse,
  Attribute,
  AttributeValue,
  Brand,
  CatalogListParams,
  Category,
  Collection,
  Color,
  Paginated,
  Size,
  SizeGroup,
} from '@/types'

function toParams(params?: CatalogListParams): Record<string, unknown> {
  if (!params) return {}
  return {
    ...params,
    page: params.page ?? 1,
    per_page: params.per_page ?? 15,
  }
}

export async function getBrands(): Promise<Brand[]> {
  const res = await api.get<ApiResponse<Brand[]>>('/brands')
  return res.data
}

export async function getCollections(params?: { gender?: string }): Promise<Collection[]> {
  const res = await api.get<ApiResponse<Collection[]>>('/collections', { params })
  return res.data
}

export async function getCollection(slug: string): Promise<Collection> {
  const res = await api.get<ApiResponse<Collection>>(`/collections/${slug}`)
  return res.data
}

export async function getAdminCollections(params?: CatalogListParams): Promise<Paginated<Collection>> {
  const res = await api.get<ApiResponse<Paginated<Collection>>>('/admin/collections', {
    params: toParams(params),
  })
  return res.data
}

export async function createAdminCollection(data: Partial<Collection>): Promise<Collection> {
  const res = await api.post<ApiResponse<Collection>>('/admin/collections', data)
  return res.data
}

export async function updateAdminCollection(id: number, data: Partial<Collection>): Promise<Collection> {
  const res = await api.put<ApiResponse<Collection>>(`/admin/collections/${id}`, data)
  return res.data
}

export async function deleteAdminCollection(id: number): Promise<void> {
  await api.delete(`/admin/collections/${id}`)
}

export async function toggleAdminCollection(id: number): Promise<Collection> {
  const res = await api.put<ApiResponse<Collection>>(`/admin/collections/${id}/toggle`)
  return res.data
}

export async function getColors(): Promise<Color[]> {
  const res = await api.get<ApiResponse<Color[]>>('/colors')
  return res.data
}

export async function getAdminBrands(params?: CatalogListParams): Promise<Paginated<Brand>> {
  const res = await api.get<ApiResponse<Paginated<Brand>>>('/admin/brands', { params: toParams(params) })
  return res.data
}

export async function createAdminBrand(data: Partial<Brand>): Promise<Brand> {
  const res = await api.post<ApiResponse<Brand>>('/admin/brands', data)
  return res.data
}

export async function updateAdminBrand(id: number, data: Partial<Brand>): Promise<Brand> {
  const res = await api.put<ApiResponse<Brand>>(`/admin/brands/${id}`, data)
  return res.data
}

export async function deleteAdminBrand(id: number): Promise<void> {
  await api.delete(`/admin/brands/${id}`)
}

export async function toggleAdminBrand(id: number): Promise<Brand> {
  const res = await api.put<ApiResponse<Brand>>(`/admin/brands/${id}/toggle`)
  return res.data
}

export async function getAdminAttributes(params?: CatalogListParams): Promise<Paginated<Attribute>> {
  const res = await api.get<ApiResponse<Paginated<Attribute>>>('/admin/attributes', {
    params: toParams(params),
  })
  return res.data
}

export async function getAdminAttribute(id: number): Promise<Attribute> {
  const res = await api.get<ApiResponse<Attribute>>(`/admin/attributes/${id}`)
  return res.data
}

export async function createAdminAttribute(data: Partial<Attribute>): Promise<Attribute> {
  const res = await api.post<ApiResponse<Attribute>>('/admin/attributes', data)
  return res.data
}

export async function updateAdminAttribute(id: number, data: Partial<Attribute>): Promise<Attribute> {
  const res = await api.put<ApiResponse<Attribute>>(`/admin/attributes/${id}`, data)
  return res.data
}

export async function deleteAdminAttribute(id: number): Promise<void> {
  await api.delete(`/admin/attributes/${id}`)
}

export async function toggleAdminAttribute(id: number): Promise<Attribute> {
  const res = await api.put<ApiResponse<Attribute>>(`/admin/attributes/${id}/toggle`)
  return res.data
}

export async function getAdminAttributeValues(
  attributeId: number,
  params?: CatalogListParams,
): Promise<Paginated<AttributeValue>> {
  const res = await api.get<ApiResponse<Paginated<AttributeValue>>>('/admin/attribute-values', {
    params: { ...toParams(params), attribute_id: attributeId, per_page: 50 },
  })
  return res.data
}

export async function createAdminAttributeValue(data: Partial<AttributeValue>): Promise<AttributeValue> {
  const res = await api.post<ApiResponse<AttributeValue>>('/admin/attribute-values', data)
  return res.data
}

export async function updateAdminAttributeValue(
  id: number,
  data: Partial<AttributeValue>,
): Promise<AttributeValue> {
  const res = await api.put<ApiResponse<AttributeValue>>(`/admin/attribute-values/${id}`, data)
  return res.data
}

export async function deleteAdminAttributeValue(id: number): Promise<void> {
  await api.delete(`/admin/attribute-values/${id}`)
}

export async function toggleAdminAttributeValue(id: number): Promise<AttributeValue> {
  const res = await api.put<ApiResponse<AttributeValue>>(`/admin/attribute-values/${id}/toggle`)
  return res.data
}

export async function getAdminColors(params?: CatalogListParams): Promise<Paginated<Color>> {
  const res = await api.get<ApiResponse<Paginated<Color>>>('/admin/colors', { params: toParams(params) })
  return res.data
}

export async function createAdminColor(data: Partial<Color>): Promise<Color> {
  const res = await api.post<ApiResponse<Color>>('/admin/colors', data)
  return res.data
}

export async function updateAdminColor(id: number, data: Partial<Color>): Promise<Color> {
  const res = await api.put<ApiResponse<Color>>(`/admin/colors/${id}`, data)
  return res.data
}

export async function deleteAdminColor(id: number): Promise<void> {
  await api.delete(`/admin/colors/${id}`)
}

export async function toggleAdminColor(id: number): Promise<Color> {
  const res = await api.put<ApiResponse<Color>>(`/admin/colors/${id}/toggle`)
  return res.data
}

export async function getAdminSizeGroups(params?: CatalogListParams): Promise<Paginated<SizeGroup>> {
  const res = await api.get<ApiResponse<Paginated<SizeGroup>>>('/admin/size-groups', {
    params: toParams(params),
  })
  return res.data
}

export async function createAdminSizeGroup(data: Partial<SizeGroup>): Promise<SizeGroup> {
  const res = await api.post<ApiResponse<SizeGroup>>('/admin/size-groups', data)
  return res.data
}

export async function updateAdminSizeGroup(id: number, data: Partial<SizeGroup>): Promise<SizeGroup> {
  const res = await api.put<ApiResponse<SizeGroup>>(`/admin/size-groups/${id}`, data)
  return res.data
}

export async function deleteAdminSizeGroup(id: number): Promise<void> {
  await api.delete(`/admin/size-groups/${id}`)
}

export async function toggleAdminSizeGroup(id: number): Promise<SizeGroup> {
  const res = await api.put<ApiResponse<SizeGroup>>(`/admin/size-groups/${id}/toggle`)
  return res.data
}

export async function getAdminSizes(
  sizeGroupId: number,
  params?: CatalogListParams,
): Promise<Paginated<Size>> {
  const res = await api.get<ApiResponse<Paginated<Size>>>('/admin/sizes', {
    params: { ...toParams(params), size_group_id: sizeGroupId, per_page: 50 },
  })
  return res.data
}

export async function createAdminSize(data: Partial<Size>): Promise<Size> {
  const res = await api.post<ApiResponse<Size>>('/admin/sizes', data)
  return res.data
}

export async function updateAdminSize(id: number, data: Partial<Size>): Promise<Size> {
  const res = await api.put<ApiResponse<Size>>(`/admin/sizes/${id}`, data)
  return res.data
}

export async function deleteAdminSize(id: number): Promise<void> {
  await api.delete(`/admin/sizes/${id}`)
}

export async function toggleAdminSize(id: number): Promise<Size> {
  const res = await api.put<ApiResponse<Size>>(`/admin/sizes/${id}/toggle`)
  return res.data
}

export async function getAdminCategoryTree(): Promise<Category[]> {
  const res = await api.get<ApiResponse<Category[]>>('/admin/categories/tree')
  return res.data
}

export async function toggleAdminCategory(id: number): Promise<Category> {
  const res = await api.put<ApiResponse<Category>>(`/admin/categories/${id}/toggle`)
  return res.data
}