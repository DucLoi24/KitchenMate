// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PantryItem } from './PantryItem'

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}))

vi.mock('lucide-react', () => ({
  Check: () => <span data-testid="check-icon" />,
  Pencil: () => <span data-testid="pencil-icon" />,
  Trash2: () => <span data-testid="trash-icon" />,
  X: () => <span data-testid="x-icon" />,
}))

const pantryGroup = {
  id: 'ingredient-70',
  ingredient: 70,
  ingredient_name: 'Chả bò',
  ingredient_category: 'PROTEIN',
  variants: [
    {
      id: 50,
      ingredient: 70,
      ingredient_name: 'Chả bò',
      ingredient_category: 'PROTEIN',
      quantity: 600,
      unit: 'g',
      unit_display: 'Gram',
    },
    {
      id: 58,
      ingredient: 70,
      ingredient_name: 'Chả bò',
      ingredient_category: 'PROTEIN',
      quantity: 2,
      unit: 'kg',
      unit_display: 'Kilogram',
    },
  ],
}

describe('PantryItem grouped units', () => {
  it('renders multiple unit variants under one ingredient card', () => {
    render(<PantryItem item={pantryGroup} onUpdate={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText('Chả bò')).toBeTruthy()
    expect(screen.getByText('2 đơn vị')).toBeTruthy()
    expect(screen.getByText('600')).toBeTruthy()
    expect(screen.getByText('Gram')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
    expect(screen.getByText('Kilogram')).toBeTruthy()
  })

  it('updates the selected unit variant by pantry row id', () => {
    const onUpdate = vi.fn()
    render(<PantryItem item={pantryGroup} onUpdate={onUpdate} onDelete={vi.fn()} />)

    fireEvent.click(screen.getByLabelText('Sửa Kilogram'))
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '3' } })
    fireEvent.click(screen.getByLabelText('Lưu Kilogram'))

    expect(onUpdate).toHaveBeenCalledWith(58, { quantity: 3 })
  })

  it('deletes the selected unit variant by pantry row id', () => {
    const onDelete = vi.fn()
    render(<PantryItem item={pantryGroup} onUpdate={vi.fn()} onDelete={onDelete} />)

    fireEvent.click(screen.getByLabelText('Xóa Gram'))
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))

    expect(onDelete).toHaveBeenCalledWith(50)
  })
})
