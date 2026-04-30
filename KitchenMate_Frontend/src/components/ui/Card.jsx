import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { motion } from 'framer-motion'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const cardVariants = {
  base: 'bg-[var(--color-surface)] rounded-[var(--radius-lg)] overflow-hidden',
  shadows: {
    none: '',
    sm: 'shadow-[var(--shadow-sm)]',
    md: 'shadow-[var(--shadow-md)]',
    lg: 'shadow-[var(--shadow-lg)]',
  },
  borders: {
    none: '',
    default: 'border border-[var(--color-border)]',
    strong: 'border-2 border-[var(--color-border-strong)]',
  },
}

export function Card({
  children,
  shadow = 'md',
  border = 'default',
  hover = false,
  className,
  as = 'div',
  whileHover,
  onClick,
  ...props
}) {
  const Component = motion[as] || motion.div

  const hoverProps = hover
    ? {
        whileHover: {
          y: -4,
          boxShadow: 'var(--shadow-lg)',
          transition: { type: 'spring', stiffness: 300, damping: 20 },
        },
      }
    : {}

  return (
    <Component
      className={cn(
        cardVariants.base,
        cardVariants.shadows[shadow],
        cardVariants.borders[border],
        hover && 'cursor-pointer transition-shadow duration-[var(--transition-base)]',
        className
      )}
      onClick={onClick}
      {...hoverProps}
      {...props}
    >
      {children}
    </Component>
  )
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div
      className={cn('px-5 py-4 border-b border-[var(--color-border)]', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn('px-5 py-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn('px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-background-alt)]', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
