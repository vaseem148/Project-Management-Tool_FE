import {
  forwardRef,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CalendarDays, CheckSquare, MessageSquare } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { PRIORITY_META, cn, colorClasses, formatDueDate, isOverdue, pluralize } from '@/lib/utils'
import type { Task } from '@/types'

const MAX_LABELS = 3
/** Pointer travel (px) above which a release counts as a drag rather than a click. */
const CLICK_SLOP = 6

export interface TaskCardProps extends HTMLAttributes<HTMLDivElement> {
  task: Task
  onOpen?: (id: number) => void
  /** The placeholder left behind while the card is being dragged. */
  dragging?: boolean
  /** The floating copy rendered inside the DragOverlay. */
  overlay?: boolean
}

export const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(function TaskCard(
  { task, onOpen, dragging = false, overlay = false, className, onPointerDown, onClick, onKeyDown, ...rest },
  ref,
) {
  const pressOrigin = useRef<{ x: number; y: number } | null>(null)

  const labels = task.labels.slice(0, MAX_LABELS)
  const extraLabels = task.labels.length - labels.length
  const priority = PRIORITY_META[task.priority]
  const due = formatDueDate(task.due_date)
  const overdue = isOverdue(task.due_date, task.status)
  const total = task.subtask_count
  const done = task.subtask_done_count
  const subtaskPct = total > 0 ? Math.round((done / total) * 100) : 0

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    pressOrigin.current = { x: event.clientX, y: event.clientY }
    onPointerDown?.(event)
  }

  function handleClick(event: ReactMouseEvent<HTMLDivElement>) {
    onClick?.(event)
    if (dragging || overlay) return
    const origin = pressOrigin.current
    if (origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > CLICK_SLOP) return
    onOpen?.(task.id)
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event)
    // Space lifts the card (KeyboardSensor), so Enter is free to open it.
    if (event.key !== 'Enter' || dragging || overlay || event.defaultPrevented) return
    event.preventDefault()
    onOpen?.(task.id)
  }

  return (
    <div
      ref={ref}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'surface group/card relative touch-none select-none rounded-xl p-3.5',
        'cursor-grab transition duration-150 active:cursor-grabbing',
        'hover:border-brand-500/35 hover:ring-2 hover:ring-brand-500/15',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-ring)]',
        dragging && 'opacity-40',
        overlay &&
          'rotate-2 cursor-grabbing border-brand-500/40 ring-2 ring-brand-500/25 shadow-[0_28px_60px_-18px_rgba(8,10,18,0.65)]',
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-3 font-mono text-[10px] font-medium tracking-tight text-muted opacity-0 transition group-hover/card:opacity-100"
      >
        #{task.id}
      </span>

      {labels.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-1 pr-10">
          {labels.map((label) => {
            const tone = colorClasses(label.color)
            return (
              <span
                key={label.id}
                className={cn(
                  'max-w-[9rem] truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-4',
                  tone.soft,
                  tone.text,
                )}
              >
                {label.name}
              </span>
            )
          })}
          {extraLabels > 0 && <span className="text-[10px] font-medium text-muted">+{extraLabels}</span>}
        </div>
      )}

      <h4
        className={cn(
          'line-clamp-2 text-[13.5px] font-medium leading-snug tracking-tight',
          labels.length === 0 && 'pr-10',
        )}
      >
        {task.title}
      </h4>

      {total > 0 && (
        <div className="mt-2.5 flex items-center gap-2">
          <CheckSquare className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
          <span className="text-[11px] font-medium tabular-nums text-muted">
            {done}/{total}
          </span>
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--app-border)]">
            <span
              className="block h-full rounded-full bg-emerald-500 transition-[width] duration-300"
              style={{ width: `${subtaskPct}%` }}
            />
          </span>
        </div>
      )}

      <div className="mt-3 flex items-center gap-1.5">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-4',
            priority.chip,
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', priority.dot)} aria-hidden="true" />
          {priority.label}
        </span>

        {due && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-4',
              overdue
                ? 'bg-rose-500/14 text-rose-600 dark:text-rose-300'
                : 'bg-black/[0.04] text-muted dark:bg-white/[0.06]',
            )}
            title={overdue ? 'Overdue' : 'Due date'}
          >
            <CalendarDays className="h-3 w-3" aria-hidden="true" />
            {due}
          </span>
        )}

        {task.comment_count > 0 && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-medium text-muted"
            title={pluralize(task.comment_count, 'comment')}
          >
            <MessageSquare className="h-3 w-3" aria-hidden="true" />
            {task.comment_count}
          </span>
        )}

        <Avatar user={task.assignee ?? null} size="xs" className="ml-auto" />
      </div>
    </div>
  )
})

export interface SortableTaskCardProps {
  task: Task
  onOpen: (id: number) => void
}

/** A TaskCard wired into the surrounding SortableContext. */
export function SortableTaskCard({ task, onOpen }: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', status: task.status },
  })

  return (
    <TaskCard
      ref={setNodeRef}
      task={task}
      onOpen={onOpen}
      dragging={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...(listeners as unknown as HTMLAttributes<HTMLDivElement>)}
    />
  )
}
