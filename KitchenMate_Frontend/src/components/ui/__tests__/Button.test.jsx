import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
}))

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader">Loading...</span>,
}))

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders with children text', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('renders primary variant', () => {
      render(<Button variant="primary">Primary</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders accent variant', () => {
      render(<Button variant="accent">Accent</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders outline variant', () => {
      render(<Button variant="outline">Outline</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders danger variant', () => {
      render(<Button variant="danger">Danger</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders sm size', () => {
      render(<Button size="sm">Small</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders md size', () => {
      render(<Button size="md">Medium</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders lg size', () => {
      render(<Button size="lg">Large</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders icon size', () => {
      render(<Button size="icon">Icon</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('States', () => {
    it('shows loading state with spinner', () => {
      render(<Button isLoading>Loading</Button>)
      expect(screen.getByTestId('loader')).toBeInTheDocument()
    })

    it('disables button when disabled', () => {
      render(<Button disabled>Disabled</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('disables button when loading', () => {
      render(<Button isLoading>Loading</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('Icons', () => {
    it('renders leftIcon when provided', () => {
      render(
        <Button leftIcon={<span data-testid="left-icon">Icon</span>}>
          With Left Icon
        </Button>
      )
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    })

    it('renders rightIcon when provided', () => {
      render(
        <Button rightIcon={<span data-testid="right-icon">Icon</span>}>
          With Right Icon
        </Button>
      )
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    })

    it('does not render rightIcon when loading', () => {
      render(
        <Button isLoading rightIcon={<span data-testid="right-icon">Icon</span>}>
          Loading
        </Button>
      )
      expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn()
      render(<Button disabled onClick={handleClick}>Disabled</Button>)
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('does not call onClick when loading', () => {
      const handleClick = vi.fn()
      render(<Button isLoading onClick={handleClick}>Loading</Button>)
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Type', () => {
    it('defaults to type="button"', () => {
      render(<Button>Button</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })

    it('accepts type="submit"', () => {
      render(<Button type="submit">Submit</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })

    it('accepts type="reset"', () => {
      render(<Button type="reset">Reset</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset')
    })
  })
})
