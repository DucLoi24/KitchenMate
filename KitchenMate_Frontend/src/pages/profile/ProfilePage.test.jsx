import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProfilePage } from './ProfilePage'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
}))

const mockAuthApi = vi.hoisted(() => ({
  getUserStats: vi.fn(),
}))

vi.mock('@/api/authApi', () => ({
  authApi: mockAuthApi,
}))

vi.mock('@/components/auth/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      full_name: 'Nguyen Van A',
      email: 'a@example.com',
      bio: 'Thich nau an',
      avatar_url: null,
      created_at: '2026-01-01T00:00:00+07:00',
    },
    updateUser: vi.fn(),
  }),
}))

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthApi.getUserStats.mockResolvedValue({
      data: {
        recipe_count: 2,
        total_likes: 8,
        average_rating: 4.5,
        followers_count: 5,
        following_count: 3,
      },
    })
  })

  it('renders own follow stats with links to public follow lists', async () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    )

    expect(await screen.findByRole('link', { name: /5 người theo dõi/i })).toHaveAttribute(
      'href',
      '/profile/user-1/followers'
    )
    expect(screen.getByRole('link', { name: /3 đang theo dõi/i })).toHaveAttribute(
      'href',
      '/profile/user-1/following'
    )
  })
})
