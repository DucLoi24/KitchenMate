import { motion } from 'framer-motion'
import { ChefHat, Leaf } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function EmptyState({ onClearFilters, searchQuery }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      {/* Decorative illustration */}
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-full bg-[var(--color-background-alt)] flex items-center justify-center">
          <ChefHat className="w-14 h-14 text-[var(--color-text-muted)]" />
        </div>

        {/* Floating decorative elements */}
        <motion.div
          className="absolute -top-2 -right-2"
          animate={{ rotate: [0, 10, 0], y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Leaf className="w-7 h-7 text-[var(--color-secondary)] opacity-50" />
        </motion.div>

        <motion.div
          className="absolute -bottom-1 -left-3"
          animate={{ rotate: [0, -10, 0], y: [0, 3, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        >
          <span className="text-2xl">🌶️</span>
        </motion.div>
      </div>

      {/* Text content */}
      <h3 className="font-display text-xl font-semibold text-[var(--color-text)] mb-2">
        Không tìm thấy công thức
      </h3>
      <p className="text-[var(--color-text-secondary)] mb-2 w-full max-w-md text-center shrink-0">
        {searchQuery
          ? `Không có kết quả cho "${searchQuery}"`
          : 'Chưa có công thức nào phù hợp với bộ lọc của bạn'
        }
      </p>
      <p className="text-[var(--color-text-muted)] text-sm mb-6">
        Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác
      </p>

      {/* Action button */}
      {onClearFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          Xoá bộ lọc
        </Button>
      )}
    </motion.div>
  )
}

export default EmptyState