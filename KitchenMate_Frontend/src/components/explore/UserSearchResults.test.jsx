import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { UserSearchResults } from './UserSearchResults'

describe('UserSearchResults', () => {
  it('renders user search cards with profile links and follow action', () => {
    const onToggleFollow = vi.fn()
    const users = [
      {
        id: 'da8aa8b5-0086-4ed9-93ef-79293f32759c',
        full_name: 'Dau bep Bep Nha',
        avatar_url: null,
        bio: 'Thich nau mon Viet',
        followers_count: 3,
        is_following: false,
      },
    ]

    render(
      <MemoryRouter>
        <UserSearchResults
          users={users}
          searchQuery="bep nha"
          currentUser={{ id: 'viewer-1' }}
          onToggleFollow={onToggleFollow}
        />
      </MemoryRouter>
    )

    expect(screen.getByText('Dau bep Bep Nha')).toBeInTheDocument()
    expect(screen.getByText('Thich nau mon Viet')).toBeInTheDocument()
    expect(screen.getByText('3 người theo dõi')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Dau bep Bep Nha/i })).toHaveAttribute(
      'href',
      '/profile/da8aa8b5-0086-4ed9-93ef-79293f32759c'
    )

    fireEvent.click(screen.getByRole('button', { name: /^Theo dõi$/i }))
    expect(onToggleFollow).toHaveBeenCalledWith(users[0])
  })
})
