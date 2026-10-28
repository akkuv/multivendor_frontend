import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAdminAttribute,
  createAdminAttributeValue,
  createAdminBrand,
  createAdminCollection,
  createAdminColor,
  createAdminSize,
  createAdminSizeGroup,
  deleteAdminAttribute,
  deleteAdminAttributeValue,
  deleteAdminBrand,
  deleteAdminCollection,
  deleteAdminColor,
  deleteAdminSize,
  deleteAdminSizeGroup,
  getAdminAttribute,
  getAdminAttributeValues,
  getAdminAttributes,
  getAdminBrands,
  getAdminCategoryTree,
  getAdminCollections,
  getAdminColors,
  getAdminSizeGroups,
  getAdminSizes,
  getBrands,
  getCollection,
  getCollections,
  toggleAdminAttribute,
  toggleAdminAttributeValue,
  toggleAdminBrand,
  toggleAdminCategory,
  toggleAdminCollection,
  toggleAdminColor,
  toggleAdminSize,
  toggleAdminSizeGroup,
  updateAdminAttribute,
  updateAdminAttributeValue,
  updateAdminBrand,
  updateAdminCollection,
  updateAdminColor,
  updateAdminSize,
  updateAdminSizeGroup,
} from '@/services/catalog'
import type { Attribute, CatalogListParams, Collection } from '@/types'

export const useBrands = () =>
  useQuery({ queryKey: ['brands'], queryFn: getBrands })

export const useCollections = (params?: { gender?: string }) =>
  useQuery({ queryKey: ['collections', params], queryFn: () => getCollections(params) })

export const useCollection = (slug: string | undefined) =>
  useQuery({
    queryKey: ['collection', slug],
    queryFn: () => getCollection(slug as string),
    enabled: Boolean(slug),
  })

export const useAdminCollections = (params?: CatalogListParams) =>
  useQuery({ queryKey: ['admin', 'collections', params], queryFn: () => getAdminCollections(params) })

export const useCreateAdminCollection = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAdminCollection,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'collections'] }),
  })
}

export const useUpdateAdminCollection = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Collection> }) =>
      updateAdminCollection(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'collections'] }),
  })
}

export const useDeleteAdminCollection = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminCollection,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'collections'] }),
  })
}

export const useToggleAdminCollection = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: toggleAdminCollection,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'collections'] }),
  })
}

export const useAdminBrands = (params?: CatalogListParams) =>
  useQuery({ queryKey: ['admin', 'brands', params], queryFn: () => getAdminBrands(params) })

export const useCreateAdminBrand = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAdminBrand,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'brands'] }),
  })
}

export const useUpdateAdminBrand = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ name: string; description: string | null; logo: string | null; is_active: boolean; meta_title: string | null; meta_description: string | null }> }) =>
      updateAdminBrand(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'brands'] }),
  })
}

export const useDeleteAdminBrand = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminBrand,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'brands'] }),
  })
}

export const useToggleAdminBrand = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: toggleAdminBrand,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'brands'] }),
  })
}

export const useAdminAttributes = (params?: CatalogListParams) =>
  useQuery({ queryKey: ['admin', 'attributes', params], queryFn: () => getAdminAttributes(params) })

export const useAdminAttribute = (id: number | null) =>
  useQuery({
    queryKey: ['admin', 'attributes', id],
    queryFn: () => getAdminAttribute(id as number),
    enabled: id !== null,
  })

export const useCreateAdminAttribute = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAdminAttribute,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'attributes'] }),
  })
}

export const useUpdateAdminAttribute = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Attribute> }) =>
      updateAdminAttribute(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'attributes'] }),
  })
}

export const useDeleteAdminAttribute = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminAttribute,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'attributes'] }),
  })
}

export const useToggleAdminAttribute = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: toggleAdminAttribute,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'attributes'] }),
  })
}

export const useAdminAttributeValues = (attributeId: number, params?: CatalogListParams) =>
  useQuery({
    queryKey: ['admin', 'attribute-values', attributeId, params],
    queryFn: () => getAdminAttributeValues(attributeId, params),
    enabled: attributeId > 0,
  })

export const useCreateAdminAttributeValue = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAdminAttributeValue,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'attribute-values'] }),
  })
}

export const useUpdateAdminAttributeValue = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ value: string; sort_order: number; is_active: boolean; swatch_color: string | null; swatch_image: string | null; attribute_id: number }> }) =>
      updateAdminAttributeValue(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'attribute-values'] }),
  })
}

export const useDeleteAdminAttributeValue = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminAttributeValue,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'attribute-values'] }),
  })
}

export const useToggleAdminAttributeValue = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: toggleAdminAttributeValue,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'attribute-values'] }),
  })
}

export const useAdminColors = (params?: CatalogListParams) =>
  useQuery({ queryKey: ['admin', 'colors', params], queryFn: () => getAdminColors(params) })

export const useCreateAdminColor = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAdminColor,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'colors'] }),
  })
}

export const useUpdateAdminColor = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ name: string; hex_code: string | null; is_active: boolean }> }) =>
      updateAdminColor(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'colors'] }),
  })
}

export const useDeleteAdminColor = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminColor,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'colors'] }),
  })
}

export const useToggleAdminColor = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: toggleAdminColor,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'colors'] }),
  })
}

export const useAdminSizeGroups = (params?: CatalogListParams) =>
  useQuery({ queryKey: ['admin', 'size-groups', params], queryFn: () => getAdminSizeGroups(params) })

export const useCreateAdminSizeGroup = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAdminSizeGroup,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'size-groups'] }),
  })
}

export const useUpdateAdminSizeGroup = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ name: string; description: string | null; is_active: boolean }> }) =>
      updateAdminSizeGroup(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'size-groups'] }),
  })
}

export const useDeleteAdminSizeGroup = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminSizeGroup,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'size-groups'] }),
  })
}

export const useToggleAdminSizeGroup = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: toggleAdminSizeGroup,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'size-groups'] }),
  })
}

export const useAdminSizes = (sizeGroupId: number, params?: CatalogListParams) =>
  useQuery({
    queryKey: ['admin', 'sizes', sizeGroupId, params],
    queryFn: () => getAdminSizes(sizeGroupId, params),
    enabled: sizeGroupId > 0,
  })

export const useCreateAdminSize = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAdminSize,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'sizes'] }),
  })
}

export const useUpdateAdminSize = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ name: string; sort_order: number; is_active: boolean; size_group_id: number }> }) =>
      updateAdminSize(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'sizes'] }),
  })
}

export const useDeleteAdminSize = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminSize,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'sizes'] }),
  })
}

export const useToggleAdminSize = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: toggleAdminSize,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'sizes'] }),
  })
}

export const useAdminCategoryTree = () =>
  useQuery({ queryKey: ['admin', 'categories', 'tree'], queryFn: getAdminCategoryTree })

export const useToggleAdminCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: toggleAdminCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}