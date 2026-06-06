import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { adminApi } from '@/api/adminApi'
import { buildIngredientUnitOptions, cn } from '@/utils'
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

const getUpdateErrorMessage = (error) => {
  const unitError = error?.response?.data?.error?.details?.unit
  if (Array.isArray(unitError) && unitError.length > 0) return unitError[0]
  if (typeof unitError === 'string') return unitError
  return error?.response?.data?.error?.message || 'Không thể cập nhật. Vui lòng thử lại.'
}

export function PantryItem({
  item,
  onUpdate,
  onDelete,
  isUpdating = false,
  isDeleting = false,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingVariantId, setEditingVariantId] = useState(null)
  const [editQuantity, setEditQuantity] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [availableUnits, setAvailableUnits] = useState([])
  const [isLoadingUnits, setIsLoadingUnits] = useState(false)
  const [editError, setEditError] = useState('')
  const [deleteVariant, setDeleteVariant] = useState(null)

  const category = CATEGORY_CONFIG[item.ingredient_category] || CATEGORY_CONFIG.OTHER
  const variants = item.variants || [item]

  const handleStartEdit = (variant) => {
    setEditingVariantId(variant.id)
    setEditQuantity(String(variant.quantity))
    setEditUnit(variant.unit)
    setAvailableUnits([{ value: variant.unit, label: getUnitLabel(variant) }])
    setEditError('')
    setIsEditing(true)

    setIsLoadingUnits(true)
    adminApi.getIngredientUnits(variant.ingredient)
      .then((response) => {
        const { options } = buildIngredientUnitOptions(response?.data)
        const usedUnits = new Set(
          variants
            .filter((candidate) => candidate.id !== variant.id)
            .map((candidate) => candidate.unit)
        )
        const selectableOptions = options.filter(
          (option) => option.value === variant.unit || !usedUnits.has(option.value)
        )
        const hasCurrentUnit = selectableOptions.some(
          (option) => option.value === variant.unit
        )

        setAvailableUnits(hasCurrentUnit
          ? selectableOptions
          : [{ value: variant.unit, label: getUnitLabel(variant) }, ...selectableOptions])
      })
      .catch(() => {
        setEditError('Không thể tải danh sách đơn vị. Bạn vẫn có thể sửa số lượng.')
      })
      .finally(() => setIsLoadingUnits(false))
  }

  const handleSaveEdit = async (variant) => {
    const quantity = Number(editQuantity)
    setEditError('')

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setEditError('Số lượng phải lớn hơn 0.')
      return
    }
    if (!editUnit) {
      setEditError('Vui lòng chọn đơn vị hợp lệ.')
      return
    }

    const payload = {}
    if (quantity !== Number(variant.quantity)) payload.quantity = quantity
    if (editUnit !== variant.unit) payload.unit = editUnit

    if (Object.keys(payload).length === 0) {
      setIsEditing(false)
      setEditingVariantId(null)
      return
    }

    try {
      await onUpdate(variant.id, payload)
      setIsEditing(false)
      setEditingVariantId(null)
    } catch (error) {
      setEditError(getUpdateErrorMessage(error))
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingVariantId(null)
    setEditQuantity('')
    setEditUnit('')
    setAvailableUnits([])
    setEditError('')
  }

  const handleDeleteClick = (variant) => {
    setDeleteVariant(variant)
  }

  const handleConfirmDelete = () => {
    onDelete(deleteVariant.id)
    setDeleteVariant(null)
  }

  const handleCancelDelete = () => {
    setDeleteVariant(null)
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

            {variants.length > 1 && (
              <span className="shrink-0 rounded-[var(--radius-sm)] bg-[var(--color-secondary)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-secondary)]">
                {variants.length} đơn vị
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            {variants.map((variant) => {
              const isVariantEditing = isEditing && editingVariantId === variant.id

              return (
                <div
                  key={variant.id}
                  className={cn(
                    'flex items-center gap-2 rounded-[var(--radius-sm)]',
                    'bg-[var(--color-background-alt)] px-2 py-1.5'
                  )}
                >
                  {isVariantEditing ? (
                    <div className="w-full space-y-2">
                      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-2">
                        <input
                          type="number"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                          min="0.1"
                          step="0.1"
                          aria-label={`Số lượng ${getUnitLabel(variant)}`}
                          className={cn(
                            'h-10 min-w-0 rounded-[var(--radius-md)] px-2.5',
                            'border border-[var(--color-border)] bg-[var(--color-surface)]',
                            'text-sm text-[var(--color-text)] font-medium tabular-nums',
                            'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent'
                          )}
                          autoFocus
                        />
                        <select
                          value={editUnit}
                          onChange={(e) => setEditUnit(e.target.value)}
                          disabled={isLoadingUnits}
                          aria-label="Đơn vị"
                          className={cn(
                            'h-10 min-w-0 rounded-[var(--radius-md)] px-2',
                            'border border-[var(--color-border)] bg-[var(--color-surface)]',
                            'text-sm text-[var(--color-text)] font-medium',
                            'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent',
                            isLoadingUnits && 'cursor-wait opacity-60'
                          )}
                        >
                          {availableUnits.map((unit) => (
                            <option key={unit.value} value={unit.value}>{unit.label}</option>
                          ))}
                        </select>
                      </div>
                      <p className="text-[10px] leading-4 text-[var(--color-text-muted)]">
                        Số lượng không được tự động quy đổi khi đổi đơn vị.
                      </p>
                      {editError && (
                        <p className="text-xs leading-4 text-red-600" role="alert">
                          {editError}
                        </p>
                      )}
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleSaveEdit(variant)}
                          isLoading={isUpdating}
                          disabled={isLoadingUnits}
                          className="h-10 w-10 p-0"
                          aria-label={`Lưu ${getUnitLabel(variant)}`}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                          className="h-10 w-10 p-0"
                          aria-label={`Hủy ${getUnitLabel(variant)}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-medium tabular-nums text-[var(--color-text-secondary)]">
                          {variant.quantity}
                        </span>
                        <span className="ml-1 text-xs text-[var(--color-text-muted)]">
                          {getUnitLabel(variant)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleStartEdit(variant)}
                        className="rounded-md p-1.5 transition-colors hover:bg-[var(--color-surface)]"
                        disabled={isUpdating || isDeleting}
                        aria-label={`Sửa ${getUnitLabel(variant)}`}
                      >
                        <Pencil className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(variant)}
                        className="rounded-md p-1.5 transition-colors hover:bg-red-50"
                        disabled={isUpdating || isDeleting}
                        aria-label={`Xóa ${getUnitLabel(variant)}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Delete confirmation overlay */}
      {deleteVariant && (
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
              'w-full max-w-[28rem] shadow-[var(--shadow-xl)]',
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
              Bạn có chắc muốn xóa <span className="font-medium text-[var(--color-text)]">{item.ingredient_name}</span> ({deleteVariant.quantity} {getUnitLabel(deleteVariant)}) khỏi tủ lạnh?
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
