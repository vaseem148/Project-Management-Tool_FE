import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { differenceInCalendarDays } from 'date-fns'
import {
  CalendarCheck2,
  CalendarClock,
  CalendarRange,
  ChevronRight,
  CircleDashed,
  Flame,
  ListTodo,
  PartyPopper,
  Search,
  SquareCheckBig,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { EmptyState } from '@/components/ui'
import { TaskDetailDrawer } from '@/features/tasks/TaskDetailDrawer'
import { TaskFilters, defaultTaskFilters, type TaskFilterState } from '@/features/tasks/TaskFilters'
import { TaskListView } from '@/features/tasks/TaskListView'
import { useTasks } from '@/hooks/queries'
import { PRIORITY_META, cn, isOverdue, pluralize, toDate } from '@/lib/utils'
import type { Task } from '@/types'

/* ------------------------------------------------------------------ buckets */

type BucketKey = 'overdue' | 'today' | 'week' | 'later' | 'none'

interface BucketMeta {
  key: BucketKey
  label: string
  hint: string
  icon: LucideIcon
  tile: string
}

const BUCKETS: BucketMeta[] = [
  { key: 'overdue', label: 'Overdue', hint: 'Past the due date', icon: Flame, tile: 'bg-rose-500/12 text-rose-500' },
  { key: 'today', label: 'Today', hint: 'Due before the day is out', icon: CalendarClock, tile: 'bg-amber-500/14 text-amber-500' },
  { key: 'week', label: 'This week', hint: 'Landing in the next 7 days', icon: CalendarRange, tile: 'bg-sky-500/12 text-sky-500' },
  { key: 'later', label: 'Later', hint: 'Scheduled further out', icon: CalendarCheck2, tile: 'bg-violet-500/12 text-violet-500' },
  { key: 'none', label: 'No due date', hint: 'Unscheduled work', icon: CircleDashed, tile: 'bg-slate-500/12 text-slate-400' },
]

function bucketOf(task: Task): BucketKey {
  const date = toDate(task.due_date)
  if (!date) return 'none'
  const diff = differenceInCalendarDays(date, new Date())
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  if (diff <= 7) return 'week'
  return 'later'
}

/** Soonest first, then the loudest priority, so every section reads as a queue. */
function compareTasks(a: Task, b: Task) {
  const left = toDate(a.due_date)?.getTime()
  const right = toDate(b.due_date)?.getTime()
  if (left !== right) {
    if (left === undefined) return 1
    if (right === undefined) return -1
    return left - right
  }
  const rank = PRIORITY_META[b.priority].rank - PRIORITY_META[a.priority].rank
  return rank !== 0 ? rank : a.id - b.id
}

/* -------------------------------------------------------------------- pills */

type PillKey = 'all' | 'overdue' | 'today' | 'completed'

interface PillMeta {
  key: PillKey
  label: string
  icon: LucideIcon
  tile: string
  ring: string
}

const PILLS: PillMeta[] = [
  {
    key: 'all',
    label: 'All assigned',
    icon: ListTodo,
    tile: 'bg-brand-500/12 text-brand-500',
    ring: 'border-brand-500/45 bg-brand-500/[0.06]',
  },
  {
    key: 'overdue',
    label: 'Overdue',
    icon: Flame,
    tile: 'bg-rose-500/12 text-rose-500',
    ring: 'border-rose-500/45 bg-rose-500/[0.06]',
  },
  {
    key: 'today',
    label: 'Due today',
    icon: CalendarClock,
    tile: 'bg-amber-500/14 text-amber-500',
    ring: 'border-amber-500/45 bg-amber-500/[0.06]',
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: SquareCheckBig,
    tile: 'bg-emerald-500/14 text-emerald-500',
    ring: 'border-emerald-500/45 bg-emerald-500/[0.06]',
  },
]

function activePill(filters: TaskFilterState): PillKey | null {
  const onlyDone = filters.status.length === 1 && filters.status[0] === 'done'
  if (onlyDone && !filters.due) return 'completed'
  if (filters.status.length > 0) return null
  if (filters.due === 'overdue') return 'overdue'
  if (filters.due === 'today') return 'today'
  if (!filters.due) return 'all'
  return null
}

function applyPill(filters: TaskFilterState, key: PillKey): TaskFilterState {
  switch (key) {
    case 'overdue':
      return { ...filters, status: [], due: 'overdue' }
    case 'today':
      return { ...filters, status: [], due: 'today' }
    case 'completed':
      return { ...filters, status: ['done'], due: undefined }
    default:
      return { ...filters, status: [], due: undefined }
  }
}

function SummaryPill({
  meta,
  count,
  active,
  onSelect,
}: {
  meta: PillMeta
  count: number
  active: boolean
  onSelect: () => void
}) {
  const Icon = meta.icon
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        'surface flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition duration-200',
        'outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-ring)]',
        'hover:-translate-y-0.5 hover:border-brand-500/35',
        active && meta.ring,
      )}
    >
      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', meta.tile)}>
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-xl font-semibold leading-none tracking-tight tabular-nums">{count}</span>
        <span className="mt-1 block truncate text-xs text-muted">{meta.label}</span>
      </span>
    </button>
  )
}

/* ----------------------------------------------------------------- sections */

function BucketSection({
  meta,
  tasks,
  open,
  onToggle,
  onOpenTask,
}: {
  meta: BucketMeta
  tasks: Task[]
  open: boolean
  onToggle: () => void
  onOpenTask: (id: number) => void
}) {
  const Icon = meta.icon
  return (
    <section className="animate-fade-up">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition',
          'outline-none hover:bg-black/[0.03] focus-visible:ring-2 focus-visible:ring-[var(--app-ring)] dark:hover:bg-white/[0.04]',
        )}
      >
        <ChevronRight
          aria-hidden="true"
          className={cn(
            'h-4 w-4 shrink-0 text-[var(--app-muted)] transition-transform duration-200',
            open && 'rotate-90',
          )}
        />
        <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-lg', meta.tile)}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold tracking-tight">{meta.label}</span>
            <span className="rounded-full bg-black/[0.06] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-muted tabular-nums dark:bg-white/[0.08]">
              {tasks.length}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted">{meta.hint}</span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-2">
              <TaskListView tasks={tasks} isLoading={false} onOpenTask={onOpenTask} showProject />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

/* --------------------------------------------------------------------- page */

export default function MyTasks() {
  const [filters, setFilters] = useState<TaskFilterState>(defaultTaskFilters)
  const [openTaskId, setOpenTaskId] = useState<number | null>(null)
  const [collapsed, setCollapsed] = useState<Partial<Record<BucketKey, boolean>>>({})

  const listQuery = useTasks({ mine: true, ...filters, sort: 'due_date' })
  const summaryQuery = useTasks({ mine: true })

  const tasks = useMemo(() => listQuery.data ?? [], [listQuery.data])
  const mine = useMemo(() => summaryQuery.data ?? [], [summaryQuery.data])

  const counts = useMemo(() => {
    let overdue = 0
    let today = 0
    let completed = 0
    let open = 0
    for (const task of mine) {
      if (task.status === 'done') {
        completed += 1
        continue
      }
      open += 1
      if (isOverdue(task.due_date, task.status)) overdue += 1
      const date = toDate(task.due_date)
      if (date && differenceInCalendarDays(date, new Date()) === 0) today += 1
    }
    return { all: mine.length, overdue, today, completed, open }
  }, [mine])

  const projectCount = useMemo(() => new Set(mine.map((task) => task.project_id)).size, [mine])

  const groups = useMemo(() => {
    const map = new Map<BucketKey, Task[]>(BUCKETS.map((bucket) => [bucket.key, [] as Task[]]))
    for (const task of tasks) map.get(bucketOf(task))?.push(task)
    for (const list of map.values()) list.sort(compareTasks)
    return map
  }, [tasks])

  const flat = useMemo(() => [...tasks].sort(compareTasks), [tasks])

  const search = filters.q.trim()
  const pill = activePill(filters)
  const visibleBuckets = BUCKETS.filter((bucket) => (groups.get(bucket.key)?.length ?? 0) > 0)

  const subtitle = summaryQuery.isPending
    ? 'Gathering everything assigned to you…'
    : counts.open === 0
      ? 'Nothing open right now — enjoy the quiet.'
      : `${pluralize(counts.open, 'open task')} across ${pluralize(projectCount, 'project')}`

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="animate-fade-up">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">My Tasks</h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {PILLS.map((meta) => (
          <SummaryPill
            key={meta.key}
            meta={meta}
            count={counts[meta.key]}
            active={pill === meta.key}
            onSelect={() => setFilters((current) => applyPill(current, meta.key))}
          />
        ))}
      </div>

      <div className="mt-5">
        <TaskFilters value={filters} onChange={setFilters} showProject />
      </div>

      <div className="mt-6 space-y-5">
        {listQuery.isPending ? (
          <TaskListView tasks={[]} isLoading onOpenTask={setOpenTaskId} showProject />
        ) : tasks.length === 0 ? (
          <div className="surface rounded-2xl">
            <EmptyState
              icon={search ? Search : PartyPopper}
              title={search ? 'No tasks match that search' : 'You are all caught up 🎉'}
              description={
                search
                  ? 'Try a different keyword, or clear the filters to see everything assigned to you.'
                  : pill === 'completed'
                    ? 'Nothing finished under these filters yet — go ship something.'
                    : 'No open work is waiting on you right now. New assignments land here the moment they arrive.'
              }
            />
          </div>
        ) : search ? (
          <section className="animate-fade-up">
            <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-muted">
              {pluralize(flat.length, 'result')} for &ldquo;{search}&rdquo;
            </p>
            <TaskListView tasks={flat} isLoading={false} onOpenTask={setOpenTaskId} showProject />
          </section>
        ) : (
          visibleBuckets.map((bucket) => (
            <BucketSection
              key={bucket.key}
              meta={bucket}
              tasks={groups.get(bucket.key) ?? []}
              open={!collapsed[bucket.key]}
              onToggle={() => setCollapsed((current) => ({ ...current, [bucket.key]: !current[bucket.key] }))}
              onOpenTask={setOpenTaskId}
            />
          ))
        )}
      </div>

      <TaskDetailDrawer taskId={openTaskId} open={openTaskId !== null} onClose={() => setOpenTaskId(null)} />
    </div>
  )
}
