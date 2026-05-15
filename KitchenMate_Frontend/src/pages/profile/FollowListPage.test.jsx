import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
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

  it('renders a public followers list for a profile', async () => {
    render(
      <MemoryRouter initialEntries={['/profile/chef-1/followers']}>
        <Routes>
          <Route path="/profile/:userId/:followType" element={<FollowListPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Người theo dõi')).toBeInTheDocument()
    expect(screen.getByText('Dau bep Bep Nha')).toBeInTheDocument()
    expect(screen.getByText('Nguoi yeu bep')).toBeInTheDocument()
    expect(screen.getByText('Thich nau an moi ngay')).toBeInTheDocument()
    expect(mockAuthApi.getFollowers).toHaveBeenCalledWith('chef-1', 1)
  })
})
