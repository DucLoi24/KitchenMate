import { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Star, ChefHat, Heart, Library } from 'lucide-react'
import { Badge } from '@/components/ui'
import { cn } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { socialApi } from '@/api/socialApi'
import { GuestCTA } from '@/components/auth/GuestCTA'
import { AddToCollectionModal } from '@/components/social/AddToCollectionModal'

const difficultyConfig = {
  EASY: { label: 'Dễ', variant: 'success', icon: '🍀' },
  MEDIUM: { label: 'Trung bình', variant: 'warning', icon: '🍳' },
  HARD: { label: 'Khó', variant: 'danger', icon: '🔥' },
}

export function RecipeCard({
  recipe,
  variant = 'default',
  showAuthor = true,
  showFavoriteButton = false,
  onClick,
  className,
}) {
  const { isAuthenticated } = useAuth()
  const {
    id,
    title,
    thumbnail,
    author,
    prep_time,
    difficulty,
    avg_rating,
    save_count,
    is_favorited,
    is_in_collection,
  } = recipe

  const [favorited, setFavorited] = useState(!!is_favorited)
  const [inCollection, setInCollection] = useState(!!is_in_collection)
  const [showGuestCTA, setShowGuestCTA] = useState(false)
  const [showCollectionModal, setShowCollectionModal] = useState(false)
  const [toast, setToast] = useState('')
  const debounceRef = useRef(null)

  // Sync state when prop changes (e.g., after page refresh)
  useEffect(() => {
    setFavorited(!!is_favorited)
  }, [is_favorited])

  useEffect(() => {
    setInCollection(!!is_in_collection)
  }, [is_in_collection])

  const difficultyInfo = difficultyConfig[difficulty] || difficultyConfig.MEDIUM

  const handleFavoriteToggle = useCallback(async () => {
    if (debounceRef.current) return
    debounceRef.current = setTimeout(() => { debounceRef.current = null }, 300)

    if (!isAuthenticated) {
      setShowGuestCTA(true)
      return
    }

    // Optimistic UI
    const prev = favorited
    setFavorited(!prev)

    try {
      const res = await socialApi.toggleFavorite(id)
      setFavorited(res.is_favorited)
    } catch {
      // Revert on failure
      setFavorited(prev)
    }
  }, [isAuthenticated, favorited, id])

  const handleCollectionToggle = useCallback(() => {
    if (!isAuthenticated) {
      setShowGuestCTA(true)
      return
    }
    setShowCollectionModal(true)
  }, [isAuthenticated])

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={() => onClick?.(recipe)}
      className={cn(
        'group relative bg-[var(--color-surface)] rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-[var(--transition-base)] cursor-pointer',
        variant === 'compact' && 'flex gap-4 p-4',
        className
      )}
    >
      {/* Image Container */}
      <div className={cn(
        'relative overflow-hidden bg-[var(--color-background-alt)]',
        variant === 'default' ? 'aspect-square' : 'w-24 h-24 rounded-[var(--radius-md)] flex-shrink-0'
      )}>
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-orange-50 to-amber-50">
            🍽️
          </div>
        )}

        {/* Difficulty Badge Overlay */}
        <div className="absolute top-3 left-3">
          <Badge variant={difficultyInfo.variant} size="sm">
            {difficultyInfo.label}
          </Badge>
        </div>

        {/* Action Buttons (Heart + Collection) */}
        {showFavoriteButton && (
          <div className="absolute top-3 right-3 flex gap-2">
            {/* Favorite (Heart) Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation()
                handleFavoriteToggle()
              }}
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-[var(--shadow-sm)] hover:bg-white transition-colors"
            >
              <Heart
                className={cn(
                  'w-4 h-4 transition-colors',
                  favorited ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'
                )}
              />
            </motion.button>

            {/* Collection Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation()
                handleCollectionToggle()
              }}
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-[var(--shadow-sm)] hover:bg-white transition-colors"
            >
              <Library
                className={cn(
                  'w-4 h-4 transition-colors',
                  inCollection ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                )}
              />
            </motion.button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn('p-4', variant === 'compact' && 'flex-1 min-w-0')}>
        {/* Title */}
        <h3 className={cn(
          'font-display font-semibold text-[var(--color-text)] line-clamp-2 mb-2',
          variant === 'default' ? 'text-lg' : 'text-sm'
        )}>
          {title}
        </h3>

        {/* Meta Info Row */}
        <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
          {/* Prep Time */}
          {prep_time && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {prep_time}p
            </span>
          )}

          {/* Rating */}
          {avg_rating != null && avg_rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-[var(--color-accent)] text-[var(--color-accent)]" />
              {Number(avg_rating).toFixed(1)}
            </span>
          )}

          {/* Saves */}
          {save_count > 0 && (
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              {save_count}
            </span>
          )}
        </div>

        {/* Author */}
        {showAuthor && author && variant === 'default' && (
          <div className="mt-3 flex items-center gap-2 pt-3 border-t border-[var(--color-border)]">
            {author.avatar ? (
              <img
                src={author.avatar}
                alt={author.full_name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-medium">
                {author.full_name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <span className="text-sm text-[var(--color-text-secondary)] truncate">
              {author.full_name || author.email}
            </span>
          </div>
        )}
      </div>

      {/* Guest CTA Modal */}
      {showGuestCTA && (
        <GuestCTA
          context="collections"
          onClose={() => setShowGuestCTA(false)}
        />
      )}

      {/* Add to Collection Modal */}
      <AddToCollectionModal
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        recipeId={id}
      />
    </motion.article>
  )
}

export default RecipeCard