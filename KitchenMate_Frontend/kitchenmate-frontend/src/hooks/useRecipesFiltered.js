// KitchenMate_Frontend/kitchenmate-frontend/src/hooks/useRecipesFiltered.js
import { useQuery } from '@tanstack/react-query';
import { recipeApi } from '../api/recipeApi';

export function useRecipesFiltered(params) {
  return useQuery({
    queryKey: ['recipes', 'filtered', params],
    queryFn: () => recipeApi.searchRecipes(params),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });
}