import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface ProgressProps {
  /** 0 – 100 */
  value: number
  className?: string
  barClassName?: string
  label?: string
}

export function Progress({ value, className, barClassName, label }: ProgressProps) {
  const safe = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(safe)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Progress'}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-[var(--app-border)]', className)}
    >
      <motion.div
        className={cn('h-full rounded-full brand-gradient', barClassName)}
        initial={{ width: 0 }}
        animate={{ width: `${safe}%` }}
        transition={{ type: 'spring', stiffness: 140, damping: 22, mass: 0.6 }}
      />
    </div>
  )
}
