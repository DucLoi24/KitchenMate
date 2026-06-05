export function groupPantryItemsByIngredient(items = []) {
  const groups = new Map()

  items.forEach((item) => {
    const groupKey = item.ingredient
    const existing = groups.get(groupKey)
    if (existing) {
      existing.variants.push(item)
      return
    }

    groups.set(groupKey, {
      ...item,
      id: `ingredient-${groupKey}`,
      variants: [item],
    })
  })

  return Array.from(groups.values()).map((group) => ({
    ...group,
    variants: group.variants.sort((a, b) =>
      (a.unit_display || a.unit).localeCompare(b.unit_display || b.unit, 'vi')
    ),
  }))
}
