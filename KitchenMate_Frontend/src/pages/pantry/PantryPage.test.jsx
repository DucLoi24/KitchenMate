import { describe, expect, it } from 'vitest'
import { groupPantryItemsByIngredient } from './pantryGrouping'

describe('groupPantryItemsByIngredient', () => {
  it('groups same ingredient rows into one pantry card with unit variants', () => {
    const items = [
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
    ]

    const groups = groupPantryItemsByIngredient(items)

    expect(groups).toHaveLength(1)
    expect(groups[0].ingredient_name).toBe('Chả bò')
    expect(groups[0].variants).toHaveLength(2)
    expect(groups[0].variants.map((variant) => variant.unit_display)).toEqual([
      'Gram',
      'Kilogram',
    ])
  })
})
