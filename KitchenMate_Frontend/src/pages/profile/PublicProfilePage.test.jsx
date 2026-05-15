import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PublicProfilePage } from './PublicProfilePage'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
}))

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
  toast: { error: vi.fn(), success: vi.fn() },
}))

const mockCurrentUser = vi.hoisted(() => ({ value: null }))

vi.mock('@/components/auth/useAuth', () => ({
  useAuth: () => ({ user: mockCurrentUser.value }),
}))

vi.mock('@/components/report/ReportModal', () => ({
  ReportModal: () => null,
}))

const mockAuthApi = vi.hoisted(() => ({
  getPublicProfile: vi.fn(),
  getUserStats: vi.fn(),
  getUserRecipes: vi.fn(),
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
}))

vi.mock('@/api/authApi', () => ({
  authApi: mockAuthApi,
}))

describe('PublicProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentUser.value = null
    mockAuthApi.getPublicProfile.mockResolvedValue({
      data: {
        id: 'user-1',
        full_name: 'Nguyen Van A',
        avatar_url: null,
        bio: '',
        created_at: '2026-01-01T00:00:00+07:00',
      },
    })
    mockAuthApi.getUserStats.mockResolvedValue({
      data: {
        recipe_count: 1,
        total_likes: 0,
        average_rating: null,
        followers_count: 0,
        following_count: 0,
        is_following: false,
      },
    })
    mockAuthApi.getUserRecipes.mockResolvedValue({
      data: {
        results: [
          {
            id: 'recipe-1',
            title: 'Mon chua co danh gia',
            thumbnail_url: '/media/recipes/test.jpg',
            avg_rating: null,
            prep_time: 15,
            difficulty: 'EASY',
          },
        ],
      },
    })
  })

  it('renders public recipes without crashing when avg_rating is null', async () => {
    render(
      <MemoryRouter initialEntries={['/profile/user-1']}>
        <Routes>
          <Route path="/profile/:userId" element={<PublicProfilePage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Mon chua co danh gia')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Chưa có đánh giá')).toBeInTheDocument()
    })
    expect(screen.getByText('Dễ')).toBeInTheDocument()
    expect(screen.queryByText('Bộ sưu tập')).not.toBeInTheDocument()
  })

  it('renders the existing following state from user stats', async () => {
    mockCurrentUser.value = { id: 'viewer-1' }
    mockAuthApi.getUserStats.mockResolvedValueOnce({
      data: {
        recipe_count: 1,
        total_likes: 0,
        average_rating: null,
        followers_count: 7,
        following_count: 3,
        is_following: true,
      },
    })

    render(
      <MemoryRouter initialEntries={['/profile/user-1']}>
        <Routes>
          <Route path="/profile/:userId" element={<PublicProfilePage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByRole('button', { name: /Đã theo dõi/i })).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('người theo dõi')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('đang theo dõi')).toBeInTheDocument()
  })

  it('calls follow API and updates the follow button', async () => {
    mockCurrentUser.value = { id: 'viewer-1' }
    mockAuthApi.followUser.mockResolvedValueOnce({
      data: { is_following: true },
    })

    render(
      <MemoryRouter initialEntries={['/profile/user-1']}>
        <Routes>
          <Route path="/profile/:userId" element={<PublicProfilePage />} />
        </Routes>
      </MemoryRouter>
    )

    fireEvent.click(await screen.findByRole('button', { name: /^Theo dõi$/i }))

    await waitFor(() => {
      expect(mockAuthApi.followUser).toHaveBeenCalledWith('user-1')
    })
    expect(await screen.findByRole('button', { name: /Đã theo dõi/i })).toBeInTheDocument()
  })
})
