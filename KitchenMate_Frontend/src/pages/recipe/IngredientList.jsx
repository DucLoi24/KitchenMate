import { useState } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Plus, Trash2, Search } from 'lucide-react'
import { cn } from '@/utils'
import { CATEGORY_COLORS, UNITS } from '@/hooks/useRecipeDraft'
import { IngredientSearchInput } from '@/components/ui'

export function IngredientList({ ingredients = [], onChange, errors = {} }) {
  const [searchOpen, setSearchOpen] = useState(false)

  const handleAddIngredient = (ingredient) => {
    const newIngredient = {
      id: `temp-${Date.now()}`,
      ingredient: ingredient.id,
      ingredient_name: ingredient.name,
      ingredient_category: ingredient.category || 'OTHER',
      quantity: '',
      unit: 'g',
    }
    // Pass as direct value - setFormData will merge with existing state
    onChange({ ingredients: [...ingredients, newIngredient] })
    setSearchOpen(false)
  }

  const handleUpdateIngredient = (index, field, value) => {
    const updated = [...ingredients]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const handleRemoveIngredient = (index) => {
    onChange(ingredients.filter((_, i) => i !== index))
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
        <Reorder.Group
          axis="y"
          values={ingredients}
          onReorder={(newOrder) => onChange(newOrder)}
          className="space-y-2"
        >
          <AnimatePresence>
            {ingredients.map((ingredient, index) => (
              <Reorder.Item
                key={ingredient.id}
                value={ingredient}
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
                    value={ingredient.unit}
                    onChange={(e) =>
                      handleUpdateIngredient(index, 'unit', e.target.value)
                    }
                    className="h-8 px-2 text-sm bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-sm)] focus:outline-none focus:border-[var(--color-primary)] transition-colors cursor-pointer"
                  >
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(index)}
                  className="p-1.5 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 rounded-[var(--radius-sm)] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}

      {errors.ingredients && (
        <p className="text-sm text-red-500">{errors.ingredients}</p>
      )}
    </div>
  )
}

export default IngredientList