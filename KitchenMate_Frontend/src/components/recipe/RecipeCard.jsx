import { motion } from 'framer-motion'
import { Clock, Star, ChefHat, Heart } from 'lucide-react'
import { Badge } from '@/components/ui'
import { cn } from '@/components/ui/Button'

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
  } = recipe

  const difficultyInfo = difficultyConfig[difficulty] || difficultyConfig.MEDIUM

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

        {/* Favorite Button */}
        {showFavoriteButton && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation()
              // Handle favorite toggle
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-[var(--shadow-sm)] hover:bg-white transition-colors"
          >
            <Heart
              className={cn(
                'w-4 h-4 transition-colors',
                is_favorited ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'
              )}
            />
          </motion.button>
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
    </motion.article>
  )
}

export default RecipeCard