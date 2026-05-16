import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Header } from './Header'

vi.mock('@/components/auth/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    logout: vi.fn(),
  }),
}))

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}{location.search}</div>
}

describe('Header', () => {
  it('submits desktop search to global Explore results', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Header onMenuToggle={vi.fn()} isSidebarOpen={false} />
        <Routes>
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    )

    const input = screen.getByPlaceholderText('Tìm công thức, người dùng...')
    fireEvent.change(input, { target: { value: 'bep nha' } })
    fireEvent.submit(input.closest('form'))

    expect(screen.getByTestId('location')).toHaveTextContent('/explore?q=bep%20nha&tab=all')
  })
})
