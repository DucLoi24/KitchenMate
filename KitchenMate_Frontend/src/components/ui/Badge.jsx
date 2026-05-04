import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { motion } from 'framer-motion'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const badgeVariants = {
  base: 'inline-flex items-center justify-center font-medium rounded-[var(--radius-full)] transition-all duration-[var(--transition-fast)] select-none',
  variants: {
    primary: 'bg-[var(--color-primary)] text-white',
    secondary: 'bg-[var(--color-secondary)] text-white',
    accent: 'bg-[var(--color-accent)] text-[var(--color-text)]',
    success: 'bg-green-500 text-white',
    warning: 'bg-amber-500 text-white',
    danger: 'bg-red-500 text-white',
    muted: 'bg-[var(--color-background-alt)] text-[var(--color-text-secondary)]',
    outline: 'border-2 border-[var(--color-primary)] text-[var(--color-primary)] bg-transparent',
  },
  sizes: {
    sm: 'h-5 px-2 text-xs',
    md: 'h-6 px-2.5 text-sm',
    lg: 'h-7 px-3 text-base',
  },
}

export function Badge({
  children,
  variant = 'primary',
  size = 'md',
  className,
  dot = false,
  animated = false,
  ...props
}) {
  const BadgeComponent = animated ? motion.span : 'span'

  const animatedProps = animated
    ? {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: 'spring', stiffness: 500, damping: 25 },
      }
    : {}

  return (
    <BadgeComponent
      className={cn(
        badgeVariants.base,
        badgeVariants.variants[variant],
        badgeVariants.sizes[size],
        className
      )}
      {...animatedProps}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full mr-1.5',
            variant === 'primary' && 'bg-white',
            variant === 'secondary' && 'bg-white',
            variant === 'accent' && 'bg-[var(--color-text)]',
            variant === 'success' && 'bg-white',
            variant === 'warning' && 'bg-white',
            variant === 'danger' && 'bg-white',
            variant === 'muted' && 'bg-[var(--color-text-secondary)]',
            variant === 'outline' && 'bg-[var(--color-primary)]'
          )}
        />
      )}
      {children}
    </BadgeComponent>
  )
}

export default Badge
