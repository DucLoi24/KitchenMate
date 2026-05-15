// @vitest-environment jsdom
import { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { IngredientList } from '../IngredientList'

const mockAxiosGet = vi.hoisted(() => vi.fn())

vi.mock('@/lib/axiosInstance', () => ({
  default: {
    get: mockAxiosGet,
  },
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}))

vi.mock('lucide-react', () => ({
  Plus: () => <span data-testid="plus-icon" />,
  Trash2: () => <span data-testid="trash-icon" />,
  Search: () => <span data-testid="search-icon" />,
}))

vi.mock('@/components/ui', () => ({
  IngredientSearchInput: ({ onSelect }) => (
    <button
      type="button"
      onClick={() =>
        onSelect({
          id: 11,
          name: 'Thịt bò',
          category: 'PROTEIN',
          default_unit: { id: 1, slug: 'g', name: 'Gram', is_active: true },
          allowed_units: [
            { id: 1, slug: 'g', name: 'Gram', is_active: true },
            { id: 2, slug: 'kg', name: 'Kilogram', is_active: true },
          ],
        })
      }
    >
      Chọn thịt bò
    </button>
  ),
}))

vi.mock('@/components/ui/IngredientContributeModal', () => ({
  IngredientContributeModal: () => null,
}))

function Harness({ initialData }) {
  const [data, setData] = useState(initialData)

  return (
    <>
      <IngredientList data={data} onChange={setData} />
      <pre data-testid="form-data">{JSON.stringify(data)}</pre>
    </>
  )
}

const ingredientUnitsResponse = {
  data: {
    data: {
      default_unit: { id: 1, slug: 'g', name: 'Gram', is_active: true },
      allowed_units: [
        { id: 1, slug: 'g', name: 'Gram', is_active: true },
        { id: 2, slug: 'kg', name: 'Kilogram', is_active: true },
      ],
    },
  },
}

describe('IngredientList unit dropdown', () => {
  beforeEach(() => {
    mockAxiosGet.mockReset()
    mockAxiosGet.mockResolvedValue(ingredientUnitsResponse)
  })

  it('stores unit slug when adding an ingredient and uses unit name only as the option label', async () => {
    render(<Harness initialData={{ ingredients: [] }} />)

    fireEvent.click(screen.getByText('Thêm nguyên liệu'))
    fireEvent.click(screen.getByText('Chọn thịt bò'))

    await waitFor(() => {
      const data = JSON.parse(screen.getByTestId('form-data').textContent)
      expect(data.ingredients[0].unit).toBe('g')
      expect(data.ingredients[0].allowed_units).toEqual([
        { value: 'g', label: 'Gram' },
        { value: 'kg', label: 'Kilogram' },
      ])
    })
  })

  it('normalizes legacy display-name units to slugs when editing a recipe', async () => {
    render(
      <Harness
        initialData={{
          ingredients: [
            {
              id: 7,
              ingredient: 11,
              ingredient_name: 'Thịt bò',
              ingredient_category: 'PROTEIN',
              quantity: 200,
              unit: 'Gram',
            },
          ],
        }}
      />
    )

    await waitFor(() => {
      const data = JSON.parse(screen.getByTestId('form-data').textContent)
      expect(data.ingredients[0].unit).toBe('g')
    })

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Kilogram' })).toBeTruthy()
    })
  })
})
