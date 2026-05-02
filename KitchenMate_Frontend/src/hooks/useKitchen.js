import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pantryApi, shoppingListApi } from '@/api/kitchenApi'

export function usePantry() {
  return useQuery({
    queryKey: ['pantry'],
    queryFn: pantryApi.getPantry,
  })
}

export function useAddToPantry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: pantryApi.addToPantry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pantry'] })
    },
  })
}

export function useUpdatePantryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => pantryApi.updatePantryItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pantry'] })
    },
  })
}

export function useRemoveFromPantry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: pantryApi.removeFromPantry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pantry'] })
    },
  })
}

export function useShoppingList() {
  return useQuery({
    queryKey: ['shopping-list'],
    queryFn: shoppingListApi.getShoppingList,
  })
}

export function useAddToShoppingList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: shoppingListApi.addToShoppingList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] })
    },
  })
}

export function useUpdateShoppingItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => shoppingListApi.updateShoppingItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] })
    },
  })
}

export function useRemoveFromShoppingList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: shoppingListApi.removeFromShoppingList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] })
    },
  })
}

export function useMarkAsPurchased() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: shoppingListApi.markAsPurchased,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] })
      queryClient.invalidateQueries({ queryKey: ['pantry'] })
    },
  })
}

export function useMarkAsUnpurchased() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: shoppingListApi.markAsUnpurchased,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] })
      queryClient.invalidateQueries({ queryKey: ['pantry'] })
    },
  })
}

export default {
  usePantry,
  useAddToPantry,
  useUpdatePantryItem,
  useRemoveFromPantry,
  useShoppingList,
  useAddToShoppingList,
  useUpdateShoppingItem,
  useRemoveFromShoppingList,
  useMarkAsPurchased,
  useMarkAsUnpurchased,
}