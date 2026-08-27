import { useId, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface TabItem {
  key: string
  label: string
  icon?: ReactNode
  count?: number
}

export interface TabsProps {
  tabs: TabItem[]
  value: string
  onChange: (key: string) => void
  className?: string
}

export function Tabs({ tabs, value, onChange, className }: TabsProps) {
  const layoutId = useId()

  return (
    <div
      role="tablist"
      className={cn(
        'scroll-thin surface surface-2 inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl p-1',
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.key === value
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={cn(
              'relative shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-medium tracking-tight transition',
              'outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-ring)]',
              active ? 'text-brand-600 dark:text-brand-200' : 'text-muted hover:text-[var(--app-text)]',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                aria-hidden="true"
                transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.6 }}
                className="absolute inset-0 rounded-lg bg-brand-500/12 ring-1 ring-inset ring-brand-500/25"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon && <span className="inline-flex [&_svg]:h-4 [&_svg]:w-4">{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                    active
                      ? 'bg-brand-500/20 text-brand-600 dark:text-brand-200'
                      : 'bg-black/[0.06] text-muted dark:bg-white/[0.08]',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
