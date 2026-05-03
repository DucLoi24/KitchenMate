import { Star } from 'lucide-react'
import { cn } from './Button'

const sizes = {
  sm: { star: 'w-4 h-4', gap: 'gap-0.5' },
  md: { star: 'w-5 h-5', gap: 'gap-1' },
  lg: { star: 'w-6 h-6', gap: 'gap-1.5' },
}

export function StarRatingInput({
  value = 0,
  onChange,
  size = 'md',
  readonly = false,
  showError = false,
}) {
  const { star: starSize, gap } = sizes[size] || sizes.md

  const handleClick = (rating) => {
    if (!readonly && onChange) {
      onChange(rating)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className={cn('flex items-center', gap)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= value
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              disabled={readonly}
              className={cn(
                'p-0.5 rounded transition-all duration-[var(--transition-fast)]',
                readonly
                  ? 'cursor-default'
                  : 'cursor-pointer hover:scale-110 active:scale-95'
              )}
              style={{ background: 'none', border: 'none' }}
              aria-label={`${star} sao`}
            >
              <Star
                className={cn(
                  starSize,
                  filled
                    ? 'fill-[var(--color-accent)] text-[var(--color-accent)]'
                    : 'fill-transparent text-[var(--color-border-strong)]'
                )}
                style={{
                  fill: filled ? 'var(--color-accent)' : 'transparent',
                  color: filled
                    ? 'var(--color-accent)'
                    : 'var(--color-border-strong)',
                  transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </button>
          )
        })}
      </div>
      {showError && (
        <p className="text-sm text-[var(--color-primary)]">
          Vui lòng chọn số sao đánh giá
        </p>
      )}
    </div>
  )
}

export function StarRatingDisplay({ value = 0, size = 'md' }) {
  const { star: starSize, gap } = sizes[size] || sizes.md

  return (
    <div className={cn('flex items-center', gap)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value
        return (
          <Star
            key={star}
            className={cn(
              starSize,
              filled
                ? 'fill-[var(--color-accent)] text-[var(--color-accent)]'
                : 'fill-transparent text-[var(--color-border-strong)]'
            )}
            style={{
              fill: filled ? 'var(--color-accent)' : 'transparent',
              color: filled
                ? 'var(--color-accent)'
                : 'var(--color-border-strong)',
            }}
          />
        )
      })}
    </div>
  )
}

export default StarRatingInput