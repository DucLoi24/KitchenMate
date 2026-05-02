import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import { cn } from '@/utils'
import { Button } from '@/components/ui/Button'
import { IngredientSearchInput } from '@/components/ui'

const UNITS = [
  { value: 'gram', label: 'gam (g)' },
  { value: 'kilogram', label: 'kg' },
  { value: 'ml', label: 'ml' },
  { value: 'liter', label: 'lít (L)' },
  { value: 'piece', label: 'cái' },
]

export function PantryAddBottomSheet({
  isOpen,
  onClose,
  onAdd,
  isAdding = false,
}) {
  const [selectedIngredient, setSelectedIngredient] = useState(null)
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('gram')
  const [error, setError] = useState('')

  const handleSelectIngredient = (ingredient) => {
    setSelectedIngredient(ingredient)
    setError('')
  }

  const handleClear = () => {
    setSelectedIngredient(null)
    setQuantity('1')
    setUnit('gram')
    setError('')
  }

  const handleSubmit = () => {
    if (!selectedIngredient) {
      setError('Vui lòng chọn nguyên liệu')
      return
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      setError('Vui lòng nhập số lượng hợp lệ')
      return
    }

    onAdd({
      ingredient: selectedIngredient.id,
      quantity: parseFloat(quantity),
      unit,
    })

    // Reset form after successful add
    handleClear()
  }

  const handleClose = () => {
    handleClear()
    onClose()
  }

  const isValid = selectedIngredient && quantity && parseFloat(quantity) > 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed bottom-0 left-0 right-0 bg-[var(--color-surface)]',
              'rounded-t-[2rem] z-50 p-6 pb-10 max-h-[85vh] overflow-y-auto'
            )}
          >
            {/* Drag handle */}
            <div className="w-12 h-1 bg-[var(--color-border)] rounded-full mx-auto mb-6" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-display text-xl font-semibold text-[var(--color-text)]">
                  Thêm nguyên liệu
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-[var(--color-background-alt)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-5">
              {/* Ingredient search */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Nguyên liệu
                </label>
                <IngredientSearchInput
                  onSelect={handleSelectIngredient}
                  placeholder="Tìm kiếm nguyên liệu..."
                />
                {selectedIngredient && (
                  <div className="mt-2 px-3 py-2 bg-[var(--color-primary)]/10 rounded-[var(--radius-md)] text-sm text-[var(--color-text)]">
                    Đã chọn: <span className="font-medium">{selectedIngredient.name}</span>
                  </div>
                )}
              </div>

              {/* Quantity and Unit row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Số lượng
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value)
                      setError('')
                    }}
                    min="0.1"
                    step="0.1"
                    className={cn(
                      'w-full h-12 px-4 rounded-[var(--radius-md)]',
                      'border border-[var(--color-border)]',
                      'bg-[var(--color-surface)]',
                      'text-[var(--color-text)]',
                      'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent',
                      'transition-all duration-[var(--transition-fast)]'
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Đơn vị
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className={cn(
                      'w-full h-12 px-4 rounded-[var(--radius-md)]',
                      'border border-[var(--color-border)]',
                      'bg-[var(--color-surface)]',
                      'text-[var(--color-text)]',
                      'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent',
                      'transition-all duration-[var(--transition-fast)]',
                      'cursor-pointer'
                    )}
                  >
                    {UNITS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600"
                >
                  {error}
                </motion.p>
              )}

              {/* Submit button */}
              <Button
                variant="primary"
                className="w-full h-12"
                onClick={handleSubmit}
                disabled={!isValid || isAdding}
                isLoading={isAdding}
              >
                <Plus className="w-5 h-5" />
                Thêm vào tủ lạnh
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default PantryAddBottomSheet