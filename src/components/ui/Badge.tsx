import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type BadgeVariant = 'default' | 'soft'

export interface BadgeProps {
  children: ReactNode
  className?: string
  /** Tailwind background class for the leading dot, e.g. `bg-emerald-500`. */
  dot?: string
  variant?: BadgeVariant
}

const VARIANTS: Record<BadgeVariant, string> = {
  default: 'border border-[var(--app-border)] bg-[var(--app-panel-2)] text-[var(--app-text)]',
  soft: 'bg-brand-500/12 text-brand-600 dark:text-brand-300',
}

export function Badge({ children, className, dot, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-5 tracking-tight',
        VARIANTS[variant],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dot)} aria-hidden="true" />}
      <span className="truncate">{children}</span>
    </span>
  )
}
