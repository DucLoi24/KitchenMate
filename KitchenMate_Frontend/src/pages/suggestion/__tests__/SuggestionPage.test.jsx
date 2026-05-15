// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SuggestionPage from '../SuggestionPage'

const mockAxiosGet = vi.hoisted(() => vi.fn())
const mockGetSuggestions = vi.hoisted(() => vi.fn())
const mockGetPantry = vi.hoisted(() => vi.fn())

vi.mock('@/lib/axiosInstance', () => ({
  default: {
    get: mockAxiosGet,
  },
}))

vi.mock('@/api/suggestionApi', () => ({
  suggestionApi: {
    getSuggestions: mockGetSuggestions,
  },
}))

vi.mock('@/api/kitchenApi', () => ({
  pantryApi: {
    getPantry: mockGetPantry,
  },
  shoppingListApi: {
    addToShoppingList: vi.fn(),
  },
}))

vi.mock('@/api/socialApi', () => ({
  socialApi: {
    toggleFavorite: vi.fn(),
  },
}))

vi.mock('@/api/adminApi', () => ({
  adminApi: {
    getIngredientUnits: vi.fn(),
  },
}))

vi.mock('@/components/auth/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}))

vi.mock('@/components/auth/GuestCTA', () => ({
  GuestCTA: () => null,
}))

vi.mock('@/components/social/AddToCollectionModal', () => ({
  AddToCollectionModal: () => null,
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
}))

vi.mock('lucide-react', () => ({
  AlertCircle: () => <span data-testid="alert-icon" />,
  ChefHat: () => <span data-testid="chef-icon" />,
  Clock: () => <span data-testid="clock-icon" />,
  Flame: () => <span data-testid="flame-icon" />,
  Heart: () => <span data-testid="heart-icon" />,
  Library: () => <span data-testid="library-icon" />,
  Plus: () => <span data-testid="plus-icon" />,
  Search: () => <span data-testid="search-icon" />,
  ShoppingCart: () => <span data-testid="shopping-cart-icon" />,
  Sparkles: () => <span data-testid="sparkles-icon" />,
  X: () => <span data-testid="x-icon" />,
}))

function renderSuggestionPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SuggestionPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const recipe = {
  id: 'recipe-1',
  title: 'Cơm gà',
  prep_time: 30,
  thumbnail_url: '',
  categories: [],
  recipe_ingredients: [],
  steps: [],
  is_favorited: false,
  is_in_collection: false,
  like_count: 0,
  save_count: 0,
}

describe('SuggestionPage exclude ingredient search', () => {
  beforeEach(() => {
    mockAxiosGet.mockReset()
    mockGetSuggestions.mockReset()
    mockGetPantry.mockReset()

    mockGetSuggestions.mockResolvedValue({
      success: true,
      data: [{ recipe, score: 20, missing_ingredients: [] }],
    })
    mockGetPantry.mockResolvedValue({
      success: true,
      data: [{ id: 1, ingredient: { id: 18, name: 'Thịt gà' }, quantity: 1, unit: 'kg' }],
    })
    mockAxiosGet.mockResolvedValue({
      data: {
        success: true,
        data: [
          {
            id: 18,
            name: 'Thịt gà',
            category: 'PROTEIN',
            status: 'APPROVED',
            category_display: 'Đạm',
          },
        ],
      },
    })
  })

  it('shows backend search results from /ingredients/search/ when excluding ingredients', async () => {
    renderSuggestionPage()

    const input = await screen.findByPlaceholderText('Loại trừ nguyên liệu bạn không muốn nấu...')
    fireEvent.change(input, { target: { value: 'gà' } })

    await waitFor(() => {
      expect(mockAxiosGet).toHaveBeenCalledWith('/ingredients/search/', { params: { q: 'gà' } })
    })

    expect(await screen.findByRole('button', { name: /Thịt gà/ })).toBeInTheDocument()
  })

  it('keeps the selected ingredient name and refetches suggestions with excluded IDs', async () => {
    renderSuggestionPage()

    const input = await screen.findByPlaceholderText('Loại trừ nguyên liệu bạn không muốn nấu...')
    fireEvent.change(input, { target: { value: 'gà' } })

    const option = await screen.findByRole('button', { name: /Thịt gà/ })
    fireEvent.mouseDown(option)

    await waitFor(() => {
      expect(screen.getByText('Thịt gà')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(mockGetSuggestions).toHaveBeenCalledWith('COOK_NOW', [18])
    })
  })

  it('keeps filters and mode controls visible when no suggestions match', async () => {
    mockGetSuggestions.mockResolvedValue({
      success: true,
      data: [],
    })

    renderSuggestionPage()

    expect(await screen.findByText('Không tìm thấy công thức')).toBeInTheDocument()
    expect(screen.getByText('Loại trừ nguyên liệu')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Loại trừ nguyên liệu bạn không muốn nấu...')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Thêm chút nữa' }))

    await waitFor(() => {
      expect(mockGetSuggestions).toHaveBeenCalledWith('ADD_MORE', [])
    })
  })
})
