import { useInfiniteQuery } from '@tanstack/react-query';
import axiosInstance from '../api/axiosInstance';

const fetchRecipesPopular = async ({ pageParam = 1 }) => {
  const response = await axiosInstance.get('/recipes/', {
    params: {
      sort: 'save_count',
      order: 'desc',
      page: pageParam,
    },
  });
  return {
    data: response.data.results || response.data,
    nextCursor: response.data.next ? pageParam + 1 : undefined,
  };
};

export function useRecipesPopular() {
  return useInfiniteQuery({
    queryKey: ['recipes', 'popular'],
    queryFn: fetchRecipesPopular,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 1,
  });
}