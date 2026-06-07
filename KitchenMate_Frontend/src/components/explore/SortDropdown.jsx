import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpDown, ChevronDown } from 'lucide-react'
import { cn } from '@/utils'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất', ordering: '-created_at' },
  { value: 'popular', label: 'Phổ biến', ordering: '-popular_score' },
  { value: 'rating', label: 'Đánh giá cao', ordering: '-avg_rating' },
]

export function SortDropdown({ value, onChange, className }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const selectedOption = SORT_OPTIONS.find((opt) => opt.value === value) || SORT_OPTIONS[0]

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-full',
          'bg-[var(--color-surface)] border border-[var(--color-border)]',
          'text-sm text-[var(--color-text-secondary)]',
          'hover:border-[var(--color-primary)] hover:text-[var(--color-text)]',
          'transition-all duration-[var(--transition-fast)]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]'
        )}
      >
        <ArrowUpDown className="w-4 h-4" />
        <span>{selectedOption.label}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute top-full left-0 mt-2 z-20',
              'w-48 bg-[var(--color-surface)] rounded-[var(--radius-lg)]',
              'shadow-[var(--shadow-lg)] border border-[var(--color-border)]',
              'py-2 overflow-hidden'
            )}
          >
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full px-4 py-2.5 text-left text-sm',
                  'transition-colors duration-[var(--transition-fast)]',
                  option.value === value
                    ? 'bg-[var(--color-background-alt)] text-[var(--color-primary)] font-medium'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] hover:text-[var(--color-text)]'
                )}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SortDropdown
