// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { RecipeDetailPage } from '../RecipeDetailPage'
import { recipeApi } from '@/api/recipeApi'

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    article: ({ children, ...props }) => <article {...props}>{children}</article>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
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

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

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
    recipeApi.getRecipes.mockResolvedValue({ data: { results: [] } })
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

  it('preserves line breaks when rendering recipe step instructions', async () => {
    const instruction = 'Sơ chế nguyên liệu.\n\nƯớp thịt trong 15 phút.\nCho vào chảo và đảo đều.'
    mockUseRecipe.mockReturnValue({
      data: {
        data: {
          id: 'recipe-1',
          title: 'Thịt kho',
          description: 'Món ăn gia đình',
          difficulty: 'EASY',
          prep_time: 30,
          thumbnail_url: null,
          user: {
            id: 'user-1',
            full_name: 'Nguyễn Đức Lợi',
            avatar_url: '/media/avatars/duc-loi.jpg',
          },
          categories: [],
          recipe_ingredients: [],
          steps: [
            {
              id: 1,
              step_number: 1,
              instruction,
              media_url: null,
              media_items: [],
            },
          ],
          avg_rating: null,
          like_count: 0,
          is_favorited: false,
        },
      },
      isLoading: false,
      error: null,
    })

    render(
      <MemoryRouter initialEntries={['/recipe/recipe-1']}>
        <Routes>
          <Route path="/recipe/:id" element={<RecipeDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    const instructionNode = screen.getByText((_, node) => (
      node?.tagName === 'P' && node.textContent === instruction
    ))
    expect(instructionNode).toHaveClass('whitespace-pre-line')
  })

  it('navigates when clicking a related recipe card', async () => {
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
          categories: [{ id: 'category-1', name: 'Món Việt', slug: 'mon-viet' }],
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
    recipeApi.getRecipes.mockResolvedValue({
      data: {
        results: [
          {
            id: 'recipe-1',
            title: 'Trứng rán',
            thumbnail_url: '/media/recipes/trung-ran.jpg',
            user_name: 'Nguyễn Đức Lợi',
            user_avatar: null,
            prep_time: 15,
            difficulty: 'EASY',
            avg_rating: null,
            save_count: 0,
          },
          {
            id: 'recipe-2',
            title: 'Canh chua cá',
            thumbnail_url: '/media/recipes/canh-chua.jpg',
            user_name: 'Bếp Nhà',
            user_avatar: null,
            prep_time: 35,
            difficulty: 'MEDIUM',
            avg_rating: 4.5,
            save_count: 3,
          },
        ],
      },
    })

    render(
      <MemoryRouter initialEntries={['/recipe/recipe-1']}>
        <LocationProbe />
        <Routes>
          <Route path="/recipe/:id" element={<RecipeDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Canh chua cá')).toBeInTheDocument()
    expect(screen.queryAllByText('Trứng rán')).toHaveLength(1)

    fireEvent.click(screen.getByText('Canh chua cá'))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/recipe/recipe-2')
    })
  })
})
