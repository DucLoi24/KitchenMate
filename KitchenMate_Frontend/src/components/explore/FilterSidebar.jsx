import { motion } from 'framer-motion'
import { cn } from '@/utils'
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
  { value: 'popular', label: 'Phổ biến', ordering: '-popular_score' },
  { value: 'rating', label: 'Đánh giá cao', ordering: '-avg_rating' },
]

export function FilterSidebar({
  categories,
  difficulties,
  cookingTime,
  sort,
  onCategoriesChange,
  onDifficultiesChange,
  onTimeChange,
  onSortChange,
  className
}) {
  const handleToggleDifficulty = (value) => {
    if (difficulties.includes(value)) {
      onDifficultiesChange(difficulties.filter(d => d !== value))
    } else {
      onDifficultiesChange([...difficulties, value])
    }
  }

  return (
    <div className={cn(
      'bg-[var(--color-surface)] rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-md)]',
      className
    )}>
      {/* Category Section */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <h3 className="font-display text-lg font-semibold mb-4 text-[var(--color-text)]">
          Danh mục
        </h3>
        <CategoryFilter active={categories} onChange={onCategoriesChange} className="w-full" />
      </motion.div>

      {/* Difficulty Section */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="font-display text-lg font-semibold mb-4 text-[var(--color-text)]">
          Độ khó
        </h3>
        <div className="space-y-3">
          {DIFFICULTIES.map(({ value, label, variant, description }) => (
            <label
              key={value}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={difficulties.includes(value)}
                onChange={() => handleToggleDifficulty(value)}
                className="w-4 h-4 accent-[var(--color-primary)] cursor-pointer rounded"
              />
              <Badge variant={variant} size="sm">{label}</Badge>
              <span className="text-[var(--color-text-secondary)] text-sm group-hover:text-[var(--color-text)] transition-colors">
                {description}
              </span>
            </label>
          ))}
        </div>
      </motion.div>

      {/* Time Section */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="font-display text-lg font-semibold mb-4 text-[var(--color-text)]">
          Thời gian nấu
        </h3>
        <div className="space-y-3">
          {TIME_RANGES.map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={cookingTime.includes(value)}
                onChange={() => onTimeChange(
                  cookingTime.includes(value)
                    ? cookingTime.filter(t => t !== value)
                    : [...cookingTime, value]
                )}
                className="w-4 h-4 accent-[var(--color-primary)] cursor-pointer rounded"
              />
              <span className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)] transition-colors">
                {label}
              </span>
            </label>
          ))}
        </div>
      </motion.div>

      {/* Sort Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="font-display text-lg font-semibold mb-4 text-[var(--color-text)]">
          Sắp xếp theo
        </h3>
        <div className="space-y-3">
          {SORT_OPTIONS.map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="radio"
                name="sort"
                value={value}
                checked={sort === value}
                onChange={() => onSortChange(value)}
                className="w-4 h-4 accent-[var(--color-primary)] cursor-pointer"
              />
              <span className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)] transition-colors">
                {label}
              </span>
            </label>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default FilterSidebar
