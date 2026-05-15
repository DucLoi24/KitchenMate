import { useQuery } from '@tanstack/react-query'
import { suggestionApi } from '@/api/suggestionApi'

export function useSuggestion(mode = 'COOK_NOW', excludeIngredients = [], options = {}) {
  const {
    cookingTime = [],
    categories = [],
    page,
    pageSize,
  } = options

  return useQuery({
    queryKey: ['suggestions', mode, excludeIngredients, cookingTime, categories, page, pageSize],
    queryFn: () => suggestionApi.getSuggestions({
      mode,
      excludeIngredients,
      cookingTime,
      categories,
      page,
      pageSize,
    }),
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export default useSuggestion
