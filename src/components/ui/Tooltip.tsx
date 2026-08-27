import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TooltipProps {
  label: string
  children: ReactNode
  side?: 'top' | 'bottom'
  className?: string
}

/** Dependency-free tooltip. Reveals on hover and on keyboard focus within. */
export function Tooltip({ label, children, side = 'top', className }: TooltipProps) {
  return (
    <span className={cn('group/tt relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg px-2 py-1',
          'text-[11px] font-medium leading-4 shadow-lg',
          'bg-ink-900 text-ink-50 dark:bg-ink-100 dark:text-ink-900',
          'opacity-0 transition duration-150 ease-out',
          'group-hover/tt:opacity-100 group-focus-within/tt:opacity-100',
          side === 'top'
            ? 'bottom-full mb-2 translate-y-1 group-hover/tt:translate-y-0 group-focus-within/tt:translate-y-0'
            : 'top-full mt-2 -translate-y-1 group-hover/tt:translate-y-0 group-focus-within/tt:translate-y-0',
        )}
      >
        {label}
      </span>
    </span>
  )
}
