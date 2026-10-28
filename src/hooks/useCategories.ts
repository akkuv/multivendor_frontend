import { useQuery } from '@tanstack/react-query'
import { getCategories, getAdminCategoriesAll, getCategory } from '@/services/category'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
}

export function useAdminCategoriesAll() {
  return useQuery({
    queryKey: ['admin', 'categories', 'all'],
    queryFn: getAdminCategoriesAll,
  })
}

export function useCategory(id: number | undefined) {
  return useQuery({
    queryKey: ['category', id],
    queryFn: () => getCategory(id as number),
    enabled: id != null,
  })
}
