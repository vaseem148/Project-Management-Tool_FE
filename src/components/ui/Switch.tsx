import { useId } from 'react'
import { cn } from '@/lib/utils'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  className?: string
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}: SwitchProps) {
  const labelId = useId()

  const toggle = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={label ? labelId : undefined}
      aria-label={label ? undefined : 'Toggle'}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition duration-200',
        'outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-bg)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'brand-gradient shadow-[0_6px_18px_-8px_rgba(124,77,255,0.9)]' : 'bg-[var(--app-border)]',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )

  if (!label && !description) return <span className={className}>{toggle}</span>

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <div className="min-w-0">
        {label && (
          <span id={labelId} className="block text-sm font-medium tracking-tight">
            {label}
          </span>
        )}
        {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
      </div>
      {toggle}
    </div>
  )
}
