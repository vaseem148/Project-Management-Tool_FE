import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronRight, Users } from 'lucide-react'
import { Avatar, Card, CardContent, CardHeader, EmptyState, Progress, Tooltip } from '@/components/ui'
import { cn, pluralize } from '@/lib/utils'
import type { WorkloadEntry } from '@/types'

export interface WorkloadPanelProps {
  entries: WorkloadEntry[]
  className?: string
}

export function WorkloadPanel({ entries, className }: WorkloadPanelProps) {
  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <CardHeader
        title="Team workload"
        description="Completed vs. assigned per teammate"
        action={
          <Link
            to="/team"
            className="inline-flex items-center gap-0.5 rounded-lg text-xs font-medium text-muted transition hover:text-brand-500"
          >
            View all
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        }
      />
      <CardContent className="flex-1">
        {entries.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No one is assigned yet"
            description="Assign tasks to teammates to see how the load is spread."
            className="py-10"
          />
        ) : (
          <ul className="space-y-4">
            {entries.map((entry, index) => {
              const total = entry.open_tasks + entry.done_tasks
              const percent = total > 0 ? Math.round((entry.done_tasks / total) * 100) : 0
              return (
                <motion.li
                  key={entry.user.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-3"
                >
                  <Avatar user={entry.user} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[13px] font-medium">{entry.user.full_name}</p>
                      <Tooltip label={`${percent}% done · ${pluralize(entry.open_tasks, 'task')} open`}>
                        <span className="shrink-0 text-[11px] text-muted tabular-nums">
                          {entry.done_tasks}/{total}
                        </span>
                      </Tooltip>
                    </div>
                    <Progress
                      value={percent}
                      className="mt-2 h-1.5"
                      label={`${entry.user.full_name} workload`}
                    />
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
                      entry.open_tasks > 0
                        ? 'bg-amber-500/14 text-amber-600 dark:text-amber-300'
                        : 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300',
                    )}
                  >
                    {entry.open_tasks} open
                  </span>
                </motion.li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
