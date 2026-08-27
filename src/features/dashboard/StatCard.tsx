import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'

export type StatTone = 'violet' | 'cyan' | 'emerald' | 'rose'

export interface StatDelta {
  /** Percent change against the previous period. */
  value: number
  /** Whether the movement is good news — drives the colour, not the arrow. */
  positive: boolean
  /** Short caption after the pill, e.g. "vs last week". */
  caption?: string
}

export interface StatCardProps {
  label: string
  value: number
  icon: LucideIcon
  tone?: StatTone
  /** Small sub-line under the number, used when there is no delta worth showing. */
  hint?: string
  delta?: StatDelta | null
  /** Position in the row — drives the entrance stagger. */
  index?: number
  to?: string
  className?: string
}

const TONES: Record<StatTone, { icon: string; wash: string; glow: string }> = {
  violet: {
    icon: 'bg-brand-500/12 text-brand-500 ring-brand-500/20',
    wash: 'bg-[radial-gradient(120%_120%_at_100%_0%,rgba(124,77,255,0.16),transparent_62%)]',
    glow: 'bg-brand-500/30',
  },
  cyan: {
    icon: 'bg-cyan-500/12 text-cyan-500 ring-cyan-500/20',
    wash: 'bg-[radial-gradient(120%_120%_at_100%_0%,rgba(34,211,238,0.16),transparent_62%)]',
    glow: 'bg-cyan-400/30',
  },
  emerald: {
    icon: 'bg-emerald-500/12 text-emerald-500 ring-emerald-500/20',
    wash: 'bg-[radial-gradient(120%_120%_at_100%_0%,rgba(16,185,129,0.16),transparent_62%)]',
    glow: 'bg-emerald-400/30',
  },
  rose: {
    icon: 'bg-rose-500/12 text-rose-500 ring-rose-500/20',
    wash: 'bg-[radial-gradient(120%_120%_at_100%_0%,rgba(244,63,94,0.16),transparent_62%)]',
    glow: 'bg-rose-400/30',
  },
}

/** Counts from 0 to `value` once on mount, then tweens between updates. */
function useCountUp(value: number, duration = 800) {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    if (from === value) return
    if (typeof window === 'undefined' || !window.requestAnimationFrame) {
      fromRef.current = value
      setDisplay(value)
      return
    }
    const started = performance.now()
    let frame = window.requestAnimationFrame(function step(now: number) {
      const t = Math.min(1, (now - started) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (t < 1) frame = window.requestAnimationFrame(step)
      else fromRef.current = value
    })
    return () => window.cancelAnimationFrame(frame)
  }, [value, duration])

  return display
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'violet',
  hint,
  delta,
  index = 0,
  to,
  className,
}: StatCardProps) {
  const display = useCountUp(value)
  const palette = TONES[tone]
  const rising = (delta?.value ?? 0) >= 0
  const DeltaIcon = rising ? ArrowUpRight : ArrowDownRight

  const card = (
    <Card hover className="relative h-full overflow-hidden">
      <span aria-hidden="true" className={cn('pointer-events-none absolute inset-0', palette.wash)} />
      <span
        aria-hidden="true"
        className={cn('pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full blur-3xl', palette.glow)}
      />
      <div className="relative flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</p>
          <p className="mt-2.5 text-[32px] font-semibold leading-none tracking-tight tabular-nums">
            {display.toLocaleString()}
          </p>
          <div className="mt-3 flex min-h-[20px] flex-wrap items-center gap-x-2 gap-y-1">
            {delta && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                  delta.positive
                    ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300'
                    : 'bg-rose-500/12 text-rose-600 dark:text-rose-300',
                )}
              >
                <DeltaIcon className="h-3 w-3" aria-hidden="true" />
                {Math.abs(delta.value)}%
              </span>
            )}
            {(delta?.caption || hint) && (
              <span className="truncate text-xs text-muted">{delta?.caption ?? hint}</span>
            )}
          </div>
        </div>
        <span
          aria-hidden="true"
          className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ring-inset', palette.icon)}
        >
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </span>
      </div>
    </Card>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={cn('h-full', className)}
    >
      {to ? (
        <Link
          to={to}
          aria-label={`${label}: ${value}`}
          className="block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-bg)]"
        >
          {card}
        </Link>
      ) : (
        card
      )}
    </motion.div>
  )
}
