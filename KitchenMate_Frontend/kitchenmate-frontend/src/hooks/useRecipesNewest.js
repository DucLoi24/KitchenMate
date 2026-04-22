import { useInfiniteQuery } from '@tanstack/react-query';
import axiosInstance from '../api/axiosInstance';

const fetchRecipesNewest = async ({ pageParam = 1 }) => {
  const response = await axiosInstance.get('/recipes/', {
    params: {
      sort: 'created_at',
      order: 'desc',
      page: pageParam,
    },
  });
  return {
    data: response.data.results || response.data,
    nextCursor: response.data.next ? pageParam + 1 : undefined,
  };
};

export function useRecipesNewest() {
  return useInfiniteQuery({
    queryKey: ['recipes', 'newest'],
    queryFn: fetchRecipesNewest,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 1,
  });
}