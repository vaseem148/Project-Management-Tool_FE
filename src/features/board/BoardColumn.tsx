import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { Badge, Button, Tooltip } from '@/components/ui'
import { STATUS_META, cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types'
import { SortableTaskCard } from './TaskCard'

export const COLUMN_ID_PREFIX = 'column:'

export interface BoardColumnProps {
  status: TaskStatus
  tasks: Task[]
  onAddTask: (status: TaskStatus) => void
  onOpenTask: (id: number) => void
  /** True while the card being dragged is hovering this column. */
  active?: boolean
}

export function BoardColumn({ status, tasks, onAddTask, onOpenTask, active = false }: BoardColumnProps) {
  const meta = STATUS_META[status]
  const { setNodeRef, isOver } = useDroppable({
    id: `${COLUMN_ID_PREFIX}${status}`,
    data: { type: 'column', status },
  })
  const highlight = isOver || active

  return (
    <section
      aria-label={meta.label}
      className={cn(
        'surface surface-2 flex max-h-[calc(100dvh-17rem)] min-h-[18rem] w-[300px] min-w-[300px] flex-1',
        'flex-col overflow-hidden rounded-2xl transition duration-200',
        highlight && 'border-brand-500/40',
      )}
    >
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-[var(--app-border)] bg-[var(--app-panel-2)]/85 px-3.5 py-3 backdrop-blur">
        <span className={cn('h-2 w-2 shrink-0 rounded-full', meta.dot)} aria-hidden="true" />
        <h3 className="truncate text-[13px] font-semibold tracking-tight">{meta.label}</h3>
        <Badge className="px-2 tabular-nums">{tasks.length}</Badge>
        <Tooltip label={`Add to ${meta.label}`} className="ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg"
            aria-label={`Add a task to ${meta.label}`}
            onClick={() => onAddTask(status)}
          >
            <Plus />
          </Button>
        </Tooltip>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          'scroll-thin flex-1 space-y-2.5 overflow-y-auto p-2.5 transition duration-200',
          highlight && 'bg-brand-500/[0.06] outline-2 outline-dashed outline-brand-500/45 -outline-offset-4',
        )}
      >
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onOpen={onOpenTask} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div
            className={cn(
              'grid h-24 place-items-center rounded-xl border border-dashed border-[var(--app-border)]',
              'text-xs font-medium text-muted transition',
              highlight && 'border-brand-500/40 text-brand-500',
            )}
          >
            Drop tasks here
          </div>
        )}
      </div>
    </section>
  )
}
