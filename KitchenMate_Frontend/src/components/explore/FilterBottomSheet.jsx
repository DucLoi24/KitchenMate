import { motion, AnimatePresence } from 'framer-motion'
import { X, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CategoryFilter } from './CategoryFilter'

const DIFFICULTIES = [
  { value: 'EASY', label: 'Dễ', variant: 'success', description: 'Cho người mới bắt đầu' },
  { value: 'MEDIUM', label: 'Trung bình', variant: 'warning', description: 'Cần một chút kinh nghiệm' },
  { value: 'HARD', label: 'Khó', variant: 'danger', description: 'Dành cho đầu bếp chuyên nghiệp' },
]

const TIME_RANGES = [
  { value: 15, label: 'Dưới 15 phút' },
  { value: 30, label: '15 - 30 phút' },
  { value: 60, label: '30 - 60 phút' },
  { value: 120, label: 'Hơn 60 phút' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất', ordering: '-created_at' },
  { value: 'popular', label: 'Phổ biến', ordering: '-save_count' },
  { value: 'rating', label: 'Đánh giá cao', ordering: '-avg_rating' },
]

export function FilterBottomSheet({
  isOpen,
  onClose,
  categories,
  difficulties,
  cookingTime,
  sort,
  onCategoriesChange,
  onDifficultiesChange,
  onTimeChange,
  onSortChange,
  onApply,
  onClear
}) {
  const toggleDifficulty = (value) => {
    if (difficulties.includes(value)) {
      onDifficultiesChange(difficulties.filter(d => d !== value))
    } else {
      onDifficultiesChange([...difficulties, value])
    }
  }

  const toggleTime = (value) => {
    if (cookingTime.includes(value)) {
      onTimeChange(cookingTime.filter(t => t !== value))
    } else {
      onTimeChange([...cookingTime, value])
    }
  }

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
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed bottom-0 left-0 right-0 bg-[var(--color-surface)]',
              'rounded-t-[var(--radius-xl)] z-50 p-6 pb-10 max-h-[85vh] overflow-y-auto'
            )}
          >
            {/* Drag handle */}
            <div className="w-12 h-1 bg-[var(--color-border)] rounded-full mx-auto mb-6" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-[var(--color-primary)]" />
                <h2 className="font-display text-xl font-semibold text-[var(--color-text)]">
                  Bộ lọc
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[var(--color-background-alt)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            {/* Category Section */}
            <div className="mb-8">
              <h3 className="font-display text-lg font-semibold mb-4 text-[var(--color-text)]">
                Danh mục
              </h3>
              <CategoryFilter active={categories} onChange={onCategoriesChange} className="w-full" />
            </div>

            {/* Difficulty Section */}
            <div className="mb-8">
              <h3 className="font-display text-lg font-semibold mb-4 text-[var(--color-text)]">
                Độ khó
              </h3>
              <div className="space-y-3">
                {DIFFICULTIES.map(({ value, label, variant, description }) => (
                  <label key={value} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={difficulties.includes(value)}
                      onChange={() => toggleDifficulty(value)}
                      className="w-4 h-4 accent-[var(--color-primary)] cursor-pointer rounded"
                    />
                    <Badge variant={variant} size="sm">{label}</Badge>
                    <span className="text-[var(--color-text-secondary)] text-sm group-hover:text-[var(--color-text)]">
                      {description}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Time Section */}
            <div className="mb-8">
              <h3 className="font-display text-lg font-semibold mb-4 text-[var(--color-text)]">
                Thời gian nấu
              </h3>
              <div className="space-y-3">
                {TIME_RANGES.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={cookingTime.includes(value)}
                      onChange={() => toggleTime(value)}
                      className="w-4 h-4 accent-[var(--color-primary)] cursor-pointer rounded"
                    />
                    <span className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)]">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sort Section */}
            <div className="mb-8">
              <h3 className="font-display text-lg font-semibold mb-4 text-[var(--color-text)]">
                Sắp xếp theo
              </h3>
              <div className="space-y-3">
                {SORT_OPTIONS.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="sort-mobile"
                      value={value}
                      checked={sort === value}
                      onChange={() => onSortChange(value)}
                      className="w-4 h-4 accent-[var(--color-primary)] cursor-pointer"
                    />
                    <span className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)]">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClear}
              >
                Xoá bộ lọc
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={onApply}
              >
                Áp dụng
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default FilterBottomSheet