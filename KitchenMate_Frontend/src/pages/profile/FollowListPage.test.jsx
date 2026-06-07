import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FollowListPage } from './FollowListPage'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}))

vi.mock('@/components/auth/useAuth', () => ({
  useAuth: () => ({ user: null }),
}))

const mockAuthApi = vi.hoisted(() => ({
  getPublicProfile: vi.fn(),
  getFollowers: vi.fn(),
  getFollowing: vi.fn(),
}))

vi.mock('@/api/authApi', () => ({
  authApi: mockAuthApi,
}))

describe('FollowListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthApi.getPublicProfile.mockResolvedValue({
      data: {
        id: 'chef-1',
        full_name: 'Dau bep Bep Nha',
      },
    })
    mockAuthApi.getFollowers.mockResolvedValue({
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 'follower-1',
            full_name: 'Nguoi yeu bep',
            avatar_url: null,
            bio: 'Thich nau an moi ngay',
            followers_count: 2,
            is_following: false,
          },
        ],
      },
    })
    mockAuthApi.getFollowing.mockResolvedValue({
      data: {
        count: 0,
        next: null,
        previous: null,
        results: [],
      },
    })
  })

  function renderPage(initialEntry) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/profile/:userId/:followType" element={<FollowListPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  it('renders a public followers list for a profile', async () => {
    renderPage('/profile/chef-1/followers')

    expect(await screen.findByText('Người theo dõi')).toBeInTheDocument()
    expect(screen.getByText('Dau bep Bep Nha')).toBeInTheDocument()
    expect(screen.getByText('Nguoi yeu bep')).toBeInTheDocument()
    expect(screen.getByText('Thich nau an moi ngay')).toBeInTheDocument()
    expect(mockAuthApi.getFollowers).toHaveBeenCalledWith('chef-1', 1)
    expect(mockAuthApi.getFollowing).not.toHaveBeenCalled()
  })

  it('renders the following list for a profile from the production route', async () => {
    mockAuthApi.getFollowing.mockResolvedValue({
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 'following-1',
            full_name: 'Dau bep dang theo doi',
            avatar_url: null,
            bio: 'Chia se mon chay',
            followers_count: 4,
            is_following: false,
          },
        ],
      },
    })

    renderPage('/profile/chef-1/following')

    expect(await screen.findByText('Đang theo dõi')).toBeInTheDocument()
    expect(screen.getByText('Dau bep dang theo doi')).toBeInTheDocument()
    expect(screen.getByText('Chia se mon chay')).toBeInTheDocument()
    expect(mockAuthApi.getFollowing).toHaveBeenCalledWith('chef-1', 1)
    expect(mockAuthApi.getFollowers).not.toHaveBeenCalled()
  })
})
