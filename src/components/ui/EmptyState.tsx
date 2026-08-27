import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex animate-fade-up flex-col items-center justify-center px-6 py-14 text-center',
        className,
      )}
    >
      <div className="relative mb-5 grid h-20 w-20 place-items-center">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500/25 via-indigo-500/15 to-cyan-400/20 blur-md"
        />
        <span
          aria-hidden="true"
          className="absolute inset-2 rounded-full bg-gradient-to-br from-brand-500/20 via-indigo-500/12 to-cyan-400/15 ring-1 ring-inset ring-brand-500/20"
        />
        <Icon className="relative h-8 w-8 text-brand-500" strokeWidth={1.75} />
      </div>
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  )
}
