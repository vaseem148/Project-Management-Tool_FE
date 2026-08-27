import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  FolderPlus,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AvatarGroup,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dropdown,
  EmptyState,
  Progress,
  SearchInput,
  Skeleton,
  Tabs,
  Tooltip,
} from '@/components/ui'
import { ProjectCard, projectIsOverdue } from '@/features/projects/ProjectCard'
import { ProjectFormModal } from '@/features/projects/ProjectFormModal'
import { useDeleteProject, useProjects } from '@/hooks/queries'
import { cn, colorClasses, formatDueDate, pluralize, PROJECT_STATUS_META } from '@/lib/utils'
import type { Project } from '@/types'

type ViewMode = 'grid' | 'list'

const VIEW_KEY = 'pmt.projects.view'
const SEARCH_DEBOUNCE = 250

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'on_hold', label: 'On Hold' },
  { key: 'completed', label: 'Completed' },
  { key: 'archived', label: 'Archived' },
]

function readView(): ViewMode {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

/* ------------------------------------------------------------------ list row */

interface ProjectRowProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

function ProjectRow({ project, onEdit, onDelete }: ProjectRowProps) {
  const tone = colorClasses(project.color)
  const status = PROJECT_STATUS_META[project.status] ?? PROJECT_STATUS_META.active
  const { total_tasks: total, done_tasks: done, progress } = project.stats
  const due = formatDueDate(project.due_date)
  const late = projectIsOverdue(project)

  const swallow = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div className="group surface relative flex items-center gap-4 rounded-xl px-4 py-3 transition hover:border-brand-500/35 hover:bg-black/[0.02] dark:hover:bg-white/[0.025]">
      <span aria-hidden="true" className={cn('h-9 w-1.5 shrink-0 rounded-full', tone.bg)} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider',
              tone.soft,
              tone.text,
            )}
          >
            {project.key}
          </span>
          <h3 className="truncate text-sm font-semibold tracking-tight transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-300">
            {project.name}
          </h3>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">
          {project.description?.trim() || 'No description yet.'}
        </p>
      </div>

      <div className="hidden w-36 shrink-0 md:block">
        <div className="mb-1 flex items-baseline justify-between text-[10px]">
          <span className="text-muted">{total > 0 ? `${done}/${total} tasks` : 'No tasks'}</span>
          <span className="font-semibold tabular-nums">{progress}%</span>
        </div>
        <Progress
          value={progress}
          label={`${project.name} progress`}
          className="h-1.5"
          barClassName={cn('bg-none', tone.bg)}
        />
      </div>

      <Badge className={cn('hidden shrink-0 sm:inline-flex', status.chip)}>{status.label}</Badge>

      {due && (
        <span
          className={cn(
            'hidden shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium lg:inline-flex',
            late
              ? 'bg-rose-500/14 text-rose-600 dark:text-rose-300'
              : 'bg-black/[0.045] text-muted dark:bg-white/[0.06]',
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          {due}
        </span>
      )}

      <AvatarGroup
        users={project.members.map((member) => member.user)}
        max={3}
        size="xs"
        className="hidden shrink-0 lg:flex"
      />

      <div className="relative z-20 shrink-0" onClick={swallow}>
        <Dropdown
          align="right"
          trigger={
            <button
              type="button"
              aria-label={`Actions for ${project.name}`}
              className="grid h-8 w-8 place-items-center rounded-lg text-[var(--app-muted)] transition hover:bg-black/5 hover:text-[var(--app-text)] dark:hover:bg-white/[0.07]"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          }
          items={[
            { label: 'Edit project', icon: <Pencil />, onSelect: () => onEdit(project) },
            { label: 'Delete project', icon: <Trash2 />, danger: true, onSelect: () => onDelete(project) },
          ]}
        />
      </div>

      <Link
        to={`/projects/${project.id}`}
        aria-label={`Open ${project.name}`}
        className="absolute inset-0 z-10 rounded-xl outline-none ring-offset-2 ring-offset-[var(--app-bg)] focus-visible:ring-2 focus-visible:ring-[var(--app-ring)]"
      />
    </div>
  )
}

/* ------------------------------------------------------------------ skeleton */

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <Skeleton className="h-1 w-full rounded-none" />
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="surface flex items-center gap-4 rounded-xl px-4 py-3">
          <Skeleton className="h-9 w-1.5 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="hidden h-1.5 w-36 rounded-full md:block" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}

/* --------------------------------------------------------------------- page */

export default function Projects() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = searchParams.get('q') ?? ''
  const urlStatus = searchParams.get('status') ?? 'all'

  const [search, setSearch] = useState(urlQuery)
  const [view, setView] = useState<ViewMode>(readView)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null)

  const status = STATUS_TABS.some((tab) => tab.key === urlStatus) ? urlStatus : 'all'

  const { data, isLoading } = useProjects({
    q: urlQuery,
    status: status === 'all' ? undefined : status,
  })
  const deleteProject = useDeleteProject()

  const projects = useMemo(() => data ?? [], [data])
  const isFiltered = Boolean(urlQuery.trim()) || status !== 'all'

  const writeParams = useCallback(
    (changes: { q?: string; status?: string }) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          for (const [key, value] of Object.entries(changes)) {
            if (value && !(key === 'status' && value === 'all')) next.set(key, value)
            else next.delete(key)
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  // Debounce the search box into the URL — the URL stays the single source of truth.
  useEffect(() => {
    if (search.trim() === urlQuery) return
    const handle = window.setTimeout(() => writeParams({ q: search.trim() }), SEARCH_DEBOUNCE)
    return () => window.clearTimeout(handle)
  }, [search, urlQuery, writeParams])

  // Follow browser history / external links back into the search box.
  useEffect(() => {
    setSearch((previous) => (previous.trim() === urlQuery ? previous : urlQuery))
  }, [urlQuery])

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view)
    } catch {
      /* private mode — the preference simply won't persist */
    }
  }, [view])

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = useCallback((project: Project) => {
    setEditing(project)
    setFormOpen(true)
  }, [])

  const askDelete = useCallback((project: Project) => setPendingDelete(project), [])

  async function confirmDelete() {
    if (!pendingDelete) return
    const name = pendingDelete.name
    try {
      await deleteProject.mutateAsync(pendingDelete.id)
      toast.success(`“${name}” was deleted`)
      setPendingDelete(null)
    } catch {
      /* useDeleteProject already reports the failure */
    }
  }

  const clearFilters = () => {
    setSearch('')
    writeParams({ q: '', status: 'all' })
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            {!isLoading && (
              <span className="rounded-full bg-brand-500/12 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-brand-600 dark:text-brand-300">
                {projects.length}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            Every workspace you own or collaborate on — {pluralize(projects.length, 'project')} in view.
          </p>
        </div>
        <Button leftIcon={<Plus />} onClick={openCreate}>
          New project
        </Button>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search projects…"
          className="lg:max-w-xs"
        />

        <div className="flex items-center gap-2">
          <Tabs
            tabs={STATUS_TABS}
            value={status}
            onChange={(key) => writeParams({ status: key })}
            className="min-w-0 flex-1 lg:flex-none"
          />

          <div className="surface surface-2 inline-flex shrink-0 items-center gap-1 rounded-xl p-1">
            {(['grid', 'list'] as const).map((mode) => {
              const active = view === mode
              const Icon = mode === 'grid' ? LayoutGrid : List
              return (
                <Tooltip key={mode} label={mode === 'grid' ? 'Grid view' : 'List view'}>
                  <button
                    type="button"
                    onClick={() => setView(mode)}
                    aria-label={`${mode === 'grid' ? 'Grid' : 'List'} view`}
                    aria-pressed={active}
                    className={cn(
                      'grid h-8 w-8 place-items-center rounded-lg transition',
                      'outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-ring)]',
                      active
                        ? 'bg-brand-500/12 text-brand-600 ring-1 ring-inset ring-brand-500/25 dark:text-brand-200'
                        : 'text-muted hover:text-[var(--app-text)]',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                </Tooltip>
              )
            })}
          </div>
        </div>
      </div>

      {isLoading ? (
        view === 'grid' ? (
          <GridSkeleton />
        ) : (
          <ListSkeleton />
        )
      ) : projects.length === 0 ? (
        <Card className="py-4">
          {isFiltered ? (
            <EmptyState
              icon={FolderPlus}
              title="No projects match your filters"
              description={
                urlQuery.trim()
                  ? `Nothing came back for “${urlQuery.trim()}”. Try a different name or clear the filters.`
                  : 'No projects have that status yet. Try another one or clear the filters.'
              }
              action={
                <>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                  <Button leftIcon={<Plus />} onClick={openCreate}>
                    New project
                  </Button>
                </>
              }
            />
          ) : (
            <EmptyState
              icon={FolderPlus}
              title="Create your first project"
              description="Projects hold your board, backlog and team. Spin one up and start shipping."
              action={
                <Button leftIcon={<Plus />} onClick={openCreate}>
                  New project
                </Button>
              }
            />
          )}
        </Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: Math.min(index, 11) * 0.03,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <ProjectCard project={project} onEdit={openEdit} onDelete={askDelete} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.28,
                delay: Math.min(index, 11) * 0.03,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <ProjectRow project={project} onEdit={openEdit} onDelete={askDelete} />
            </motion.div>
          ))}
        </div>
      )}

      <ProjectFormModal open={formOpen} onClose={() => setFormOpen(false)} project={editing} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={deleteProject.isPending}
        danger
        title="Delete project"
        description={`“${pendingDelete?.name ?? ''}” and all of its tasks, labels and comments will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete project"
      />
    </div>
  )
}
