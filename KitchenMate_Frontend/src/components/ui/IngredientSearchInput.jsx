import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Loader2 } from 'lucide-react'
import { cn } from '@/utils'

const CATEGORY_COLORS = {
  PROTEIN: 'bg-red-100 text-red-700',
  CARB: 'bg-amber-100 text-amber-700',
  VEG: 'bg-emerald-100 text-emerald-700',
  SPICE: 'bg-yellow-100 text-yellow-700',
  OTHER: 'bg-gray-100 text-gray-600',
}

const searchIngredients = async (query) => {
  const { default: axiosInstance } = await import('@/lib/axiosInstance')
  const { data } = await axiosInstance.get('/ingredients/search/', { params: { q: query } })
  return data
}

export function IngredientSearchInput({
  value,
  onChange,
  onSelect,
  placeholder = 'Tìm kiếm nguyên liệu...',
  className,
  maxResults = 10,
}) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const debounceRef = useRef(null)

  // Debounced search
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const response = await searchIngredients(searchQuery)
      const items = response?.data || []
      setResults(items.slice(0, maxResults))
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [maxResults])

  const handleQueryChange = (e) => {
    const val = e.target.value
    setQuery(val)
    setIsOpen(true)
    setHighlightedIndex(-1)
    onChange?.(val)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      performSearch(val)
    }, 300)
  }

  const handleSelect = (ingredient) => {
    setQuery(ingredient.name)
    onChange?.(ingredient.name)
    onSelect?.(ingredient)
    setResults([])
    setIsOpen(false)
    setHighlightedIndex(-1)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0) {
          handleSelect(results[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }

  // Prevent scroll hijacking when using mouse wheel
  const handleWheel = useCallback((e) => {
    e.stopPropagation()
  }, [])

  const handleClear = () => {
    setQuery('')
    setResults([])
    onChange?.('')
    inputRef.current?.focus()
  }

  return (
    <div className={cn('relative', className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-11 pl-10 pr-10 bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-base transition-all duration-[var(--transition-base)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-0"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 w-4 h-4 text-[var(--color-text-muted)] animate-spin" />
        )}
        {query && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 flex items-center justify-center w-4 h-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            ref={listRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            onWheel={handleWheel}
            className="absolute left-0 z-[60] w-full mt-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)]"
            style={{ overflow: 'visible' }}
          >
            <ul onWheel={handleWheel} className="max-h-60 overflow-y-auto py-1">
              {results.map((ingredient, index) => (
                <li key={ingredient.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(ingredient)}
                    className={cn(
                      'w-full px-4 py-2.5 text-left flex items-center justify-between gap-3 transition-colors',
                      highlightedIndex === index
                        ? 'bg-[var(--color-background-alt)]'
                        : 'hover:bg-[var(--color-background-alt)]'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text)] truncate">
                        {ingredient.name}
                      </p>
                      {ingredient.category && (
                        <span
                          className={cn(
                            'inline-block mt-0.5 px-2 py-0.5 text-xs font-medium rounded-full',
                            CATEGORY_COLORS[ingredient.category] || CATEGORY_COLORS.OTHER
                          )}
                        >
                          {ingredient.category}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-0 z-[60] w-full mt-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] p-4 text-center"
        >
          <p className="text-sm text-[var(--color-text-muted)]">
            Không tìm thấy nguyên liệu phù hợp
          </p>
        </motion.div>
      )}
    </div>
  )
}

export default IngredientSearchInput