import { useState, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils'

export function SearchBar({ value, onChange, isLoading = false, placeholder = 'Tìm kiếm công thức...' }) {
  const [inputValue, setInputValue] = useState(value)
  const [isDebouncing, setIsDebouncing] = useState(false)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    if (inputValue === value) return

    setIsDebouncing(true)
    const timer = setTimeout(() => {
      onChange(inputValue)
      setIsDebouncing(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [inputValue, value, onChange])

  const handleClear = () => {
    setInputValue('')
    onChange('')
  }

  const showLoading = isLoading || isDebouncing
  const showClear = inputValue.length > 0

  return (
    <div className="relative w-full max-w-2xl mx-auto group">
      {/* Expanding container with shadow */}
      <div
        className={cn(
          'relative flex items-center bg-white rounded-full px-6 py-4',
          'shadow-[var(--shadow-md)] group-hover:shadow-[var(--shadow-lg)]',
          'transition-all duration-[var(--transition-base)]'
        )}
      >
        {/* Animated underline */}
        <div
          className={cn(
            'absolute bottom-0 left-1/2 h-0.5 bg-[var(--color-primary)]',
            'transition-all duration-300',
            'group-focus-within:left-4 group-focus-within:w-[calc(100%-2rem)]'
          )}
        />

        {/* Search icon */}
        <Search className="w-5 h-5 text-[var(--color-text-muted)] mr-3 flex-shrink-0" />

        {/* Input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] text-base"
        />

        {/* Right side: clear or loading */}
        <AnimatePresence mode="wait">
          {showLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Loader2 className="w-5 h-5 text-[var(--color-primary)] animate-spin" />
            </motion.div>
          )}
          {!showLoading && showClear && (
            <motion.button
              key="clear"
              type="button"
              onClick={handleClear}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="p-1 rounded-full hover:bg-[var(--color-background-alt)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--color-text-muted)]" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default SearchBar