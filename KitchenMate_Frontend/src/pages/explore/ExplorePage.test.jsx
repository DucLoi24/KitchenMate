import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ExplorePage } from './ExplorePage'

const useRecipesInfiniteMock = vi.fn()

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
  },
  useScroll: () => ({ scrollYProgress: 0 }),
  useTransform: () => 0,
}))

vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    context: () => ({ revert: vi.fn() }),
    to: vi.fn(),
  },
}))

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}))

vi.mock('@/hooks/useRecipes', () => ({
  useRecipesInfinite: (params) => useRecipesInfiniteMock(params),
}))

vi.mock('@/api/authApi', () => ({
  authApi: {
    searchUsers: vi.fn().mockResolvedValue({
      success: true,
      data: { count: 0, next: null, previous: null, results: [] },
    }),
    followUser: vi.fn(),
    unfollowUser: vi.fn(),
  },
}))

vi.mock('@/components/auth/useAuth', () => ({
  useAuth: () => ({ user: null }),
}))

vi.mock('@/components/explore', () => ({
  SearchBar: ({ value }) => <input aria-label="search" value={value} readOnly />,
  CategoryFilter: () => null,
  FilterSidebar: () => null,
  FilterBottomSheet: () => null,
  SortDropdown: () => null,
  RecipeGrid: () => null,
  EmptyState: () => null,
  UserSearchResults: () => null,
}))

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}{location.search}</div>
}

function renderExplore(initialEntry) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            path="/explore"
            element={(
              <>
                <ExplorePage />
                <LocationProbe />
              </>
            )}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('ExplorePage search tabs', () => {
  it('maps popular sort to popular_score ordering', () => {
    useRecipesInfiniteMock.mockReturnValue({
      data: { pages: [{ data: { results: [] } }] },
      isLoading: false,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    })

    renderExplore('/explore?sort=popular')

    expect(useRecipesInfiniteMock).toHaveBeenCalledWith(
      expect.objectContaining({ ordering: '-popular_score' })
    )
  })

  it('keeps the recipes tab selected when a search query is present', async () => {
    useRecipesInfiniteMock.mockReturnValue({
      data: { pages: [{ data: { results: [] } }] },
      isLoading: false,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    })

    renderExplore('/explore?q=pho&tab=all')

    fireEvent.click(screen.getByRole('button', { name: 'Công thức' }))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/explore?q=pho&tab=recipes')
    })
  })
})
