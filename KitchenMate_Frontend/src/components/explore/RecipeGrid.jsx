import { motion } from 'framer-motion'
import { useRef, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { RecipeCardSkeleton } from '@/components/recipe/RecipeCardSkeleton'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 200, damping: 20 },
  },
}

export function RecipeGrid({
  recipes,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  onRecipeClick,
  showFavoriteButton = false,
  className
}) {
  const loadMoreRef = useRef(null)

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Initial loading state
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
        {[...Array(6)].map((_, i) => (
          <RecipeCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Empty state
  if (!recipes || recipes.length === 0) {
    return null
  }

  return (
    <div className={cn('relative', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <motion.div
            key={recipe.id}
            variants={itemVariants}
            className="recipe-card-item transition-transform duration-[250ms] hover:-translate-y-1"
          >
            <RecipeCard
              recipe={recipe}
              showFavoriteButton={showFavoriteButton}
              onClick={() => onRecipeClick(recipe)}
            />
          </motion.div>
        ))}
      </div>

      {/* Load more sentinel */}
      <div
        ref={loadMoreRef}
        className="h-20 flex items-center justify-center mt-8"
      >
        {isFetchingNextPage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-[var(--color-text-secondary)]"
          >
            <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
            <span className="text-sm">Đang tải thêm...</span>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default RecipeGrid