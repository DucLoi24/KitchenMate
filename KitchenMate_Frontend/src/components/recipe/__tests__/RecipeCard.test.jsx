import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecipeCard } from '../RecipeCard'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    article: ({ children, ...props }) => <article {...props}>{children}</article>,
  },
}))

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Clock: () => <span data-testid="clock-icon">Clock</span>,
  Star: () => <span data-testid="star-icon">Star</span>,
  Heart: () => <span data-testid="heart-icon">Heart</span>,
  Library: () => <span data-testid="library-icon">Library</span>,
}))

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: false }),
}))

// Mock API
vi.mock('@/api/socialApi', () => ({
  socialApi: {
    toggleFavorite: vi.fn(),
  },
}))

// Mock child components
vi.mock('@/components/auth/GuestCTA', () => ({
  GuestCTA: () => <div data-testid="guest-cta">Guest CTA</div>,
}))

vi.mock('@/components/social/AddToCollectionModal', () => ({
  AddToCollectionModal: () => <div data-testid="collection-modal">Collection Modal</div>,
}))

const mockRecipe = {
  id: '1',
  title: 'Test Recipe',
  thumbnail: 'https://example.com/image.jpg',
  author: { full_name: 'Test User', avatar: null },
  prep_time: 30,
  difficulty: 'EASY',
  avg_rating: 4.5,
  save_count: 10,
  is_favorited: false,
  is_in_collection: false,
  categories: [],
}

describe('RecipeCard Component', () => {
  describe('Category Badge Display', () => {
    describe('AC-3: Categories with 0, 1, 2+ items', () => {
      it('does not display category badge when categories is empty array', () => {
        const recipeNoCategories = {
          ...mockRecipe,
          categories: [],
        }
        render(<RecipeCard recipe={recipeNoCategories} />)
        // No CategoryBadge should be rendered when categories is empty
        const categoryBadges = document.querySelectorAll('[class*="bg-green-100"], [class*="bg-blue-100"], [class*="bg-purple-100"]')
        expect(categoryBadges.length).toBe(0)
      })

      it('displays single category badge when categories has exactly 1 item', () => {
        const recipeOneCategory = {
          ...mockRecipe,
          categories: [{ id: 'cat-1', slug: 'breakfast', name: 'Bữa sáng' }],
        }
        render(<RecipeCard recipe={recipeOneCategory} />)
        expect(screen.getByText('Bữa sáng')).toBeInTheDocument()
        // Should only have one category badge
        const breakfastBadges = screen.getAllByText('Bữa sáng')
        expect(breakfastBadges.length).toBe(1)
      })

      it('displays first 2 category badges when categories has more than 2 items', () => {
        const recipeMultipleCategories = {
          ...mockRecipe,
          categories: [
            { id: 'cat-1', slug: 'breakfast', name: 'Bữa sáng' },
            { id: 'cat-2', slug: 'lunch', name: 'Bữa trưa' },
            { id: 'cat-3', slug: 'dinner', name: 'Bữa tối' },
          ],
        }
        render(<RecipeCard recipe={recipeMultipleCategories} />)
        expect(screen.getByText('Bữa sáng')).toBeInTheDocument()
        expect(screen.getByText('Bữa trưa')).toBeInTheDocument()
        // Third category should NOT be displayed (only first 2)
        expect(screen.queryByText('Bữa tối')).not.toBeInTheDocument()
      })

      it('displays exactly 2 badges when categories has exactly 2 items', () => {
        const recipeTwoCategories = {
          ...mockRecipe,
          categories: [
            { id: 'cat-1', slug: 'breakfast', name: 'Bữa sáng' },
            { id: 'cat-2', slug: 'lunch', name: 'Bữa trưa' },
          ],
        }
        render(<RecipeCard recipe={recipeTwoCategories} />)
        const breakfastBadges = screen.getAllByText('Bữa sáng')
        const lunchBadges = screen.getAllByText('Bữa trưa')
        expect(breakfastBadges.length).toBe(1)
        expect(lunchBadges.length).toBe(1)
      })
    })

    describe('Badge Positioning', () => {
      it('positions category badges at top-right corner opposite difficulty badge', () => {
        const recipeWithCategory = {
          ...mockRecipe,
          categories: [{ id: 'cat-1', slug: 'breakfast', name: 'Bữa sáng' }],
        }
        const { container } = render(<RecipeCard recipe={recipeWithCategory} />)
        // The category badge container should have right-3 or right-16 (when favorite button shown)
        const categoryContainer = container.querySelector('[class*="right-3"], [class*="right-16"]')
        expect(categoryContainer).toBeTruthy()
      })
    })
  })
})