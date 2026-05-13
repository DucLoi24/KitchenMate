// KitchenMate_Frontend/src/hooks/useCollections.js
import { useQuery } from '@tanstack/react-query'
import { socialApi } from '@/api/socialApi'

export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const res = await socialApi.getCollections()
      // Backend wraps paginated response as {success, data: {count, next, previous, results}}
      // Non-paginated: res.data = array directly
      return res.data?.results || res.data?.data || res.data || []
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useFavoritesCount(collections) {
  const favorites = collections?.find(c => c.is_favorites)
  return favorites?.recipe_count || 0
}

export function useSavedCount(collections) {
  if (!Array.isArray(collections)) return 0
  // Sum all recipe_count except favorites (to avoid double counting)
  return collections.reduce((sum, c) => {
    if (c.is_favorites) return sum
    return sum + (c.recipe_count || 0)
  }, 0)
}

export default { useCollections, useFavoritesCount, useSavedCount }