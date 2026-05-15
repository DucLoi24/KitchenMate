import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { cn } from '@/utils'
import { Button } from '@/components/ui/Button'

const CATEGORY_CONFIG = {
  PROTEIN: {
    label: 'Đạm',
    stripeColor: 'bg-red-500',
  },
  CARB: {
    label: 'Tinh bột',
    stripeColor: 'bg-amber-500',
  },
  VEG: {
    label: 'Rau',
    stripeColor: 'bg-emerald-500',
  },
  SPICE: {
    label: 'Gia vị',
    stripeColor: 'bg-violet-500',
  },
  OTHER: {
    label: 'Khác',
    stripeColor: 'bg-gray-400',
  },
}

const getUnitLabel = (item) => item.unit_display || item.unit

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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'relative bg-[var(--color-surface)] rounded-[var(--radius-md)]',
          'border border-[var(--color-border)]',
          'shadow-[var(--shadow-sm)]',
          'hover:shadow-[var(--shadow-md)] transition-shadow duration-[var(--transition-fast)]',
          'group',
          isDeleting && 'opacity-50'
        )}
      >
        {/* Category stripe */}
        <div className={cn(
          'absolute left-0 top-3 bottom-3 w-[3px] rounded-full',
          category.stripeColor
        )} />

        {/* Content */}
        <div className="p-3 pl-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h4 className="text-sm font-medium text-[var(--color-text)] line-clamp-1 flex-1">
              {item.ingredient_name}
            </h4>

            {/* Actions - visible on hover for desktop, always on mobile */}
            <div className={cn(
              'flex items-center gap-0.5',
              'lg:opacity-0 lg:group-hover:opacity-100',
              'transition-opacity duration-[var(--transition-fast)]'
            )}>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-md hover:bg-[var(--color-background-alt)] transition-colors"
                disabled={isUpdating || isDeleting}
              >
                <Pencil className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
              </button>
              <button
                onClick={handleDeleteClick}
                className="p-1.5 rounded-md hover:bg-red-50 transition-colors"
                disabled={isUpdating || isDeleting}
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          </div>

          {/* Quantity */}
          {isEditing ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                value={editQuantity}
                onChange={(e) => setEditQuantity(parseFloat(e.target.value) || 0)}
                min="0.1"
                step="0.1"
                className={cn(
                  'w-20 h-8 px-2.5 rounded-[var(--radius-sm)]',
                  'border border-[var(--color-border)]',
                  'text-sm text-[var(--color-text)] font-medium tabular-nums',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent'
                )}
                autoFocus
              />
              <span className="text-xs text-[var(--color-text-secondary)]">
                {getUnitLabel(item)}
              </span>
              <div className="flex items-center gap-0.5 ml-auto">
                <Button size="sm" variant="primary" onClick={handleSaveEdit} isLoading={isUpdating} className="h-7 w-7 p-0">
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={isUpdating} className="h-7 w-7 p-0">
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-medium tabular-nums text-[var(--color-text-secondary)]">
                {item.quantity}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {getUnitLabel(item)}
              </span>
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
