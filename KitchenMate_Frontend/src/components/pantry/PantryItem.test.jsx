// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PantryItem } from './PantryItem'
import { adminApi } from '@/api/adminApi'

vi.mock('@/api/adminApi', () => ({
  adminApi: {
    getIngredientUnits: vi.fn(),
  },
}))

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
  beforeEach(() => {
    adminApi.getIngredientUnits.mockResolvedValue({
      data: {
        default_unit: { id: 1, name: 'Gram', slug: 'g', is_active: true },
        allowed_units: [
          { id: 1, name: 'Gram', slug: 'g', is_active: true },
          { id: 2, name: 'Kilogram', slug: 'kg', is_active: true },
          { id: 3, name: 'Pound', slug: 'lb', is_active: true },
        ],
      },
    })
  })

  it('renders multiple unit variants under one ingredient card', () => {
    render(<PantryItem item={pantryGroup} onUpdate={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText('Chả bò')).toBeTruthy()
    expect(screen.getByText('2 đơn vị')).toBeTruthy()
    expect(screen.getByText('600')).toBeTruthy()
    expect(screen.getByText('Gram')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
    expect(screen.getByText('Kilogram')).toBeTruthy()
  })

  it('updates quantity and unit for the selected pantry row', async () => {
    const onUpdate = vi.fn().mockResolvedValue({ success: true })
    render(<PantryItem item={pantryGroup} onUpdate={onUpdate} onDelete={vi.fn()} />)

    fireEvent.click(screen.getByLabelText('Sửa Kilogram'))
    const unitSelect = await screen.findByRole('combobox')
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '3' } })
    fireEvent.change(unitSelect, { target: { value: 'lb' } })
    fireEvent.click(screen.getByLabelText('Lưu Kilogram'))

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(58, { quantity: 3, unit: 'lb' })
    })
    expect(screen.queryByRole('spinbutton')).toBeNull()
  })

  it('does not offer units already used by another variant', async () => {
    render(<PantryItem item={pantryGroup} onUpdate={vi.fn()} onDelete={vi.fn()} />)

    fireEvent.click(screen.getByLabelText('Sửa Kilogram'))
    const unitSelect = await screen.findByRole('combobox')

    expect(Array.from(unitSelect.options).map((option) => option.value)).toEqual(['kg', 'lb'])
  })

  it('keeps an inactive current unit available for quantity-only edits', async () => {
    adminApi.getIngredientUnits.mockResolvedValue({
      data: {
        default_unit: { id: 2, name: 'Kilogram', slug: 'kg', is_active: true },
        allowed_units: [
          { id: 2, name: 'Kilogram', slug: 'kg', is_active: true },
          { id: 3, name: 'Pound', slug: 'lb', is_active: true },
        ],
      },
    })
    const onUpdate = vi.fn().mockResolvedValue({ success: true })
    render(<PantryItem item={pantryGroup} onUpdate={onUpdate} onDelete={vi.fn()} />)

    fireEvent.click(screen.getByLabelText('Sửa Gram'))
    const unitSelect = await screen.findByRole('combobox')
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '650' } })
    fireEvent.click(screen.getByLabelText('Lưu Gram'))

    expect(unitSelect.value).toBe('g')
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(50, { quantity: 650 })
    })
  })

  it('keeps the editor open and shows the backend error when update fails', async () => {
    const onUpdate = vi.fn().mockRejectedValue({
      response: {
        data: {
          error: {
            message: 'Dữ liệu không hợp lệ.',
            details: {
              unit: ['Hãy bỏ đánh dấu đã mua trước khi đổi đơn vị.'],
            },
          },
        },
      },
    })
    render(<PantryItem item={pantryGroup} onUpdate={onUpdate} onDelete={vi.fn()} />)

    fireEvent.click(screen.getByLabelText('Sửa Kilogram'))
    const unitSelect = await screen.findByRole('combobox')
    fireEvent.change(unitSelect, { target: { value: 'lb' } })
    fireEvent.click(screen.getByLabelText('Lưu Kilogram'))

    expect(await screen.findByText('Hãy bỏ đánh dấu đã mua trước khi đổi đơn vị.')).toBeTruthy()
    expect(screen.getByRole('spinbutton')).toBeTruthy()
  })

  it('does not submit when quantity and unit are unchanged', async () => {
    const onUpdate = vi.fn()
    render(<PantryItem item={pantryGroup} onUpdate={onUpdate} onDelete={vi.fn()} />)

    fireEvent.click(screen.getByLabelText('Sửa Kilogram'))
    await screen.findByRole('combobox')
    fireEvent.click(screen.getByLabelText('Lưu Kilogram'))

    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('requires a positive quantity and explains that values are not converted', async () => {
    const onUpdate = vi.fn()
    render(<PantryItem item={pantryGroup} onUpdate={onUpdate} onDelete={vi.fn()} />)

    fireEvent.click(screen.getByLabelText('Sửa Kilogram'))
    await screen.findByRole('combobox')
    expect(screen.getByText('Số lượng không được tự động quy đổi khi đổi đơn vị.')).toBeTruthy()
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '0' } })
    fireEvent.click(screen.getByLabelText('Lưu Kilogram'))

    expect(screen.getByText('Số lượng phải lớn hơn 0.')).toBeTruthy()
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('deletes the selected unit variant by pantry row id', () => {
    const onDelete = vi.fn()
    render(<PantryItem item={pantryGroup} onUpdate={vi.fn()} onDelete={onDelete} />)

    fireEvent.click(screen.getByLabelText('Xóa Gram'))
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))

    expect(onDelete).toHaveBeenCalledWith(50)
  })
})
