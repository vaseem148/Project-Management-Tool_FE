import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Skeleton } from '@/components/ui'
import { useMoveTask, useTasks } from '@/hooks/queries'
import { TASK_STATUSES } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types'
import type { TaskFilterState } from '@/features/tasks/TaskFilters'
import { BoardColumn, COLUMN_ID_PREFIX } from './BoardColumn'
import { TaskCard } from './TaskCard'

const POSITION_GAP = 1000

export interface BoardViewProps {
  projectId: number
  filters: TaskFilterState
  onOpenTask: (id: number) => void
  onAddTask: (status: TaskStatus) => void
}

/** `column:in_progress` -> `in_progress`; anything else is a task id. */
function statusFromDroppableId(id: string): TaskStatus | null {
  if (!id.startsWith(COLUMN_ID_PREFIX)) return null
  const status = id.slice(COLUMN_ID_PREFIX.length) as TaskStatus
  return TASK_STATUSES.includes(status) ? status : null
}

/** Midpoint between the neighbours the card is dropped between. */
function positionBetween(previous?: Task, next?: Task): number {
  if (previous && next) return (previous.position + next.position) / 2
  if (next) return next.position - POSITION_GAP
  if (previous) return previous.position + POSITION_GAP
  return POSITION_GAP
}

function BoardSkeleton() {
  return (
    <div className="scroll-thin flex gap-4 overflow-x-auto pb-2">
      {TASK_STATUSES.map((status, columnIndex) => (
        <div key={status} className="surface surface-2 w-[300px] min-w-[300px] flex-1 rounded-2xl p-2.5">
          <Skeleton className="mb-3 h-6 w-32 rounded-lg" />
          <div className="space-y-2.5">
            {Array.from({ length: 3 - (columnIndex % 2) }).map((_, cardIndex) => (
              <Skeleton key={cardIndex} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function BoardView({ projectId, filters, onOpenTask, onAddTask }: BoardViewProps) {
  const { data: tasks, isLoading } = useTasks({
    project_id: projectId,
    q: filters.q || undefined,
    status: filters.status.length ? filters.status : undefined,
    priority: filters.priority.length ? filters.priority : undefined,
    assignee_id: filters.assignee_id,
    label_id: filters.label_id,
    due: filters.due,
    sort: 'position',
  })
  const moveTask = useMoveTask()

  const [activeId, setActiveId] = useState<number | null>(null)
  const [overStatus, setOverStatus] = useState<TaskStatus | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const columns = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
    }
    for (const task of tasks ?? []) grouped[task.status]?.push(task)
    for (const status of TASK_STATUSES) grouped[status].sort((a, b) => a.position - b.position)
    return grouped
  }, [tasks])

  const activeTask = useMemo(
    () => (activeId === null ? null : (tasks ?? []).find((task) => task.id === activeId) ?? null),
    [activeId, tasks],
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(Number(event.active.id))
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event
    if (!over) {
      setOverStatus(null)
      return
    }
    const column = statusFromDroppableId(String(over.id))
    if (column) {
      setOverStatus(column)
      return
    }
    const hovered = (tasks ?? []).find((task) => task.id === Number(over.id))
    setOverStatus(hovered?.status ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    setOverStatus(null)
    if (!over) return

    const dragged = (tasks ?? []).find((task) => task.id === Number(active.id))
    if (!dragged) return

    const overColumn = statusFromDroppableId(String(over.id))
    const overTask = overColumn ? null : (tasks ?? []).find((task) => task.id === Number(over.id))
    const targetStatus = overColumn ?? overTask?.status
    if (!targetStatus) return

    // Neighbours are computed without the dragged card so it cannot anchor to itself.
    const siblings = columns[targetStatus].filter((task) => task.id !== dragged.id)
    const index = overTask ? siblings.findIndex((task) => task.id === overTask.id) : siblings.length
    const insertAt = index === -1 ? siblings.length : index
    const position = positionBetween(siblings[insertAt - 1], siblings[insertAt])

    if (targetStatus === dragged.status && Math.abs(position - dragged.position) < 0.001) return

    void moveTask.mutateAsync({ id: dragged.id, status: targetStatus, position }).catch(() => {
      /* the mutation rolls the cache back and toasts on its own */
    })
  }

  if (isLoading) return <BoardSkeleton />

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null)
        setOverStatus(null)
      }}
    >
      <div className="scroll-thin flex gap-4 overflow-x-auto pb-2">
        {TASK_STATUSES.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={columns[status]}
            onAddTask={onAddTask}
            onOpenTask={onOpenTask}
            active={overStatus === status}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
        {activeTask ? (
          <div className="w-[280px] rotate-2 cursor-grabbing">
            <TaskCard task={activeTask} overlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
