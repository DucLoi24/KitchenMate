import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ShoppingBasket, RefreshCw, Check, Trash2, X, Loader2, ChefHat, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils'
import { Button } from '@/components/ui/Button'
import { IngredientSearchInput } from '@/components/ui'
import { useShoppingList, useAddToShoppingList, useUpdateShoppingItem, useRemoveFromShoppingList, useMarkAsPurchased, useMarkAsUnpurchased } from '@/hooks/useKitchen'

// Skeleton loading
function LoadingSkeleton() {
  return (
    <div className="space-y-4 px-4 py-6">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.08 }}
          className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-4 border border-[var(--color-border)]"
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[var(--color-background-alt)] animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-[var(--color-background-alt)] rounded animate-pulse" />
              <div className="h-3 w-20 bg-[var(--color-background-alt)] rounded animate-pulse" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Error state
function ErrorState({ onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <ShoppingBasket className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">
        Không thể tải danh sách
      </h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-6 max-w-[20rem]">
        Đã xảy ra lỗi khi tải danh sách đi chợ. Vui lòng thử lại.
      </p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="w-4 h-4" />
        Thử lại
      </Button>
    </motion.div>
  )
}

// Empty state - guidance for first item
function EmptyState({ onAdd }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {/* Decorative basket illustration */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
          <ShoppingBasket className="w-12 h-12 text-[var(--color-primary)]" />
        </div>
        {/* Floating leaves decoration */}
        <motion.div
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[var(--color-secondary)]/20 flex items-center justify-center"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChefHat className="w-4 h-4 text-[var(--color-secondary)]" />
        </motion.div>
      </div>

      <h3 className="font-display text-xl font-semibold text-[var(--color-text)] mb-2">
        Danh sách đi chợ trống
      </h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-6 max-w-[20rem] leading-relaxed">
        Bắt đầu thêm nguyên liệu cần mua bằng cách tìm kiếm hoặc thêm từ công thức nấu ăn
      </p>

      <div className="space-y-3 w-full max-w-[280px]">
        <div className="flex items-center gap-3 text-left p-3 bg-[var(--color-background-alt)] rounded-[var(--radius-md)]">
          <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center flex-shrink-0">
            <Search className="w-4 h-4 text-[var(--color-accent)]" />
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Tìm và thêm nguyên liệu bằng thanh tìm kiếm
          </p>
        </div>
        <div className="flex items-center gap-3 text-left p-3 bg-[var(--color-background-alt)] rounded-[var(--radius-md)]">
          <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center flex-shrink-0">
            <ChefHat className="w-4 h-4 text-[var(--color-accent)]" />
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Thêm từ trang chi tiết công thức nấu ăn
          </p>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={onAdd}
        className="mt-8"
        leftIcon={<Plus className="w-5 h-5" />}
      >
        Thêm nguyên liệu đầu tiên
      </Button>
    </motion.div>
  )
}

// Shopping list item component
function ShoppingItem({
  item,
  onToggle,
  onDelete,
  onUpdate,
  isUpdating,
}) {
  const unitLabel = item.unit_display || item.unit
  const [isEditing, setIsEditing] = useState(false)
  const [editQuantity, setEditQuantity] = useState(item.quantity)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(
          'relative bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-4',
          'border transition-all duration-[var(--transition-base)]',
          item.is_purchased
            ? 'border-[var(--color-secondary)]/30 opacity-60'
            : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/40',
          isUpdating && 'opacity-50'
        )}
      >
        {/* Checkbox */}
        <button
          onClick={() => onToggle(item)}
          disabled={isUpdating}
          className={cn(
            'absolute left-4 top-1/2 -translate-y-1/2',
            'w-7 h-7 rounded-full border-2 flex items-center justify-center',
            'transition-all duration-[var(--transition-base)]',
            item.is_purchased
              ? 'bg-[var(--color-secondary)] border-[var(--color-secondary)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
          )}
        >
          {isUpdating ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : item.is_purchased ? (
            <Check className="w-4 h-4 text-white" />
          ) : null}
        </button>

        {/* Content */}
        <div className="pl-10 pr-10">
          {/* Ingredient name */}
          <h4 className={cn(
            'font-display text-base font-semibold mb-1 transition-all duration-[var(--transition-base)]',
            item.is_purchased ? 'line-through text-[var(--color-text-secondary)]' : 'text-[var(--color-text)]'
          )}>
            {item.ingredient_name || '[Nguyên liệu đã bị xóa]'}
          </h4>

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
                  'w-24 h-10 px-3 rounded-[var(--radius-md)]',
                  'border border-[var(--color-border)]',
                  'text-[var(--color-text)] font-medium text-center',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent'
                )}
                autoFocus
              />
              <span className="text-sm text-[var(--color-text-secondary)] font-medium">
                {unitLabel}
              </span>
              <div className="flex items-center gap-1 ml-auto">
                <Button size="sm" variant="primary" onClick={handleSaveEdit} className="h-8 w-8 p-0">
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-8 w-8 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-1">
              <span className={cn(
                'text-lg font-display font-bold',
                item.is_purchased ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-primary)]'
              )}>
                {item.quantity}
              </span>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {unitLabel}
              </span>
              {!item.is_purchased && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="ml-auto text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                >
                  Sửa
                </button>
              )}
            </div>
          )}
        </div>

        {/* Delete button */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isUpdating}
          className={cn(
            'absolute right-4 top-1/2 -translate-y-1/2',
            'w-8 h-8 rounded-full flex items-center justify-center',
            'hover:bg-red-50 transition-colors duration-[var(--transition-fast)]',
            'text-red-400 hover:text-red-600'
          )}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowDeleteConfirm(false)}
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
                Xóa khỏi danh sách?
              </h3>
              <p className="text-[var(--color-text-secondary)] text-sm text-center mb-6">
                Bạn có chắc muốn xóa <span className="font-medium text-[var(--color-text)]">{item.ingredient_name}</span> khỏi danh sách đi chợ?
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>
                  Hủy
                </Button>
                <Button variant="danger" className="flex-1" onClick={() => { onDelete(item.id); setShowDeleteConfirm(false) }}>
                  Xóa
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Add item form
function AddItemForm({ onAdd, isAdding }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIngredient, setSelectedIngredient] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('gram')

  const UNITS = [
    { value: 'gram', label: 'gram' },
    { value: 'kilogram', label: 'kg' },
    { value: 'ml', label: 'ml' },
    { value: 'liter', label: 'L' },
    { value: 'piece', label: 'cái' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error('Số lượng phải lớn hơn 0')
      return
    }

    try {
      await onAdd({
        ingredient: selectedIngredient?.id || null,
        ingredient_name: selectedIngredient ? undefined : selectedIngredient?.name || '',
        quantity: parseFloat(quantity),
        unit,
      })
      setSearchQuery('')
      setSelectedIngredient(null)
      setQuantity('')
      setUnit('gram')
    } catch {
      // Error handled by caller
    }
  }

  const handleSelectIngredient = (ingredient) => {
    setSelectedIngredient(ingredient)
    setSearchQuery(ingredient.name)
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 py-4 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
      <div className="flex gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <IngredientSearchInput
            value={searchQuery}
            onChange={(val) => { setSearchQuery(val); setSelectedIngredient(null) }}
            onSelect={handleSelectIngredient}
            placeholder="Tìm hoặc thêm nguyên liệu..."
          />
        </div>
      </div>

      {/* Selected ingredient + quantity form */}
      {selectedIngredient && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex gap-2 mt-3"
        >
          <div className="flex-1">
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">
              Nguyên liệu
            </label>
            <div className={cn(
              'h-11 px-4 rounded-[var(--radius-md)] bg-[var(--color-background-alt)]',
              'flex items-center text-[var(--color-text)] font-medium'
            )}>
              {selectedIngredient.name}
            </div>
          </div>
          <div className="w-24">
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Số lượng</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="500"
              min="0.1"
              step="0.1"
              className={cn(
                'w-full h-11 px-3 rounded-[var(--radius-md)]',
                'border border-[var(--color-border)] bg-[var(--color-surface)]',
                'text-[var(--color-text)] text-center font-medium',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent'
              )}
            />
          </div>
          <div className="w-20">
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Đơn vị</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className={cn(
                'w-full h-11 px-2 rounded-[var(--radius-md)]',
                'border border-[var(--color-border)] bg-[var(--color-surface)]',
                'text-[var(--color-text)] text-center font-medium',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent'
              )}
            >
              {UNITS.map(u => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              variant="primary"
              isLoading={isAdding}
              className="h-11 px-4"
              leftIcon={<Plus className="w-5 h-5" />}
            >
              Thêm
            </Button>
          </div>
        </motion.div>
      )}
    </form>
  )
}

// Confirmation dialog for delete all purchased
function DeleteAllConfirmDialog({ count, onConfirm, onCancel, isDeleting }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onCancel}
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
          Xóa tất cả đã mua?
        </h3>
        <p className="text-[var(--color-text-secondary)] text-sm text-center mb-6">
          Xóa <span className="font-medium text-[var(--color-text)]">{count}</span> nguyên liệu đã mua khỏi danh sách
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isDeleting}>
            Hủy
          </Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm} isLoading={isDeleting}>
            Xóa {count} mục
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Main ShoppingPage component
export function ShoppingPage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [deletingIds, setDeletingIds] = useState(new Set())
  const [togglingIds, setTogglingIds] = useState(new Set())
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)

  const { data, isLoading, error, refetch } = useShoppingList()
  const addToShoppingList = useAddToShoppingList()
  const updateShoppingItem = useUpdateShoppingItem()
  const removeFromShoppingList = useRemoveFromShoppingList()
  const markAsPurchased = useMarkAsPurchased()
  const markAsUnpurchased = useMarkAsUnpurchased()

  // Parse items from API response
  const items = useMemo(() => {
    return data?.data?.results || []
  }, [data])

  // Separate unpurchased and purchased
  const unpurchasedItems = useMemo(() => {
    return items.filter(item => !item.is_purchased)
  }, [items])

  const purchasedItems = useMemo(() => {
    return items.filter(item => item.is_purchased)
  }, [items])

  const hasPurchasedItems = purchasedItems.length > 0

  // Toggle purchased (mark or unmark)
  const handleToggle = async (item) => {
    const newPurchased = !item.is_purchased
    setTogglingIds(prev => new Set([...prev, item.id]))

    try {
      if (newPurchased) {
        await markAsPurchased.mutateAsync(item.id)
        toast.success(
          <div className="flex items-center gap-2">
            <span className="text-lg">🫑</span>
            <span>Đã thêm vào tủ lạnh</span>
          </div>
        )
      } else {
        await markAsUnpurchased.mutateAsync(item.id)
        toast.success('Đã bỏ khỏi tủ lạnh')
      }
    } catch {
      toast.error('Không thể cập nhật. Vui lòng thử lại')
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
    }
  }

  // Delete item
  const handleDelete = async (id) => {
    setDeletingIds(prev => new Set([...prev, id]))
    try {
      await removeFromShoppingList.mutateAsync(id)
      toast.success('Đã xóa khỏi danh sách')
    } catch {
      toast.error('Không thể xóa. Vui lòng thử lại')
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  // Update quantity
  const handleUpdate = async (id, data) => {
    try {
      await updateShoppingItem.mutateAsync({ id, data })
      toast.success('Đã cập nhật số lượng')
    } catch {
      toast.error('Không thể cập nhật. Vui lòng thử lại')
    }
  }

  // Add item
  const handleAdd = async (itemData) => {
    try {
      await addToShoppingList.mutateAsync(itemData)
      toast.success('Đã thêm vào danh sách')
      setShowAddForm(false)
    } catch {
      toast.error('Không thể thêm nguyên liệu. Vui lòng thử lại')
      throw new Error('Add failed')
    }
  }

  // Delete all purchased
  const handleDeleteAllPurchased = async () => {
    setShowDeleteAllConfirm(false)
    const ids = purchasedItems.map(item => item.id)

    // Optimistic delete
    setDeletingIds(prev => new Set([...prev, ...ids]))

    try {
      await Promise.all(ids.map(id => removeFromShoppingList.mutateAsync(id)))
      toast.success(`Đã xóa ${ids.length} nguyên liệu đã mua`)
    } catch {
      toast.error('Xóa thất bại một số nguyên liệu')
      refetch()
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev)
        ids.forEach(id => next.delete(id))
        return next
      })
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[var(--color-background)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">
                Danh sách đi chợ
              </h1>
              {items.length > 0 && (
                <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                  {unpurchasedItems.length} chưa mua · {purchasedItems.length} đã mua
                </p>
              )}
            </div>
            {hasPurchasedItems && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteAllConfirm(true)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Xóa đã mua
              </Button>
            )}
          </div>

          {/* Add button */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full mt-4"
            leftIcon={showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          >
            {showAddForm ? 'Đóng' : 'Thêm nguyên liệu'}
          </Button>
        </div>

        {/* Add form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <AddItemForm onAdd={handleAdd} isAdding={addToShoppingList.isPending} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main content */}
      <div className="p-4">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState onRetry={refetch} />
        ) : items.length === 0 ? (
          <EmptyState onAdd={() => setShowAddForm(true)} />
        ) : (
          <div className="space-y-6">
            {/* Unpurchased section */}
            {unpurchasedItems.length > 0 && (
              <div>
                <h2 className="font-display text-sm font-semibold text-[var(--color-text-secondary)] mb-3 uppercase tracking-wide">
                  Cần mua
                </h2>
                <div className="space-y-3">
                  <AnimatePresence>
                    {unpurchasedItems.map((item) => (
                      <ShoppingItem
                        key={item.id}
                        item={item}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        onUpdate={handleUpdate}
                        isUpdating={togglingIds.has(item.id) || deletingIds.has(item.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Purchased section */}
            {purchasedItems.length > 0 && (
              <div>
                <h2 className="font-display text-sm font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wide">
                  Đã mua
                </h2>
                <div className="space-y-3">
                  <AnimatePresence>
                    {purchasedItems.map((item) => (
                      <ShoppingItem
                        key={item.id}
                        item={item}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        onUpdate={handleUpdate}
                        isUpdating={togglingIds.has(item.id) || deletingIds.has(item.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete all confirmation */}
      <AnimatePresence>
        {showDeleteAllConfirm && (
          <DeleteAllConfirmDialog
            count={purchasedItems.length}
            onConfirm={handleDeleteAllPurchased}
            onCancel={() => setShowDeleteAllConfirm(false)}
            isDeleting={deletingIds.size > 0}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default ShoppingPage