// KitchenMate_Frontend/kitchenmate-frontend/src/hooks/useShoppingList.js
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shoppingListApi } from '../api/shoppingListApi';
import toast from 'react-hot-toast';

export function useShoppingList() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['shopping-list'],
    queryFn: shoppingListApi.getShoppingList,
  });

  // Group items into purchased / unpurchased
  const groupedItems = React.useMemo(() => {
    const items = data?.data?.results || data?.data || [];
    return {
      unpurchased: items.filter(item => !item.is_purchased),
      purchased: items.filter(item => item.is_purchased),
    };
  }, [data]);

  const addMutation = useMutation({
    mutationFn: shoppingListApi.addShoppingListItem,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] });
      toast.success(data?.message || 'Đã thêm vào danh sách đi chợ');
    },
    onError: () => toast.error('Không thể thêm vào danh sách đi chợ'),
  });

  const deleteMutation = useMutation({
    mutationFn: shoppingListApi.deleteShoppingListItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] });
      toast.success('Đã xóa khỏi danh sách');
    },
    onError: () => toast.error('Không thể xóa'),
  });

  const markPurchasedMutation = useMutation({
    mutationFn: shoppingListApi.markPurchased,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] });
      queryClient.invalidateQueries({ queryKey: ['pantry'] });
      toast.success(data?.message || 'Đã thêm vào tủ lạnh');
    },
    onError: () => toast.error('Không thể đánh dấu đã mua'),
  });

  const markUnpurchasedMutation = useMutation({
    mutationFn: shoppingListApi.markUnpurchased,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] });
      queryClient.invalidateQueries({ queryKey: ['pantry'] });
      toast.success(data?.message || 'Đã bỏ khỏi tủ lạnh');
    },
    onError: () => toast.error('Không thể hoàn tác'),
  });

  return {
    groupedItems,
    isLoading,
    error,
    refetch,
    addItem: addMutation.mutate,
    deleteItem: deleteMutation.mutate,
    markPurchased: markPurchasedMutation.mutate,
    markUnpurchased: markUnpurchasedMutation.mutate,
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMarkingPurchased: markPurchasedMutation.isPending,
    isUnmarking: markUnpurchasedMutation.isPending,
  };
}