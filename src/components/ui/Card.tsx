import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: ReactNode
  /** Adds a subtle lift + brand border on hover. */
  hover?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, children, hover = false, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'surface rounded-2xl shadow-card dark:shadow-none',
        hover &&
          'transition duration-200 hover:-translate-y-0.5 hover:border-brand-500/35 hover:shadow-[0_18px_40px_-24px_rgba(124,77,255,0.55)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})

export interface CardHeaderProps {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 pb-3 pt-5', className)}>
      <div className="min-w-0">
        <h3 className="truncate text-[15px] font-semibold tracking-tight">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}

export interface CardContentProps {
  className?: string
  children?: ReactNode
}

export function CardContent({ className, children }: CardContentProps) {
  return <div className={cn('px-5 pb-5', className)}>{children}</div>
}
