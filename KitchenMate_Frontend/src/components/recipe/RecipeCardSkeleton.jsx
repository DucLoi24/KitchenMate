import { motion } from 'framer-motion'

export function RecipeCardSkeleton({ variant = 'default' }) {
  return (
    <div
      className={`bg-[var(--color-surface)] rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border)] ${
        variant === 'compact' ? 'flex gap-4 p-4' : ''
      }`}
    >
      {/* Image skeleton */}
      <div
        className={`bg-[var(--color-background-alt)] ${
          variant === 'default' ? 'aspect-square' : 'w-24 h-24 rounded-[var(--radius-md)] flex-shrink-0'
        } relative overflow-hidden`}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Content skeleton */}
      <div className={`p-4 ${variant === 'compact' ? 'flex-1' : ''}`}>
        {/* Title skeleton */}
        <div className="h-5 bg-[var(--color-background-alt)] rounded w-3/4 mb-2" />
        <div className="h-5 bg-[var(--color-background-alt)] rounded w-1/2 mb-3" />

        {/* Meta row skeleton */}
        <div className="flex items-center gap-3">
          <div className="h-4 w-12 bg-[var(--color-background-alt)] rounded" />
          <div className="h-4 w-10 bg-[var(--color-background-alt)] rounded" />
          <div className="h-4 w-8 bg-[var(--color-background-alt)] rounded" />
        </div>

        {/* Author row skeleton */}
        {variant === 'default' && (
          <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--color-background-alt)]" />
            <div className="h-4 w-24 bg-[var(--color-background-alt)] rounded" />
          </div>
        )}
      </div>
    </div>
  )
}

export default RecipeCardSkeleton