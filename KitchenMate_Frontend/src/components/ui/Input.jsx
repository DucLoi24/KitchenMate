import { forwardRef } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

const inputVariants = {
  base: 'w-full bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] border rounded-[var(--radius-md)] transition-all duration-[var(--transition-base)] focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
  variants: {
    default: 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]',
    error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
    success: 'border-green-500 focus:border-green-500 focus:ring-green-500',
  },
  sizes: {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-base',
    lg: 'h-12 px-5 text-lg',
  },
}

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    variant = 'default',
    size = 'md',
    leftIcon,
    rightIcon,
    className,
    type = 'text',
    disabled,
    required,
    id,
    ...props
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--color-text)] flex items-center gap-1"
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 flex items-center justify-center text-[var(--color-text-muted)] pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          disabled={disabled}
          required={required}
          className={cn(
            inputVariants.base,
            inputVariants.variants[error ? 'error' : variant],
            inputVariants.sizes[size],
            leftIcon && 'pl-10',
            (rightIcon || isPassword) && 'pr-10',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        {rightIcon && !isPassword && (
          <span className="absolute right-3 flex items-center justify-center text-[var(--color-text-muted)] pointer-events-none">
            {rightIcon}
          </span>
        )}
      </div>
      <AnimatePresence mode="wait">
        {(error || helperText) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={cn('flex items-center gap-1 text-sm', error ? 'text-red-500' : 'text-[var(--color-text-secondary)]')}
          >
            {error && <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
            <span>{error || helperText}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default Input
