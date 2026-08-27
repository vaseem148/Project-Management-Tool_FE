import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { CalendarClock, CalendarCheck2, ChevronRight } from 'lucide-react'
import { Avatar, Badge, Card, CardContent, CardHeader, EmptyState, Tooltip } from '@/components/ui'
import { PRIORITY_META, cn, colorClasses, formatDueDate, isOverdue } from '@/lib/utils'
import type { Task } from '@/types'

export interface UpcomingPanelProps {
  tasks: Task[]
  className?: string
}

export function UpcomingPanel({ tasks, className }: UpcomingPanelProps) {
  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <CardHeader
        title="Up next"
        description="Closest deadlines across your projects"
        action={
          <Link
            to="/tasks"
            className="inline-flex items-center gap-0.5 rounded-lg text-xs font-medium text-muted transition hover:text-brand-500"
          >
            View all
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        }
      />
      <CardContent className="flex-1">
        {tasks.length === 0 ? (
          <EmptyState
            icon={CalendarCheck2}
            title="Nothing due"
            description="No open task has a deadline right now. Enjoy the calm."
            className="py-10"
          />
        ) : (
          <ul className="-mx-2 space-y-0.5">
            {tasks.map((task, index) => {
              const overdue = isOverdue(task.due_date, task.status)
              const due = formatDueDate(task.due_date)
              const priority = PRIORITY_META[task.priority]
              const projectTone = colorClasses(task.project?.color)
              return (
                <motion.li
                  key={task.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    to={`/projects/${task.project_id}?task=${task.id}`}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-2 py-2 transition',
                      'hover:bg-black/[0.035] dark:hover:bg-white/[0.05]',
                      'outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-ring)]',
                    )}
                  >
                    <Tooltip label={`${priority.label} priority`}>
                      <span
                        aria-hidden="true"
                        className={cn('mt-0.5 h-2 w-2 shrink-0 rounded-full', priority.dot)}
                      />
                    </Tooltip>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium transition group-hover:text-brand-500">
                        {task.title}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {task.project && (
                          <Badge dot={projectTone.bg} className="max-w-[10rem]">
                            {task.project.name}
                          </Badge>
                        )}
                        {due && (
                          <Badge
                            className={cn(
                              overdue &&
                                'border-transparent bg-rose-500/14 text-rose-600 dark:bg-rose-500/16 dark:text-rose-300',
                            )}
                          >
                            <CalendarClock className="h-3 w-3 shrink-0" aria-hidden="true" />
                            {overdue ? `Overdue · ${due}` : due}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Avatar user={task.assignee} size="xs" className="shrink-0" />
                  </Link>
                </motion.li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
