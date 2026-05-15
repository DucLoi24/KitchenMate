import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Search } from 'lucide-react'
import { cn, buildIngredientUnitOptions } from '@/utils'
import { CATEGORY_COLORS } from '@/hooks/useRecipeDraft'
import { IngredientSearchInput } from '@/components/ui'
import { IngredientContributeModal } from '@/components/ui/IngredientContributeModal'

const normalizeUnitText = (value) =>
  String(value || '').trim().toLocaleLowerCase('vi-VN')

const createCurrentUnitOption = (unit) => {
  return { value: unit, label: unit }
}

// Fetch units for an ingredient from backend
const fetchIngredientUnits = async (ingredientId) => {
  const { default: axiosInstance } = await import('@/lib/axiosInstance')
  try {
    const response = await axiosInstance.get(`/ingredients/${ingredientId}/units/`)
    return response.data?.data || { default_unit: null, allowed_units: [] }
  } catch {
    return { default_unit: null, allowed_units: [] }
  }
}

const normalizeUnitOption = (unit) => {
  if (!unit) return null

  if (typeof unit === 'string') {
    return createCurrentUnitOption(unit)
  }

  const value = unit.value || unit.slug
  const label = unit.label || unit.name || value
  if (!value) return null

  return { value, label }
}

// Convert stored/API units to dropdown format. value is always slug, label is display name.
const buildUnitOptions = (units = []) => {
  if (!Array.isArray(units)) return []
  return units.map(normalizeUnitOption).filter(Boolean)
}

const buildUnitsFromApiData = (unitsData) => {
  const { options, defaultValue } = buildIngredientUnitOptions(unitsData)
  return { options, defaultValue }
}

const normalizeUnitValue = (unit, options = [], defaultValue = '') => {
  if (!unit) return defaultValue || options[0]?.value || ''

  if (options.some((option) => option.value === unit)) {
    return unit
  }

  const labelMatch = options.find(
    (option) => normalizeUnitText(option.label) === normalizeUnitText(unit)
  )
  if (labelMatch) return labelMatch.value

  return unit
}

export function IngredientList({ onChange, data, errors = {} }) {
  const ingredients = useMemo(() => data?.ingredients || [], [data?.ingredients])
  const [searchOpen, setSearchOpen] = useState(false)
  const [contributeModalOpen, setContributeModalOpen] = useState(false)
  const [contributeQuery, setContributeQuery] = useState('')

  // State to store hydrated units for ingredients loaded from existing recipes
  // Key: ingredient.id, Value: { options: { value, label }[], defaultValue }
  const [hydratedUnits, setHydratedUnits] = useState({})
  const hydratedUnitsRef = useRef({})

  // Get unit options for an ingredient
  const getUnitOptions = useCallback((ingredient) => {
    // Priority 1: allowed_units already set on ingredient (from add flow or old draft)
    const ownOptions = buildUnitOptions(ingredient.allowed_units)
    if (ownOptions.length > 0) {
      return ownOptions
    }

    // Priority 2: hydrated units from API (for existing recipe ingredients)
    const hydrated = ingredient.ingredient ? hydratedUnits[ingredient.ingredient] : null
    if (hydrated?.options?.length > 0) {
      return hydrated.options
    }

    // Priority 3: preserve an existing stored value, but do not invent generic choices.
    if (ingredient.unit) {
      return [createCurrentUnitOption(ingredient.unit)]
    }

    return []
  }, [hydratedUnits])

  // Hydrate units for ingredients that don't have allowed_units but DO have an ingredient ID
  useEffect(() => {
    const ingredientsNeedingHydration = ingredients.filter(
      ing => ing.ingredient && (!ing.allowed_units || ing.allowed_units.length === 0)
    )

    if (ingredientsNeedingHydration.length === 0) return

    let isActive = true

    Promise.all(
      ingredientsNeedingHydration.map(async (ing) => {
        if (hydratedUnitsRef.current[ing.ingredient]) return
        const unitsData = await fetchIngredientUnits(ing.ingredient)
        if (!isActive) return
        const unitConfig = buildUnitsFromApiData(unitsData)
        if (unitConfig.options.length > 0 || unitConfig.defaultValue) {
          hydratedUnitsRef.current[ing.ingredient] = unitConfig
        }
      })
    ).then(() => {
      if (!isActive) return
      setHydratedUnits({ ...hydratedUnitsRef.current })
    })

    return () => {
      isActive = false
    }
  }, [ingredients])

  // Normalize legacy values such as "Gram" to the canonical slug "g" once options are known.
  useEffect(() => {
    if (ingredients.length === 0) return

    let changed = false
    const normalizedIngredients = ingredients.map((ingredient) => {
      const hasConfiguredOptions =
        buildUnitOptions(ingredient.allowed_units).length > 0 ||
        (ingredient.ingredient && hydratedUnits[ingredient.ingredient]?.options?.length > 0)

      if (!hasConfiguredOptions) return ingredient

      const options = getUnitOptions(ingredient)
      if (options.length === 0) return ingredient

      const normalizedUnit = normalizeUnitValue(ingredient.unit, options)
      const normalizedAllowedUnits = buildUnitOptions(ingredient.allowed_units)
      const hydratedOptions = ingredient.ingredient ? hydratedUnits[ingredient.ingredient]?.options || [] : []
      const nextIngredient = { ...ingredient }
      let itemChanged = false

      if (normalizedUnit && normalizedUnit !== ingredient.unit) {
        nextIngredient.unit = normalizedUnit
        changed = true
        itemChanged = true
      }

      if (
        ingredient.allowed_units?.length > 0 &&
        normalizedAllowedUnits.length > 0 &&
        typeof ingredient.allowed_units[0] !== 'object'
      ) {
        nextIngredient.allowed_units = normalizedAllowedUnits
        changed = true
        itemChanged = true
      }

      if (
        (!ingredient.allowed_units || ingredient.allowed_units.length === 0) &&
        hydratedOptions.length > 0
      ) {
        nextIngredient.allowed_units = hydratedOptions
        changed = true
        itemChanged = true
      }

      return itemChanged ? nextIngredient : ingredient
    })

    if (changed) {
      onChange({ ...data, ingredients: normalizedIngredients })
    }
  }, [ingredients, getUnitOptions, onChange, data, hydratedUnits])

  const handleRequestContribute = (query) => {
    setContributeQuery(query)
    setContributeModalOpen(true)
  }

  const handleContributeSuccess = () => {
    setContributeModalOpen(false)
    setContributeQuery('')
    setSearchOpen(false)
  }

  const handleAddIngredient = async (ingredient) => {
    let unitsData = await fetchIngredientUnits(ingredient.id)

    if (
      (!unitsData.allowed_units || unitsData.allowed_units.length === 0) &&
      ingredient.allowed_units?.length > 0
    ) {
      unitsData = {
        default_unit: ingredient.default_unit || null,
        allowed_units: ingredient.allowed_units,
      }
    }

    const { options: unitOptions, defaultValue } = buildUnitsFromApiData(unitsData)
    const defaultUnitSlug = normalizeUnitValue(defaultValue, unitOptions)

    const newIngredient = {
      id: `temp-${Date.now()}`,
      ingredient: ingredient.id,
      ingredient_name: ingredient.name,
      ingredient_category: ingredient.category || 'OTHER',
      quantity: '',
      unit: defaultUnitSlug,
      allowed_units: unitOptions,
    }
    const currentIngredients = data?.ingredients || []
    onChange({ ...data, ingredients: [...currentIngredients, newIngredient] })
    setSearchOpen(false)
  }

  const handleUpdateIngredient = (index, field, value) => {
    const currentIngredients = [...(data?.ingredients || [])]
    currentIngredients[index] = { ...currentIngredients[index], [field]: value }
    onChange({ ...data, ingredients: currentIngredients })
  }

  const handleRemoveIngredient = (index) => {
    const currentIngredients = (data?.ingredients || []).filter((_, i) => i !== index)
    onChange({ ...data, ingredients: currentIngredients })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl font-semibold text-[var(--color-text)]">
            Nguyên liệu
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Thêm nguyên liệu và định lượng
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSearchOpen(!searchOpen)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-all',
            searchOpen
              ? 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)]'
              : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]'
          )}
        >
          <Plus className="w-4 h-4" />
          Thêm nguyên liệu
        </button>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-visible"
          >
            <div className="p-4 bg-[var(--color-background-alt)] rounded-[var(--radius-lg)] border border-[var(--color-border)]">
              <div className="relative">
                <IngredientSearchInput
                  onSelect={handleAddIngredient}
                  onRequestContribute={handleRequestContribute}
                  placeholder="Tìm kiếm nguyên liệu (VD: thịt bò, nấm, hành...)"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {ingredients.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)]">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--color-background-alt)] flex items-center justify-center">
            <Search className="w-5 h-5 text-[var(--color-text-muted)]" />
          </div>
          <p className="text-[var(--color-text-secondary)]">Chưa có nguyên liệu nào</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Nhấn "Thêm nguyên liệu" để bắt đầu
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {ingredients.map((ingredient, index) => (
              <motion.div
                key={ingredient.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] group hover:border-[var(--color-border-strong)] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {ingredient.ingredient_name}
                    </p>
                    {ingredient.ingredient_category && (
                      <span
                        className={cn(
                          'px-2 py-0.5 text-xs font-medium rounded-full border',
                          CATEGORY_COLORS[ingredient.ingredient_category] || CATEGORY_COLORS.OTHER
                        )}
                      >
                        {ingredient.ingredient_category}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <input
                    type="number"
                    placeholder="0"
                    value={ingredient.quantity}
                    onChange={(e) =>
                      handleUpdateIngredient(index, 'quantity', e.target.value)
                    }
                    min={0}
                    step="any"
                    className="w-20 h-8 px-2 text-sm text-center bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-sm)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  />
                  <select
                    value={normalizeUnitValue(ingredient.unit, getUnitOptions(ingredient))}
                    onChange={(e) =>
                      handleUpdateIngredient(index, 'unit', e.target.value)
                    }
                    disabled={getUnitOptions(ingredient).length === 0}
                    className="h-8 px-2 text-sm bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-sm)] focus:outline-none focus:border-[var(--color-primary)] transition-colors cursor-pointer"
                  >
                    {(() => {
                      const opts = getUnitOptions(ingredient)
                      if (opts.length === 0) {
                        return <option value="">Chưa có đơn vị</option>
                      }

                      const selectedValue = normalizeUnitValue(ingredient.unit, opts)
                      const currentInOptions = opts.some(o => o.value === selectedValue)
                      if (!currentInOptions && selectedValue) {
                        return [
                          <option key="__current__" value={selectedValue}>
                            {selectedValue}
                          </option>,
                          ...opts.map((unit) => (
                            <option key={unit.value} value={unit.value}>
                              {unit.label}
                            </option>
                          ))
                        ]
                      }
                      return opts.map((unit) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))
                    })()}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(index)}
                  className="p-1.5 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 rounded-[var(--radius-sm)] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {errors.ingredients && (
        <p className="text-sm text-red-500">{errors.ingredients}</p>
      )}

      <IngredientContributeModal
        isOpen={contributeModalOpen}
        onClose={() => setContributeModalOpen(false)}
        initialName={contributeQuery}
        onSuccess={handleContributeSuccess}
      />
    </div>
  )
}

export default IngredientList
