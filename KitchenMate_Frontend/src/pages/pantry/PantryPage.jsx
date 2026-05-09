import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, UtensilsCrossed, RefreshCw } from 'lucide-react'
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

const CATEGORY_FILTERS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PROTEIN', label: 'Đạm', color: 'bg-red-500' },
  { key: 'CARB', label: 'Tinh bột', color: 'bg-amber-500' },
  { key: 'VEG', label: 'Rau củ', color: 'bg-emerald-500' },
  { key: 'SPICE', label: 'Gia vị', color: 'bg-violet-500' },
  { key: 'OTHER', label: 'Khác', color: 'bg-gray-400' },
]

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-20 rounded-[var(--radius-md)] bg-[var(--color-background-alt)] animate-pulse" />
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
      <p className="text-[var(--color-text-secondary)] text-sm mb-6 max-w-[20rem]">
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
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const { data, isLoading, error, refetch } = usePantry()
  const addToPantry = useAddToPantry()
  const updatePantryItem = useUpdatePantryItem()
  const removeFromPantry = useRemoveFromPantry()

  // Flatten and filter items
  const filteredItems = useMemo(() => {
    // Backend returns { success, data: { count, next, previous, results: [...] } }
    const items = data?.data?.results || []

    // Filter by category
    let filtered = items
    if (activeFilter !== 'ALL') {
      filtered = items.filter(item => item.ingredient_category === activeFilter)
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.ingredient_name.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [data, activeFilter, searchQuery])

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

        {/* Category filter pills */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          <style>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                'whitespace-nowrap transition-all duration-[var(--transition-fast)]',
                activeFilter === filter.key
                  ? 'bg-[var(--color-text)] text-[var(--color-surface)]'
                  : 'bg-[var(--color-background-alt)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
              )}
            >
              {filter.key !== 'ALL' && (
                <span className={cn('w-2 h-2 rounded-full', filter.color)} />
              )}
              {filter.label}
            </button>
          ))}
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
            {/* Items grid */}
            {filteredItems.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
              >
                {filteredItems.map((item) => (
                  <PantryItem
                    key={item.id}
                    item={item}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    isUpdating={updatingId === item.id}
                    isDeleting={deletingId === item.id}
                  />
                ))}
              </motion.div>
            ) : (
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
                  {searchQuery ? 'Không tìm thấy' : 'Tủ lạnh trống'}
                </h3>
                <p className="text-[var(--color-text-secondary)] text-sm mb-6 max-w-[20rem]">
                  {searchQuery
                    ? `Không có nguyên liệu nào matching "${searchQuery}"`
                    : 'Bắt đầu thêm nguyên liệu vào tủ lạnh để theo dõi và quản lý'
                  }
                </p>
                {!searchQuery && (
                  <Button variant="primary" onClick={() => setIsBottomSheetOpen(true)}>
                    <Plus className="w-5 h-5" />
                    Thêm nguyên liệu đầu tiên
                  </Button>
                )}
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
