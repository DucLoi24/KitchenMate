import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, UtensilsCrossed, RefreshCw, Beef, Wheat, Leaf, Flame, MoreHorizontal } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils'
import { Button } from '@/components/ui/Button'
import { PantryItem, PantryAddBottomSheet } from '@/components/pantry'
import {
  usePantry,
  useAddToPantry,
  useUpdatePantryItem,
  useRemoveFromPantry,
} from '@/hooks/useKitchen'

const CATEGORY_CONFIG = [
  {
    key: 'PROTEIN',
    label: 'Đạm',
    icon: Beef,
    color: 'bg-red-500',
    bgHover: 'hover:bg-red-50',
    borderColor: 'border-red-200',
    headerBg: 'bg-red-50',
    headerText: 'text-red-700',
  },
  {
    key: 'CARB',
    label: 'Tinh bột',
    icon: Wheat,
    color: 'bg-amber-500',
    bgHover: 'hover:bg-amber-50',
    borderColor: 'border-amber-200',
    headerBg: 'bg-amber-50',
    headerText: 'text-amber-700',
  },
  {
    key: 'VEG',
    label: 'Rau củ',
    icon: Leaf,
    color: 'bg-emerald-500',
    bgHover: 'hover:bg-emerald-50',
    borderColor: 'border-emerald-200',
    headerBg: 'bg-emerald-50',
    headerText: 'text-emerald-700',
  },
  {
    key: 'SPICE',
    label: 'Gia vị',
    icon: Flame,
    color: 'bg-yellow-500',
    bgHover: 'hover:bg-yellow-50',
    borderColor: 'border-yellow-200',
    headerBg: 'bg-yellow-50',
    headerText: 'text-yellow-700',
  },
  {
    key: 'OTHER',
    label: 'Khác',
    icon: MoreHorizontal,
    color: 'bg-gray-500',
    bgHover: 'hover:bg-gray-50',
    borderColor: 'border-gray-200',
    headerBg: 'bg-gray-50',
    headerText: 'text-gray-700',
  },
]

function PantryColumn({ category, items, searchQuery, onUpdate, onDelete, updatingId, deletingId }) {
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    const query = searchQuery.toLowerCase()
    return items.filter(item =>
      item.ingredient_name.toLowerCase().includes(query)
    )
  }, [items, searchQuery])

  const CategoryIcon = category.icon

  return (
    <div className="flex-shrink-0 w-[280px] md:w-[300px]">
      {/* Column header */}
      <div className={cn(
        'sticky top-0 z-10 px-4 py-3 mb-3 rounded-[var(--radius-lg)]',
        'border border-[var(--color-border)]',
        'flex items-center gap-2'
      )}>
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center',
          category.headerBg
        )}>
          <CategoryIcon className={cn('w-4 h-4', category.headerText)} />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-semibold text-[var(--color-text)]">
            {category.label}
          </h3>
        </div>
        <div className={cn(
          'px-2.5 py-0.5 rounded-full text-xs font-medium',
          'bg-[var(--color-background-alt)] text-[var(--color-text-secondary)]'
        )}>
          {filteredItems.length}
        </div>
      </div>

      {/* Column content */}
      <div className="space-y-3 min-h-[200px]">
        {filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              'flex flex-col items-center justify-center py-8 px-4',
              'rounded-[var(--radius-lg)] border-2 border-dashed',
              'border-[var(--color-border)] text-center'
            )}
          >
            <div className={cn(
              'w-12 h-12 rounded-full bg-[var(--color-background-alt)]',
              'flex items-center justify-center mb-3'
            )}>
              <CategoryIcon className="w-6 h-6 text-[var(--color-text-muted)]" />
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {searchQuery ? 'Không tìm thấy' : 'Chưa có nguyên liệu'}
            </p>
          </motion.div>
        ) : (
          filteredItems.map((item) => (
            <PantryItem
              key={item.id}
              item={item}
              onUpdate={onUpdate}
              onDelete={onDelete}
              isUpdating={updatingId === item.id}
              isDeleting={deletingId === item.id}
            />
          ))
        )}
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
      {CATEGORY_CONFIG.map((category) => (
        <div key={category.key} className="flex-shrink-0 w-[280px] md:w-[300px]">
          <div className="h-12 rounded-[var(--radius-lg)] bg-[var(--color-background-alt)] mb-3 animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-[var(--radius-lg)] bg-[var(--color-background-alt)] animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ErrorState({ onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center'
      )}
    >
      <div className={cn(
        'w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4'
      )}>
        <UtensilsCrossed className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">
        Không thể tải dữ liệu
      </h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-6 max-w-xs">
        Đã xảy ra lỗi khi tải danh sách nguyên liệu. Vui lòng thử lại.
      </p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="w-4 h-4" />
        Thử lại
      </Button>
    </motion.div>
  )
}

export function PantryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const { data, isLoading, error, refetch } = usePantry()
  const addToPantry = useAddToPantry()
  const updatePantryItem = useUpdatePantryItem()
  const removeFromPantry = useRemoveFromPantry()

  // Group pantry items by category
  const itemsByCategory = useMemo(() => {
    const grouped = {
      PROTEIN: [],
      CARB: [],
      VEG: [],
      SPICE: [],
      OTHER: [],
    }
    // Backend returns { success, data: { count, next, previous, results: [...] } }
    const items = data?.data?.results || []
    items.forEach(item => {
      const cat = item.ingredient_category
      if (grouped[cat]) {
        grouped[cat].push(item)
      } else {
        grouped.OTHER.push(item)
      }
    })
    return grouped
  }, [data])

  const handleUpdate = async (id, data) => {
    setUpdatingId(id)
    try {
      await updatePantryItem.mutateAsync({ id, data })
      toast.success('Đã cập nhật số lượng')
    } catch {
      toast.error('Không thể cập nhật. Vui lòng thử lại')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await removeFromPantry.mutateAsync(id)
      toast.success('Đã xóa nguyên liệu')
    } catch {
      toast.error('Không thể xóa. Vui lòng thử lại')
    } finally {
      setDeletingId(null)
    }
  }

  const handleAdd = async (itemData) => {
    try {
      await addToPantry.mutateAsync(itemData)
      setIsBottomSheetOpen(false)
      toast.success('Đã thêm nguyên liệu vào tủ lạnh')
    } catch {
      toast.error('Không thể thêm nguyên liệu. Vui lòng thử lại')
    }
  }

  // Check if search is active (across all categories)
  const isSearchActive = searchQuery.trim().length > 0

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[var(--color-background)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">
                Tủ lạnh
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                Quản lý nguyên liệu của bạn
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm nguyên liệu..."
              className={cn(
                'w-full h-11 pl-10 pr-4 rounded-[var(--radius-md)]',
                'border border-[var(--color-border)]',
                'bg-[var(--color-surface)]',
                'text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent',
                'transition-all duration-[var(--transition-fast)]'
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--color-background-alt)]"
              >
                <span className="text-[var(--color-text-muted)] text-lg leading-none">&times;</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-4">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState onRetry={refetch} />
        ) : (
          <>
            {/* Search result summary */}
            {isSearchActive && (
              <div className="mb-4 text-sm text-[var(--color-text-secondary)]">
                Kết quả tìm kiếm cho "{searchQuery}"
              </div>
            )}

            {/* Kanban board - horizontal scroll on mobile */}
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
              <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                  display: none;
                }
                .scrollbar-hide {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `}</style>
              {CATEGORY_CONFIG.map((category, index) => (
                <motion.div
                  key={category.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="flex-shrink-0 w-[280px] md:w-[300px]"
                >
                  <PantryColumn
                    category={category}
                    items={itemsByCategory[category.key]}
                    searchQuery={searchQuery}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    updatingId={updatingId}
                    deletingId={deletingId}
                  />
                </motion.div>
              ))}
            </div>

            {/* Empty state when no items at all */}
            {!isLoading && !error && data?.data?.results?.length === 0 && !isSearchActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  'flex flex-col items-center justify-center py-16 px-6 text-center'
                )}
              >
                <div className={cn(
                  'w-20 h-20 rounded-full bg-[var(--color-primary)]/10',
                  'flex items-center justify-center mb-4'
                )}>
                  <UtensilsCrossed className="w-10 h-10 text-[var(--color-primary)]" />
                </div>
                <h3 className="font-display text-xl font-semibold text-[var(--color-text)] mb-2">
                  Tủ lạnh trống
                </h3>
                <p className="text-[var(--color-text-secondary)] text-sm mb-6 max-w-xs">
                  Bắt đầu thêm nguyên liệu vào tủ lạnh để theo dõi và quản lý
                </p>
                <Button variant="primary" onClick={() => setIsBottomSheetOpen(true)}>
                  <Plus className="w-5 h-5" />
                  Thêm nguyên liệu đầu tiên
                </Button>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={() => setIsBottomSheetOpen(true)}
        className={cn(
          'fixed right-4 bottom-20 md:right-8 md:bottom-8',
          'w-14 h-14 rounded-full',
          'bg-[var(--color-primary)] text-white',
          'shadow-[var(--shadow-lg)] hover:shadow-[var(--shadow-xl)]',
          'flex items-center justify-center',
          'hover:bg-[var(--color-primary-light)] active:scale-95',
          'transition-all duration-[var(--transition-base)]',
          'z-30'
        )}
      >
        <Plus className="w-7 h-7" />
      </motion.button>

      {/* Bottom sheet */}
      <PantryAddBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        onAdd={handleAdd}
        isAdding={addToPantry.isPending}
      />
    </div>
  )
}

export default PantryPage
