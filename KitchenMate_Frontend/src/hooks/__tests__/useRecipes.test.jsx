import { describe, it, expect, vi, afterEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useUpdateRecipe } from '../useRecipes'
import { recipeApi } from '@/api/recipeApi'

vi.mock('@/api/recipeApi', () => ({
  recipeApi: {
    updateRecipe: vi.fn(),
  },
}))

function createWrapper(queryClient) {
  return function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useUpdateRecipe', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('updates the detail cache with the saved recipe returned by the API', async () => {
    const recipeId = 'recipe-123'
    const oldDetail = {
      success: true,
      data: {
        id: recipeId,
        title: 'Canh chua before edit',
        visibility: 'PRIVATE',
      },
    }
    const updatedDetail = {
      success: true,
      message: 'Cap nhat cong thuc thanh cong.',
      data: {
        id: recipeId,
        title: 'Canh chua after edit',
        visibility: 'PRIVATE',
      },
    }
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5,
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    })
    queryClient.setQueryData(['recipe', recipeId], oldDetail)
    recipeApi.updateRecipe.mockResolvedValue(updatedDetail)

    const { result } = renderHook(() => useUpdateRecipe(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({
        id: recipeId,
        data: { title: 'Canh chua after edit' },
      })
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(['recipe', recipeId])).toEqual(updatedDetail)
    })
  })
})
