import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  FolderKanban,
  KanbanSquare,
  LayoutList,
  MoreHorizontal,
  PanelsTopLeft,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
} from 'lucide-react'
import {
  AvatarGroup,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dropdown,
  EmptyState,
  Progress,
  Skeleton,
  Tabs,
} from '@/components/ui'
import { BoardView } from '@/features/board/BoardView'
import { ProjectFormModal } from '@/features/projects/ProjectFormModal'
import { ProjectOverview } from '@/features/projects/ProjectOverview'
import { TaskDetailDrawer } from '@/features/tasks/TaskDetailDrawer'
import { TaskFilters, defaultTaskFilters, type TaskFilterState } from '@/features/tasks/TaskFilters'
import { TaskFormModal } from '@/features/tasks/TaskFormModal'
import { TaskListView } from '@/features/tasks/TaskListView'
import { NEW_TASK_EVENT } from '@/components/layout/Topbar'
import { useDeleteProject, useLabels, useProject, useTasks } from '@/hooks/queries'
import { PROJECT_STATUS_META, colorClasses, formatDate, isOverdue, pluralize } from '@/lib/utils'
import type { TaskStatus } from '@/types'

type TabKey = 'board' | 'list' | 'overview'

const TAB_KEYS: TabKey[] = ['board', 'list', 'overview']

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-28 rounded-lg" />
      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2.5">
            <Skeleton className="h-7 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 max-w-full rounded-lg" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </Card>
      <Skeleton className="h-10 w-72 rounded-xl" />
      <div className="scroll-thin flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-80 w-[300px] min-w-[300px] rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>()
  const id = Number(projectId)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const { data: project, isLoading, isError } = useProject(Number.isFinite(id) ? id : undefined)
  const { data: labels } = useLabels(Number.isFinite(id) ? id : undefined)
  const deleteProject = useDeleteProject()

  const [filters, setFilters] = useState<TaskFilterState>(defaultTaskFilters)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus | null>(null)
  const [taskFormOpen, setTaskFormOpen] = useState(false)

  const rawTab = searchParams.get('tab') as TabKey | null
  const tab: TabKey = rawTab && TAB_KEYS.includes(rawTab) ? rawTab : 'board'
  const openTaskId = searchParams.get('task') ? Number(searchParams.get('task')) : null

  const setParam = useCallback(
    (key: string, value: string | null) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (value === null) next.delete(key)
          else next.set(key, value)
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const openTask = useCallback((taskId: number) => setParam('task', String(taskId)), [setParam])
  const closeTask = useCallback(() => setParam('task', null), [setParam])

  const openTaskForm = useCallback((status?: TaskStatus) => {
    setNewTaskStatus(status ?? null)
    setTaskFormOpen(true)
  }, [])

  // The topbar's "New task" button is global, so it reaches this page by event.
  useEffect(() => {
    const handler = () => openTaskForm()
    window.addEventListener(NEW_TASK_EVENT, handler)
    return () => window.removeEventListener(NEW_TASK_EVENT, handler)
  }, [openTaskForm])

  const members = useMemo(() => (project?.members ?? []).map((member) => member.user), [project])

  const listQuery = useTasks({
    project_id: Number.isFinite(id) ? id : undefined,
    q: filters.q || undefined,
    status: filters.status.length ? filters.status : undefined,
    priority: filters.priority.length ? filters.priority : undefined,
    assignee_id: filters.assignee_id,
    label_id: filters.label_id,
    due: filters.due,
    sort: 'due_date',
  })

  if (isLoading) return <DetailSkeleton />

  if (isError || !project) {
    return (
      <Card className="py-4">
        <EmptyState
          icon={FolderKanban}
          title="Project not found"
          description="It may have been deleted, or you no longer have access to it."
          action={
            <Link to="/projects">
              <Button variant="outline" leftIcon={<ArrowLeft />}>
                Back to projects
              </Button>
            </Link>
          }
        />
      </Card>
    )
  }

  const accent = colorClasses(project.color)
  const statusMeta = PROJECT_STATUS_META[project.status] ?? PROJECT_STATUS_META.active
  const { stats } = project
  const dueLate = isOverdue(project.due_date) && project.status !== 'completed'

  async function handleDelete() {
    if (!project) return
    try {
      await deleteProject.mutateAsync(project.id)
      navigate('/projects', { replace: true })
    } catch {
      setDeleteOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-[var(--app-text)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All projects
      </Link>

      <Card className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${accent.bg}`} aria-hidden="true" />
              <span className="font-mono text-xs font-semibold text-muted">{project.key}</span>
              <h1 className="truncate text-2xl font-semibold tracking-tight">{project.name}</h1>
              <Badge className={statusMeta.chip}>{statusMeta.label}</Badge>
            </div>
            {project.description ? (
              <p className="mt-2 max-w-3xl text-sm text-muted">{project.description}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
              {project.due_date && (
                <span className={`inline-flex items-center gap-1.5 ${dueLate ? 'text-rose-500' : ''}`}>
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  Due {formatDate(project.due_date)}
                </span>
              )}
              <span>{pluralize(stats.total_tasks, 'task')}</span>
              <span>{pluralize(stats.member_count, 'member')}</span>
              {stats.overdue_tasks > 0 && (
                <span className="text-rose-500">{pluralize(stats.overdue_tasks, 'task')} overdue</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <AvatarGroup users={members} max={5} size="sm" />
              <Link to="/team">
                <Button variant="ghost" size="sm" leftIcon={<UserPlus />}>
                  Invite
                </Button>
              </Link>
            </div>
            <Button leftIcon={<Plus />} onClick={() => openTaskForm()}>
              New task
            </Button>
            <Dropdown
              align="right"
              trigger={
                <Button variant="secondary" size="icon" aria-label="Project actions">
                  <MoreHorizontal />
                </Button>
              }
              items={[
                { label: 'Edit project', icon: <Pencil />, onSelect: () => setEditOpen(true) },
                {
                  label: 'Delete project',
                  icon: <Trash2 />,
                  danger: true,
                  onSelect: () => setDeleteOpen(true),
                },
              ]}
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
            <span>
              {stats.done_tasks} of {stats.total_tasks} tasks done
            </span>
            <span className="font-semibold tabular-nums text-[var(--app-text)]">{stats.progress}%</span>
          </div>
          <Progress value={stats.progress} barClassName={accent.bg} />
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={(key) => setParam('tab', key)}
          tabs={[
            { key: 'board', label: 'Board', icon: <KanbanSquare /> },
            { key: 'list', label: 'List', icon: <LayoutList />, count: stats.total_tasks },
            { key: 'overview', label: 'Overview', icon: <PanelsTopLeft /> },
          ]}
        />
      </div>

      {tab !== 'overview' && (
        <TaskFilters value={filters} onChange={setFilters} members={members} labels={labels ?? []} />
      )}

      {tab === 'board' && (
        <BoardView projectId={project.id} filters={filters} onOpenTask={openTask} onAddTask={openTaskForm} />
      )}

      {tab === 'list' && (
        <TaskListView
          tasks={listQuery.data ?? []}
          isLoading={listQuery.isLoading}
          onOpenTask={openTask}
        />
      )}

      {tab === 'overview' && <ProjectOverview project={project} />}

      <TaskDetailDrawer taskId={openTaskId} open={openTaskId !== null} onClose={closeTask} />

      <TaskFormModal
        open={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        projectId={project.id}
        defaultStatus={newTaskStatus ?? undefined}
      />

      <ProjectFormModal open={editOpen} onClose={() => setEditOpen(false)} project={project} />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        danger
        title={`Delete ${project.name}?`}
        description="Every task, comment and attachment in this project will be permanently removed. This cannot be undone."
        confirmLabel="Delete project"
        loading={deleteProject.isPending}
      />
    </div>
  )
}
