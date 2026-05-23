import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { recipeApi } from '@/api/recipeApi'

export function useRecipes(params = {}) {
  return useQuery({
    queryKey: ['recipes', params],
    queryFn: () => recipeApi.getRecipes(params),
  })
}

export function useRecipe(id) {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: () => recipeApi.getRecipe(id),
    enabled: !!id,
  })
}

export function useMyRecipes() {
  return useQuery({
    queryKey: ['my-recipes'],
    queryFn: recipeApi.getMyRecipes,
  })
}

export function useCreateRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: recipeApi.createRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['my-recipes'] })
    },
  })
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => recipeApi.updateRecipe(id, data),
    onSuccess: (data, variables) => {
      const recipeId = data?.data?.id || variables?.id
      if (recipeId) {
        queryClient.setQueryData(['recipe', recipeId], data)
        queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] })
      }
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['my-recipes'] })
    },
  })
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: recipeApi.deleteRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['my-recipes'] })
      queryClient.invalidateQueries({ queryKey: ['trash-recipes'] })
    },
  })
}

export function useTrashRecipes() {
  return useQuery({
    queryKey: ['trash-recipes'],
    queryFn: recipeApi.getTrashRecipes,
    retry: false,
    throwOnError: false,
  })
}

export function useRestoreRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: recipeApi.restoreRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['my-recipes'] })
      queryClient.invalidateQueries({ queryKey: ['trash-recipes'] })
    },
  })
}

function extractPageNumber(url) {
  if (!url) return undefined
  const match = url.match(/[?&]page=(\d+)/)
  return match ? match[1] : undefined
}

export function useRecipesInfinite(baseParams = {}) {
  return useInfiniteQuery({
    queryKey: ['recipes', 'infinite', baseParams],
    queryFn: ({ pageParam = 1 }) =>
      recipeApi.getRecipes({ ...baseParams, page: pageParam, page_size: 12 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // API response: { success: true, data: { count, next, previous, results } }
      const nextPage = lastPage?.data?.next
      if (!nextPage) return undefined
      return extractPageNumber(nextPage)
    },
  })
}

export default {
  useRecipes,
  useRecipe,
  useMyRecipes,
  useCreateRecipe,
  useUpdateRecipe,
  useDeleteRecipe,
  useTrashRecipes,
  useRestoreRecipe,
  useRecipesInfinite,
}
