import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'brand-gradient text-white shadow-[0_8px_24px_-10px_rgba(124,77,255,0.9)] hover:brightness-110',
  secondary:
    'surface surface-2 text-[var(--app-text)] hover:bg-black/[0.035] dark:hover:bg-white/[0.06]',
  outline:
    'bg-transparent border border-[var(--app-border)] text-[var(--app-text)] hover:bg-black/[0.035] hover:border-brand-500/40 dark:hover:bg-white/[0.06]',
  ghost: 'bg-transparent text-[var(--app-text)] hover:bg-black/5 dark:hover:bg-white/5',
  danger:
    'bg-rose-500 text-white shadow-[0_8px_24px_-10px_rgba(244,63,94,0.9)] hover:bg-rose-600',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2.5 px-6 text-[15px]',
  icon: 'h-10 w-10 shrink-0 p-0',
}

const ICON_SIZE: Record<ButtonSize, string> = {
  sm: '[&_svg]:h-3.5 [&_svg]:w-3.5',
  md: '[&_svg]:h-4 [&_svg]:w-4',
  lg: '[&_svg]:h-[18px] [&_svg]:w-[18px]',
  icon: '[&_svg]:h-[18px] [&_svg]:w-[18px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, leftIcon, rightIcon, className, children, disabled, ...props },
  ref,
) {
  const isDisabled = disabled || loading
  return (
    <button
      ref={ref}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'relative inline-flex select-none items-center justify-center whitespace-nowrap rounded-xl font-medium tracking-tight',
        'transition duration-150 active:scale-[0.98]',
        'outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-bg)]',
        'disabled:pointer-events-none disabled:opacity-50',
        SIZES[size],
        ICON_SIZE[size],
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Spinner className={cn(size === 'lg' ? 'h-[18px] w-[18px]' : 'h-4 w-4', size !== 'icon' && children ? '-ml-0.5' : '')} />
      ) : (
        leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>
      )}
      {size === 'icon' ? (loading ? null : children) : children}
      {!loading && rightIcon && <span className="inline-flex shrink-0 items-center">{rightIcon}</span>}
    </button>
  )
})
