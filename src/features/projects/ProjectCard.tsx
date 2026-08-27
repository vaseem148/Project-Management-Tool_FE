import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, MoreHorizontal, Pencil, Trash2, Users } from 'lucide-react'
import { AvatarGroup, Badge, Card, Dropdown, Progress } from '@/components/ui'
import {
  cn,
  colorClasses,
  formatDueDate,
  isOverdue,
  PROJECT_STATUS_META,
} from '@/lib/utils'
import type { Project } from '@/types'

export interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

/** A project's due date only counts as late while the project is still running. */
export function projectIsOverdue(project: Project) {
  if (project.status === 'completed' || project.status === 'archived') return false
  return isOverdue(project.due_date)
}

function swallow(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const tone = colorClasses(project.color)
  const status = PROJECT_STATUS_META[project.status] ?? PROJECT_STATUS_META.active
  const { total_tasks: total, done_tasks: done, progress } = project.stats
  const due = formatDueDate(project.due_date)
  const late = projectIsOverdue(project)
  const members = project.members.map((member) => member.user)

  return (
    <Card hover className="group relative flex h-full flex-col overflow-hidden">
      <span aria-hidden="true" className={cn('h-1 w-full shrink-0', tone.bg)} />

      <div className="flex min-h-0 flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider',
              tone.soft,
              tone.text,
            )}
          >
            {project.key}
          </span>
          <Badge className={status.chip}>{status.label}</Badge>

          <div className="relative z-20 ml-auto -mr-1.5" onClick={swallow}>
            <Dropdown
              align="right"
              trigger={
                <button
                  type="button"
                  aria-label={`Actions for ${project.name}`}
                  className="grid h-8 w-8 place-items-center rounded-lg text-[var(--app-muted)] opacity-0 transition hover:bg-black/5 hover:text-[var(--app-text)] focus-visible:opacity-100 group-hover:opacity-100 dark:hover:bg-white/[0.07]"
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
        </div>

        <h3 className="mt-3 line-clamp-1 text-[15px] font-semibold tracking-tight transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-300">
          {project.name}
        </h3>
        <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-muted">
          {project.description?.trim() || 'No description yet.'}
        </p>

        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[11px]">
            <span className="text-muted">
              {total > 0 ? `${done} of ${total} tasks` : 'No tasks yet'}
            </span>
            <span className="font-semibold tabular-nums">{progress}%</span>
          </div>
          <Progress
            value={progress}
            label={`${project.name} progress`}
            className="h-1.5"
            barClassName={cn('bg-none', tone.bg)}
          />
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          {members.length > 0 ? (
            <AvatarGroup users={members} max={4} size="xs" />
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              No members
            </span>
          )}

          {due && (
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium',
                late
                  ? 'bg-rose-500/14 text-rose-600 dark:text-rose-300'
                  : 'bg-black/[0.045] text-muted dark:bg-white/[0.06]',
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              {late ? `Overdue · ${due}` : due}
            </span>
          )}
        </div>
      </div>

      <Link
        to={`/projects/${project.id}`}
        aria-label={`Open ${project.name}`}
        className="absolute inset-0 z-10 rounded-2xl outline-none ring-offset-2 ring-offset-[var(--app-bg)] focus-visible:ring-2 focus-visible:ring-[var(--app-ring)]"
      />
    </Card>
  )
}
