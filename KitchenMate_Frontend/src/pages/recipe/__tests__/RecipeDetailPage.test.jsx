// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RecipeDetailPage } from '../RecipeDetailPage'

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  useScroll: () => ({ scrollYProgress: {} }),
  useTransform: () => 0,
}))

vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    context: vi.fn((callback) => {
      callback()
      return { revert: vi.fn() }
    }),
    to: vi.fn(),
  },
}))

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}))

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}))

vi.mock('@/components/recipe/ReviewsSection', () => ({
  ReviewsSection: () => null,
}))

vi.mock('@/components/social/AddToCollectionModal', () => ({
  AddToCollectionModal: () => null,
}))

vi.mock('@/components/report/ReportModal', () => ({
  ReportModal: () => null,
}))

const mockUseRecipe = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/useRecipes', () => ({
  useRecipe: mockUseRecipe,
}))

vi.mock('@/hooks/useKitchen', () => ({
  useAddToShoppingList: () => ({ mutateAsync: vi.fn() }),
  useShoppingList: () => ({ data: { data: { results: [] } } }),
  usePantry: () => ({ data: { data: { results: [] } } }),
}))

vi.mock('@/components/auth/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}))

vi.mock('@/api/recipeApi', () => ({
  recipeApi: {
    getRecipes: vi.fn().mockResolvedValue({ data: { results: [] } }),
  },
}))

describe('RecipeDetailPage author info', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseRecipe.mockReturnValue({
      data: {
        data: {
          id: 'recipe-1',
          title: 'Trứng rán',
          description: 'Trứng rán đơn giản',
          difficulty: 'EASY',
          prep_time: 15,
          thumbnail_url: '/media/recipes/trung-ran.jpg',
          user: {
            id: 'user-1',
            full_name: 'Nguyễn Đức Lợi',
            avatar_url: '/media/avatars/duc-loi.jpg',
          },
          categories: [],
          recipe_ingredients: [],
          steps: [],
          avg_rating: null,
          like_count: 0,
          is_favorited: false,
        },
      },
      isLoading: false,
      error: null,
    })
  })

  it('renders recipe creator name and avatar_url from detail API response', async () => {
    render(
      <MemoryRouter initialEntries={['/recipe/recipe-1']}>
        <Routes>
          <Route path="/recipe/:id" element={<RecipeDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: /Nguyễn Đức Lợi/i })).toHaveAttribute('href', '/profile/user-1')
    expect(screen.getByRole('img', { name: 'Nguyễn Đức Lợi' })).toHaveAttribute('src', '/media/avatars/duc-loi.jpg')
    expect(screen.getByText('Nguyễn Đức Lợi')).toHaveClass('text-[var(--color-text)]')
  })
})
