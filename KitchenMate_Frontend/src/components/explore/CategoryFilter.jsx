import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { cn } from '@/utils'
import { categoryApi, FALLBACK_CATEGORIES } from '@/api/categoryApi'
import { ChevronDown, Search, X, Check } from 'lucide-react'

export function CategoryFilter({ active = [], onChange, className }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)

  // Normalize active to array
  const activeCategories = useMemo(() => {
    if (Array.isArray(active)) return active
    return active === 'all' ? [] : [active]
  }, [active])

  // Fetch categories
  useEffect(() => {
    const categoryPromise = categoryApi.getCategories()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 3000)
    )

    Promise.race([categoryPromise, timeoutPromise])
      .then(res => setCategories(Array.isArray(res) ? res : res.results))
      .catch(err => {
        console.error('Failed to load categories (timeout or error):', err)
        setCategories(FALLBACK_CATEGORIES)
      })
      .finally(() => setLoading(false))
  }, [])

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories
    const query = searchQuery.toLowerCase()
    return categories.filter(cat => cat.name.toLowerCase().includes(query))
  }, [categories, searchQuery])

  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 8, left: rect.left })
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking inside trigger or dropdown
      if (triggerRef.current?.contains(event.target)) return
      if (dropdownRef.current?.contains(event.target)) return
      setIsOpen(false)
      setSearchQuery('')
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleToggle = (categoryId) => {
    const newActive = activeCategories.includes(categoryId)
      ? activeCategories.filter(id => id !== categoryId)
      : [...activeCategories, categoryId]
    onChange(newActive)
  }

  // Prevent scroll hijacking when using mouse wheel
  const handleWheel = (e) => {
    e.stopPropagation()
  }

  const handleClearAll = () => {
    onChange([])
    setSearchQuery('')
  }

  const getSelectedLabels = () => {
    if (activeCategories.length === 0) return 'Tất cả'
    if (activeCategories.length === 1) {
      const cat = categories.find(c => c.id === activeCategories[0])
      return cat ? cat.name : '1 đã chọn'
    }
    return `${activeCategories.length} đã chọn`
  }

  if (loading) {
    return (
      <div className={cn('relative', className)}>
        <div className="h-10 w-48 bg-[var(--color-surface)] animate-pulse rounded-lg" />
      </div>
    )
  }

  // Dropdown content - rendered via Portal
  const dropdownContent = isOpen ? (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      onWheel={handleWheel}
      className="w-72 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-[var(--shadow-lg)]"
      style={{ maxHeight: '20rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
          {/* Search input - sticky at top */}
          <div className="p-3 border-b border-[var(--color-border)] flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm danh mục..."
                className={cn(
                  'w-full pl-9 pr-8 py-2 text-sm rounded-lg',
                  'bg-[var(--color-background)] border border-[var(--color-border)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]',
                  'placeholder:text-[var(--color-text-secondary)]'
                )}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--color-background-alt)] rounded"
                >
                  <X className="w-3 h-3 text-[var(--color-text-secondary)]" />
                </button>
              )}
            </div>
          </div>

          {/* Categories list - scrollable */}
          <div
            onWheel={handleWheel}
            className="flex-1 overflow-y-auto min-h-0"
            style={{ maxHeight: '15rem' }}
          >
            {/* "Tất cả" option */}
            <button
              onClick={() => { onChange([]); setSearchQuery('') }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-sm',
                'hover:bg-[var(--color-background)] transition-colors',
                activeCategories.length === 0 && 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
              )}
            >
              <span className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center',
                activeCategories.length === 0
                  ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                  : 'border-[var(--color-border)]'
              )}>
                {activeCategories.length === 0 && <Check className="w-3 h-3 text-white" />}
              </span>
              <span className="font-medium">Tất cả</span>
            </button>

            {/* Category options */}
            {filteredCategories.map((cat) => {
              const isSelected = activeCategories.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  onClick={() => handleToggle(cat.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-sm',
                    'hover:bg-[var(--color-background)] transition-colors',
                    isSelected && 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  )}
                >
                  <span className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                    isSelected
                      ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                      : 'border-[var(--color-border)]'
                  )}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </span>
                  <span className="truncate">{cat.name}</span>
                </button>
              )
            })}

            {/* Empty state */}
            {filteredCategories.length === 0 && (
              <div className="py-4 text-center text-sm text-[var(--color-text-secondary)]">
                Không tìm thấy danh mục
              </div>
            )}
          </div>

          {/* Footer with clear button */}
          {activeCategories.length > 0 && (
            <div className="p-3 border-t border-[var(--color-border)] flex-shrink-0">
              <button
                onClick={handleClearAll}
                className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
              >
                Xóa lựa chọn
              </button>
            </div>
          )}
        </motion.div>
  ) : null

  return (
    <div ref={triggerRef} className={cn('relative inline-block', className)}>
      {/* Dropdown trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between gap-2 min-w-[180px] px-4 py-2.5',
          'bg-[var(--color-surface)] border border-[var(--color-border)]',
          'rounded-lg text-sm font-medium transition-all',
          'hover:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]',
          isOpen && 'ring-2 ring-[var(--color-primary)] border-[var(--color-primary)]'
        )}
      >
        <span className={cn(
          activeCategories.length > 0 ? 'text-[var(--color-text)]' : 'text-[var(--color-text-secondary)]'
        )}>
          {getSelectedLabels()}
        </span>
        <ChevronDown className={cn(
          'w-4 h-4 text-[var(--color-text-secondary)] transition-transform duration-200',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Render dropdown via Portal */}
      {createPortal(
        isOpen ? (
          <div
            ref={dropdownRef}
            style={{ top: dropdownPos.top, left: dropdownPos.left }}
            className="fixed z-[9999]"
          >
            {dropdownContent}
          </div>
        ) : null,
        document.body
      )}
    </div>
  )
}


export default CategoryFilter