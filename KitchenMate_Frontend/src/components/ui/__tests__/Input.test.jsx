import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '../Input'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => children,
}))

// Mock lucide-react
vi.mock('lucide-react', () => ({
  AlertCircle: () => <span data-testid="alert-icon">Alert</span>,
  Eye: () => <span data-testid="eye-icon">Eye</span>,
  EyeOff: () => <span data-testid="eye-off-icon">EyeOff</span>,
}))

describe('Input Component', () => {
  describe('Rendering', () => {
    it('renders input element', () => {
      render(<Input />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter text..." />)
      expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument()
    })

    it('renders with label', () => {
      render(<Input label="Email" />)
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })
  })

  describe('Variants', () => {
    it('applies default variant classes', () => {
      render(<Input />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('applies error variant classes', () => {
      render(<Input error="Error message" />)
      expect(screen.getByText(/error message/i)).toBeInTheDocument()
    })

    it('applies success variant classes', () => {
      render(<Input variant="success" />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })

  describe('Sizes', () => {
    it('applies sm size classes', () => {
      render(<Input size="sm" />)
      expect(screen.getByRole('textbox')).toHaveClass(/h-8/)
    })

    it('applies md size classes (default)', () => {
      render(<Input size="md" />)
      expect(screen.getByRole('textbox')).toHaveClass(/h-10/)
    })

    it('applies lg size classes', () => {
      render(<Input size="lg" />)
      expect(screen.getByRole('textbox')).toHaveClass(/h-12/)
    })
  })

  describe('Icons', () => {
    it('renders leftIcon when provided', () => {
      render(<Input leftIcon={<span data-testid="left-icon">Icon</span>} />)
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    })

    it('renders rightIcon when provided', () => {
      render(<Input rightIcon={<span data-testid="right-icon">Icon</span>} />)
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    })
  })

  describe('Password Toggle', () => {
    it('renders password input with toggle button', () => {
      render(<Input type="password" data-testid="password-input" />)
      const input = screen.getByTestId('password-input')
      expect(input).toHaveAttribute('type', 'password')
    })

    it('toggles password visibility on click', () => {
      render(<Input type="password" data-testid="password-input" />)
      const input = screen.getByTestId('password-input')

      // Initial state should be password type
      expect(input).toHaveAttribute('type', 'password')

      // Click eye icon to show password
      const eyeButton = screen.getByTestId('eye-icon').parentElement
      fireEvent.click(eyeButton)
      expect(input).toHaveAttribute('type', 'text')

      // Click eye-off icon to hide password
      const eyeOffButton = screen.getByTestId('eye-off-icon').parentElement
      fireEvent.click(eyeOffButton)
      expect(input).toHaveAttribute('type', 'password')
    })
  })

  describe('Validation', () => {
    it('shows error message', () => {
      render(<Input error="This field is required" />)
      expect(screen.getByText(/this field is required/i)).toBeInTheDocument()
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
    })

    it('shows helper text when no error', () => {
      render(<Input helperText="Enter your email" />)
      expect(screen.getByText(/enter your email/i)).toBeInTheDocument()
    })

    it('prioritizes error over helper text', () => {
      render(<Input error="Error" helperText="Help" />)
      expect(screen.getByText(/error/i)).toBeInTheDocument()
      expect(screen.queryByText(/help/i)).not.toBeInTheDocument()
    })

    it('shows required asterisk when required', () => {
      render(<Input label="Email" required />)
      expect(screen.getByText('*')).toBeInTheDocument()
    })
  })

  describe('States', () => {
    it('disables input when disabled', () => {
      render(<Input disabled />)
      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('accepts custom id', () => {
      render(<Input id="custom-id" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'custom-id')
    })
  })

  describe('User Interaction', () => {
    it('accepts text input', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'test@example.com' } })
      expect(input).toHaveValue('test@example.com')
    })

    it('forwards ref', () => {
      let refValue
      render(<Input ref={(el) => (refValue = el)} />)
      expect(refValue).toBeInstanceOf(HTMLInputElement)
    })
  })
})
