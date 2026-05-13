import { useQuery } from '@tanstack/react-query'
import { socialApi } from '@/api/socialApi'

export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const res = await socialApi.getCollections()
      return res.data?.results || res.data?.data || res.data || []
    },
    staleTime: 1000 * 60 * 5,
  })
}