import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const buttonVariants = {
  base: 'inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-md)] transition-all duration-[var(--transition-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  variants: {
    primary: 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)] hover:bg-[var(--color-primary-dark)] hover:shadow-[var(--shadow-md)] active:scale-[0.98]',
    secondary: 'bg-[var(--color-secondary)] text-white shadow-[var(--shadow-sm)] hover:bg-[var(--color-secondary-dark)] hover:shadow-[var(--shadow-md)] active:scale-[0.98]',
    accent: 'bg-[var(--color-accent)] text-[var(--color-text)] shadow-[var(--shadow-sm)] hover:bg-[var(--color-accent-dark)] hover:shadow-[var(--shadow-md)] active:scale-[0.98]',
    outline: 'border-2 border-[var(--color-primary)] text-[var(--color-primary)] bg-transparent hover:bg-[var(--color-primary)] hover:text-white active:scale-[0.98]',
    ghost: 'text-[var(--color-text)] hover:bg-[var(--color-background-alt)] active:bg-[var(--color-border)]',
    danger: 'bg-red-600 text-white shadow-[var(--shadow-sm)] hover:bg-red-700 hover:shadow-[var(--shadow-md)] active:scale-[0.98]',
  },
  sizes: {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-5 text-base',
    lg: 'h-12 px-8 text-lg',
    icon: 'h-10 w-10',
  },
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  onClick,
  type = 'button',
  whileTap = { scale: 0.98 },
  whileHover = { y: -2 },
  ...props
}) {
  const variantClasses = buttonVariants.variants[variant] || buttonVariants.variants.primary
  const sizeClasses = buttonVariants.sizes[size] || buttonVariants.sizes.md

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(buttonVariants.base, variantClasses, sizeClasses, className)}
      whileHover={whileHover}
      whileTap={whileTap}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : leftIcon ? (
        <span className="flex-shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !isLoading && <span className="flex-shrink-0">{rightIcon}</span>}
    </motion.button>
  )
}

export default Button
