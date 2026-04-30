import { useQuery } from '@tanstack/react-query'
import { suggestionApi } from '@/api/suggestionApi'

export function useSuggestion(mode = 'COOK_NOW', excludeIngredients = []) {
  return useQuery({
    queryKey: ['suggestions', mode, excludeIngredients],
    queryFn: () => suggestionApi.getSuggestions(mode, excludeIngredients),
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export default useSuggestion