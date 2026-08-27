import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckCircle2,
  ChevronsUpDown,
  ListChecks,
  MessageSquare,
} from 'lucide-react'
import { Avatar, Badge, Card, EmptyState, Skeleton } from '@/components/ui'
import {
  PRIORITY_META,
  STATUS_META,
  TASK_STATUSES,
  cn,
  colorClasses,
  formatDueDate,
  isOverdue,
  toDate,
} from '@/lib/utils'
import type { Task } from '@/types'

export interface TaskListViewProps {
  tasks: Task[]
  isLoading: boolean
  onOpenTask: (id: number) => void
  showProject?: boolean
}

type SortKey = 'title' | 'status' | 'priority' | 'due_date'
interface SortState {
  key: SortKey
  dir: 'asc' | 'desc'
}

const SKELETON_ROWS = 6

function compare(a: Task, b: Task, key: SortKey): number {
  switch (key) {
    case 'title':
      return a.title.localeCompare(b.title)
    case 'status':
      return TASK_STATUSES.indexOf(a.status) - TASK_STATUSES.indexOf(b.status)
    case 'priority':
      return PRIORITY_META[a.priority].rank - PRIORITY_META[b.priority].rank
    case 'due_date': {
      const left = toDate(a.due_date)?.getTime() ?? null
      const right = toDate(b.due_date)?.getTime() ?? null
      if (left === null && right === null) return 0
      if (left === null) return Number.POSITIVE_INFINITY
      if (right === null) return Number.NEGATIVE_INFINITY
      return left - right
    }
  }
}

/* ------------------------------------------------------------------- pieces */

function ProjectChip({ task }: { task: Task }) {
  if (!task.project) return null
  const tone = colorClasses(task.project.color)
  return (
    <span
      className={cn(
        'inline-flex max-w-[10rem] items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
        'uppercase tracking-wide',
        tone.soft,
        tone.text,
      )}
      title={task.project.name}
    >
      <span aria-hidden="true" className={cn('h-1.5 w-1.5 shrink-0 rounded-full', tone.bg)} />
      <span className="truncate">{task.project.key}</span>
    </span>
  )
}

function DueCell({ task }: { task: Task }) {
  const due = formatDueDate(task.due_date)
  if (!due) return <span className="text-muted">—</span>
  const late = isOverdue(task.due_date, task.status)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap',
        late ? 'font-semibold text-rose-500' : 'text-muted',
      )}
    >
      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
      {due}
    </span>
  )
}

function CommentsCell({ task }: { task: Task }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 tabular-nums',
        task.comment_count > 0 ? 'text-[var(--app-text)]' : 'text-muted opacity-60',
      )}
    >
      <MessageSquare className="h-3.5 w-3.5 shrink-0" />
      {task.comment_count}
    </span>
  )
}

function AssigneeCell({ task }: { task: Task }) {
  if (!task.assignee) {
    return (
      <span className="inline-flex items-center gap-2 text-muted">
        <span
          aria-hidden="true"
          className="h-6 w-6 shrink-0 rounded-full border border-dashed border-[var(--app-border)]"
        />
        <span className="truncate text-xs">Unassigned</span>
      </span>
    )
  }
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Avatar user={task.assignee} size="xs" showTitle={false} />
      <span className="truncate">{task.assignee.full_name}</span>
    </span>
  )
}

function TaskTitle({ task, showProject }: { task: Task; showProject?: boolean }) {
  const done = task.status === 'done'
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      {done ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
      ) : (
        <span
          aria-hidden="true"
          className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-[1.5px] border-[var(--app-border)]"
        />
      )}
      <div className="min-w-0">
        <p
          className={cn(
            'truncate font-medium tracking-tight',
            done && 'text-muted line-through decoration-[1.5px]',
          )}
        >
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {showProject && <ProjectChip task={task} />}
          {task.subtask_count > 0 && (
            <span className="text-[11px] tabular-nums text-muted">
              {task.subtask_done_count}/{task.subtask_count} subtasks
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

interface SortHeaderProps {
  label: string
  sortKey: SortKey
  sort: SortState | null
  onSort: (key: SortKey) => void
  className?: string
}

function SortHeader({ label, sortKey, sort, onSort, className }: SortHeaderProps) {
  const active = sort?.key === sortKey
  const Icon = !active ? ChevronsUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn(
        'sticky top-0 z-10 border-b border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-2.5 text-left',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'group/sort inline-flex items-center gap-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider',
          'outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--app-ring)]',
          active ? 'text-brand-600 dark:text-brand-300' : 'text-muted hover:text-[var(--app-text)]',
        )}
      >
        {label}
        <Icon
          className={cn(
            'h-3 w-3 shrink-0 transition',
            active ? 'opacity-100' : 'opacity-0 group-hover/sort:opacity-60',
          )}
        />
      </button>
    </th>
  )
}

function PlainHeader({ label, className }: { label: string; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        'sticky top-0 z-10 border-b border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-2.5 text-left',
        'text-[11px] font-semibold uppercase tracking-wider text-muted',
        className,
      )}
    >
      {label}
    </th>
  )
}

function Cell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn('border-b border-[var(--app-border)]/70 px-4 py-3 align-middle', className)}>{children}</td>
  )
}

/* ---------------------------------------------------------------- list view */

export function TaskListView({ tasks, isLoading, onOpenTask, showProject = false }: TaskListViewProps) {
  const [sort, setSort] = useState<SortState | null>(null)

  const rows = useMemo(() => {
    if (!sort) return tasks
    const factor = sort.dir === 'asc' ? 1 : -1
    return [...tasks].sort((a, b) => {
      const result = compare(a, b, sort.key)
      // Undated tasks always sink to the bottom, whichever way we sort.
      if (result === Number.POSITIVE_INFINITY) return 1
      if (result === Number.NEGATIVE_INFINITY) return -1
      return result * factor
    })
  }, [tasks, sort])

  const onSort = (key: SortKey) =>
    setSort((current) => {
      if (current?.key !== key) return { key, dir: 'asc' }
      return current.dir === 'asc' ? { key, dir: 'desc' } : null
    })

  const openOnKey = (event: KeyboardEvent<HTMLElement>, id: number) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onOpenTask(id)
  }

  if (!isLoading && tasks.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={ListChecks}
          title="No tasks here"
          description="Nothing matches these filters yet. Try clearing a filter or creating a new task."
        />
      </Card>
    )
  }

  const skeletons = Array.from({ length: SKELETON_ROWS }, (_, index) => index)

  return (
    <>
      {/* Table — md and up */}
      <Card className="hidden overflow-hidden md:block">
        <div className="scroll-thin max-h-[calc(100vh-19rem)] min-h-[12rem] overflow-auto overscroll-contain">
          <table className="w-full min-w-[820px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <SortHeader label="Task" sortKey="title" sort={sort} onSort={onSort} />
                <SortHeader label="Status" sortKey="status" sort={sort} onSort={onSort} className="w-[140px]" />
                <SortHeader label="Priority" sortKey="priority" sort={sort} onSort={onSort} className="w-[130px]" />
                <PlainHeader label="Assignee" className="w-[190px]" />
                <SortHeader label="Due" sortKey="due_date" sort={sort} onSort={onSort} className="w-[130px]" />
                <PlainHeader label="Comments" className="w-[110px]" />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? skeletons.map((index) => (
                    <tr key={index}>
                      <Cell>
                        <div className="flex items-center gap-2.5">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className={cn('h-4', index % 2 === 0 ? 'w-64' : 'w-48')} />
                        </div>
                      </Cell>
                      <Cell>
                        <Skeleton className="h-5 w-24 rounded-full" />
                      </Cell>
                      <Cell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </Cell>
                      <Cell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-6 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </Cell>
                      <Cell>
                        <Skeleton className="h-4 w-16" />
                      </Cell>
                      <Cell>
                        <Skeleton className="h-4 w-8" />
                      </Cell>
                    </tr>
                  ))
                : rows.map((task, index) => (
                    <motion.tr
                      key={task.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3), ease: [0.22, 1, 0.36, 1] }}
                      tabIndex={0}
                      role="button"
                      aria-label={'Open task ' + task.title}
                      onClick={() => onOpenTask(task.id)}
                      onKeyDown={(event) => openOnKey(event, task.id)}
                      className={cn(
                        'group cursor-pointer outline-none transition',
                        'hover:bg-black/[0.028] focus-visible:bg-black/[0.035]',
                        'dark:hover:bg-white/[0.035] dark:focus-visible:bg-white/[0.045]',
                      )}
                    >
                      <Cell className="relative pl-6">
                        <span
                          aria-hidden="true"
                          className={cn(
                            'absolute inset-y-2 left-0 w-1 rounded-r-full opacity-80 transition group-hover:opacity-100',
                            PRIORITY_META[task.priority].dot,
                          )}
                        />
                        <TaskTitle task={task} showProject={showProject} />
                      </Cell>
                      <Cell>
                        <Badge
                          className={cn('border-transparent', STATUS_META[task.status].chip)}
                          dot={STATUS_META[task.status].dot}
                        >
                          {STATUS_META[task.status].label}
                        </Badge>
                      </Cell>
                      <Cell>
                        <Badge className={cn('border-transparent', PRIORITY_META[task.priority].chip)}>
                          {PRIORITY_META[task.priority].label}
                        </Badge>
                      </Cell>
                      <Cell className="max-w-[190px]">
                        <AssigneeCell task={task} />
                      </Cell>
                      <Cell>
                        <DueCell task={task} />
                      </Cell>
                      <Cell>
                        <CommentsCell task={task} />
                      </Cell>
                    </motion.tr>
                  ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cards — below md */}
      <div className="grid gap-2.5 md:hidden">
        {isLoading
          ? skeletons.map((index) => (
              <Card key={index} className="p-4">
                <Skeleton className="h-4 w-2/3" />
                <div className="mt-3 flex items-center gap-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-3.5 w-28" />
                </div>
              </Card>
            ))
          : rows.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3), ease: [0.22, 1, 0.36, 1] }}
              >
                <Card
                  hover
                  role="button"
                  tabIndex={0}
                  aria-label={'Open task ' + task.title}
                  onClick={() => onOpenTask(task.id)}
                  onKeyDown={(event) => openOnKey(event, task.id)}
                  className="relative cursor-pointer overflow-hidden p-4 pl-5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-ring)]"
                >
                  <span
                    aria-hidden="true"
                    className={cn('absolute inset-y-0 left-0 w-1', PRIORITY_META[task.priority].dot)}
                  />
                  <TaskTitle task={task} showProject={showProject} />
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Badge
                      className={cn('border-transparent', STATUS_META[task.status].chip)}
                      dot={STATUS_META[task.status].dot}
                    >
                      {STATUS_META[task.status].label}
                    </Badge>
                    <Badge className={cn('border-transparent', PRIORITY_META[task.priority].chip)}>
                      {PRIORITY_META[task.priority].label}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--app-border)]/70 pt-3 text-xs">
                    <AssigneeCell task={task} />
                    <div className="flex shrink-0 items-center gap-3">
                      <DueCell task={task} />
                      <CommentsCell task={task} />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
      </div>
    </>
  )
}
