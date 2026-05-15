// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecipePreview } from '../RecipePreview'

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}))

vi.mock('lucide-react', () => ({
  Eye: () => <span data-testid="eye-icon" />,
  EyeOff: () => <span data-testid="eye-off-icon" />,
  Globe: () => <span data-testid="globe-icon" />,
  Lock: () => <span data-testid="lock-icon" />,
  AlertTriangle: () => <span data-testid="alert-icon" />,
}))

describe('RecipePreview unit display', () => {
  it('uses dynamic allowed unit labels for display and keeps slug out of visible text', () => {
    render(
      <RecipePreview
        recipeData={{
          title: 'Canh thử nghiệm',
          difficulty: 'EASY',
          visibility: 'PRIVATE',
          ingredients: [
            {
              quantity: 2,
              unit: 'chen-admin',
              ingredient_name: 'Nước dùng',
              allowed_units: [{ value: 'chen-admin', label: 'Chén admin' }],
            },
          ],
          steps: [],
        }}
      />
    )

    expect(screen.getByText('2 Chén admin Nước dùng')).toBeTruthy()
    expect(screen.queryByText(/chen-admin/)).toBeNull()
  })
})
