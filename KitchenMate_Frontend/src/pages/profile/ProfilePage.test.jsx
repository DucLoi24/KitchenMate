import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProfilePage } from './ProfilePage'

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
}))

const mockAuthApi = vi.hoisted(() => ({
  getUserStats: vi.fn(),
  changePassword: vi.fn(),
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
    mockAuthApi.changePassword.mockResolvedValue({
      success: true,
      message: 'Đổi mật khẩu thành công.',
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

  it('lets an editing user submit a password change request', async () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /Chỉnh sửa/i }))
    fireEvent.change(screen.getByLabelText(/Mật khẩu hiện tại/i), {
      target: { value: 'OldPass123!' },
    })
    fireEvent.change(screen.getByLabelText(/^Mật khẩu mới/i), {
      target: { value: 'NewPass123!' },
    })
    fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/i), {
      target: { value: 'NewPass123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Đổi mật khẩu/i }))

    await waitFor(() => {
      expect(mockAuthApi.changePassword).toHaveBeenCalledWith({
        old_password: 'OldPass123!',
        new_password: 'NewPass123!',
        new_password_confirm: 'NewPass123!',
      })
    })
  })
})
