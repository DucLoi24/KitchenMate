import { motion } from 'framer-motion'
import { cn } from '@/utils'

const CATEGORIES = [
  { id: 'all', label: 'Tất cả', emoji: '🍽️' },
  { id: 'vietnamese', label: 'Món Việt', emoji: '🍜' },
  { id: 'asian', label: 'Món Á', emoji: '🥢' },
  { id: 'european', label: 'Món Âu', emoji: '🥐' },
  { id: 'japanese', label: 'Món Nhật', emoji: '🍣' },
  { id: 'dessert', label: 'Tráng miệng', emoji: '🍰' },
  { id: 'breakfast', label: 'Món sáng', emoji: '🥞' },
  { id: 'bbq', label: 'BBQ', emoji: '🥩' },
]

export function CategoryFilter({ active = 'all', onChange, className }) {
  return (
    <div className="relative">
      {/* Fade edges for horizontal scroll indication */}
      <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-[var(--color-background)] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-[var(--color-background)] to-transparent z-10 pointer-events-none" />

      {/* Scrollable container */}
      <div
        className={cn(
          'flex gap-3 overflow-x-auto pb-4 scroll-smooth',
          '[&::-webkit-scrollbar]:hidden [&::-ms-overflow-style:none] [&::-webkit-scrollbar-width]:none',
          className
        )}
      >
        {CATEGORIES.map((cat) => {
          const isActive = active === cat.id
          return (
            <motion.button
              key={cat.id}
              onClick={() => onChange(cat.id)}
              className={cn(
                'flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full',
                'text-sm font-medium transition-all duration-[var(--transition-fast)]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
                isActive
                  ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-base">{cat.emoji}</span>
              <span className={cn(isActive ? 'font-body' : 'font-[Caveat] text-lg')}>
                {cat.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryFilter