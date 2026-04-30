import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['recipe', data.id] })
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
}