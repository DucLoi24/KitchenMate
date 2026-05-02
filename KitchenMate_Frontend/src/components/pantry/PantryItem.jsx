import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Trash2, Check, X, Beef, Wheat, Leaf, Flame, MoreHorizontal } from 'lucide-react'
import { cn } from '@/utils'
import { Button } from '@/components/ui/Button'

const CATEGORY_CONFIG = {
  PROTEIN: {
    label: 'Đạm',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: Beef,
  },
  CARB: {
    label: 'Tinh bột',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Wheat,
  },
  VEG: {
    label: 'Rau',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: Leaf,
  },
  SPICE: {
    label: 'Gia vị',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: Flame,
  },
  OTHER: {
    label: 'Khác',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: MoreHorizontal,
  },
}

const UNIT_LABELS = {
  gram: 'g',
  kilogram: 'kg',
  ml: 'ml',
  liter: 'L',
  piece: 'cái',
}

export function PantryItem({
  item,
  onUpdate,
  onDelete,
  isUpdating = false,
  isDeleting = false,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editQuantity, setEditQuantity] = useState(item.quantity)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const category = CATEGORY_CONFIG[item.ingredient_category] || CATEGORY_CONFIG.OTHER
  const CategoryIcon = category.icon

  const handleSaveEdit = () => {
    if (editQuantity > 0 && editQuantity !== item.quantity) {
      onUpdate(item.id, { quantity: editQuantity })
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditQuantity(item.quantity)
    setIsEditing(false)
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    onDelete(item.id)
    setShowDeleteConfirm(false)
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-4',
          'border border-[var(--color-border)]',
          'shadow-[var(--shadow-sm)]',
          'hover:shadow-[var(--shadow-md)] transition-shadow duration-[var(--transition-base)]',
          isDeleting && 'opacity-50'
        )}
      >
        {/* Category badge */}
        <div className="flex items-center justify-between mb-3">
          <div className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
            'text-xs font-medium border',
            category.color
          )}>
            <CategoryIcon className="w-3 h-3" />
            {category.label}
          </div>

          {/* Action buttons */}
          {!isEditing && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-md hover:bg-[var(--color-background-alt)] transition-colors"
                disabled={isUpdating || isDeleting}
              >
                <Pencil className="w-4 h-4 text-[var(--color-text-secondary)]" />
              </button>
              <button
                onClick={handleDeleteClick}
                className="p-1.5 rounded-md hover:bg-red-50 transition-colors"
                disabled={isUpdating || isDeleting}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          )}
        </div>

        {/* Ingredient name */}
        <h4 className="font-display text-base font-semibold text-[var(--color-text)] mb-2 line-clamp-1">
          {item.ingredient_name}
        </h4>

        {/* Quantity */}
        <div className="flex items-center justify-between">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editQuantity}
                onChange={(e) => setEditQuantity(parseFloat(e.target.value) || 0)}
                min="0.1"
                step="0.1"
                className={cn(
                  'w-20 h-9 px-3 rounded-[var(--radius-md)]',
                  'border border-[var(--color-border)]',
                  'text-[var(--color-text)] font-medium',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent'
                )}
                autoFocus
              />
              <span className="text-sm text-[var(--color-text-secondary)]">
                {UNIT_LABELS[item.unit] || item.unit}
              </span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-display font-bold text-[var(--color-primary)]">
                {item.quantity}
              </span>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {UNIT_LABELS[item.unit] || item.unit}
              </span>
            </div>
          )}

          {/* Edit action buttons */}
          {isEditing && (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="primary"
                onClick={handleSaveEdit}
                isLoading={isUpdating}
                className="h-8 w-8 p-0"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelEdit}
                disabled={isUpdating}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={handleCancelDelete}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'bg-[var(--color-surface)] rounded-[var(--radius-xl)] p-6',
              'w-full max-w-md shadow-[var(--shadow-xl)]',
              'border border-[var(--color-border)]'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-display text-lg font-semibold text-[var(--color-text)] text-center mb-2">
              Xóa nguyên liệu?
            </h3>
            <p className="text-[var(--color-text-secondary)] text-sm text-center mb-6">
              Bạn có chắc muốn xóa <span className="font-medium text-[var(--color-text)]">{item.ingredient_name}</span> khỏi tủ lạnh?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCancelDelete}
              >
                Hủy
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleConfirmDelete}
                isLoading={isDeleting}
              >
                Xóa
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}

export default PantryItem
