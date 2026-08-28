import { useId, useMemo, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock3,
  FileText,
  Hash,
  History,
  Layers,
  Timer,
  UserRound,
  Users,
} from 'lucide-react'
import { Avatar, Badge, Card, CardContent, CardHeader, Progress, Skeleton } from '@/components/ui'
import { useActivity, useTasks } from '@/hooks/queries'
import {
  PROJECT_STATUS_META,
  STATUS_META,
  TASK_STATUSES,
  cn,
  formatDate,
  pluralize,
  timeAgo,
} from '@/lib/utils'
import type { MemberRole, Project, TaskStatus } from '@/types'

export interface ProjectOverviewProps {
  project: Project
}

const ROLE_CHIP: Record<MemberRole, string> = {
  owner: 'bg-brand-500/14 text-brand-600 dark:text-brand-300',
  admin: 'bg-violet-500/14 text-violet-600 dark:text-violet-300',
  member: 'bg-sky-500/12 text-sky-600 dark:text-sky-300',
  viewer: 'bg-slate-500/12 text-slate-500 dark:text-slate-300',
}

const ROLE_ORDER: Record<MemberRole, number> = { owner: 0, admin: 1, member: 2, viewer: 3 }

/* ------------------------------------------------------------------- pieces */

function ProgressRing({ value }: { value: number }) {
  const rawId = useId()
  const gradientId = 'ring-' + rawId.replace(/[^a-zA-Z0-9]/g, '')
  const size = 136
  const stroke = 12
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const safe = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0))

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c4dff" />
            <stop offset="55%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-[var(--app-border)]"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={`url(#${gradientId})`}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (circumference * safe) / 100 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[26px] font-semibold leading-none tracking-tight">{Math.round(safe)}%</span>
        <span className="mt-1 text-[11px] uppercase tracking-wider text-muted">complete</span>
      </div>
    </div>
  )
}

interface StatTileProps {
  icon: ReactNode
  label: string
  value: number
  tone: string
}

function StatTile({ icon, label, value, tone }: StatTileProps) {
  return (
    <div className="surface-2 rounded-xl border border-[var(--app-border)] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted">
        <span className={cn('inline-flex [&_svg]:h-3.5 [&_svg]:w-3.5', tone)}>{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <p className={cn('mt-1 text-xl font-semibold tabular-nums tracking-tight', tone)}>{value}</p>
    </div>
  )
}

function DetailRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--app-border)]/70 py-2.5 last:border-0 last:pb-0">
      <span className="inline-flex items-center gap-2 text-xs text-muted [&_svg]:h-3.5 [&_svg]:w-3.5">
        {icon}
        {label}
      </span>
      <span className="min-w-0 text-right text-sm font-medium">{children}</span>
    </div>
  )
}

/* ----------------------------------------------------------------- overview */

export function ProjectOverview({ project }: ProjectOverviewProps) {
  const { data: tasks, isLoading: tasksLoading } = useTasks({ project_id: project.id })
  const { data: activity, isLoading: activityLoading } = useActivity({ project_id: project.id, limit: 8 })

  const breakdown = useMemo(() => {
    const counts = TASK_STATUSES.reduce(
      (acc, status) => ({ ...acc, [status]: 0 }),
      {} as Record<TaskStatus, number>,
    )
    for (const task of tasks ?? []) counts[task.status] += 1
    return counts
  }, [tasks])

  const totalCounted = tasks?.length ?? 0
  const stats = project.stats
  const members = useMemo(
    () => [...project.members].sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role]),
    [project.members],
  )
  const projectStatus = PROJECT_STATUS_META[project.status] ?? PROJECT_STATUS_META.active

  return (
    <div className="grid animate-fade-up gap-5 lg:grid-cols-3">
      {/* ---------------------------------------------------------- left */}
      <div className="space-y-5 lg:col-span-2">
        <Card>
          <CardHeader
            title="About this project"
            description={project.description ? undefined : 'No description has been added yet.'}
            action={<FileText className="h-4 w-4 text-muted" />}
          />
          <CardContent>
            {project.description ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--app-text)]/90">
                {project.description}
              </p>
            ) : (
              <p className="text-sm text-muted">
                Add a description so everyone knows what {project.name} is about.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Progress"
            description={
              stats.total_tasks > 0
                ? `${stats.done_tasks} of ${pluralize(stats.total_tasks, 'task')} completed`
                : 'No tasks created yet'
            }
          />
          <CardContent>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
              <ProgressRing value={stats.progress} />
              <div className="grid w-full grid-cols-2 gap-2.5">
                <StatTile icon={<Layers />} label="Total" value={stats.total_tasks} tone="text-[var(--app-text)]" />
                <StatTile icon={<CheckCircle2 />} label="Done" value={stats.done_tasks} tone="text-emerald-500" />
                <StatTile
                  icon={<Timer />}
                  label="In progress"
                  value={stats.in_progress_tasks}
                  tone="text-amber-500"
                />
                <StatTile icon={<AlertTriangle />} label="Overdue" value={stats.overdue_tasks} tone="text-rose-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Status breakdown"
            description={tasksLoading ? 'Counting tasks…' : pluralize(totalCounted, 'task') + ' in this project'}
          />
          <CardContent className="space-y-3.5">
            {tasksLoading
              ? TASK_STATUSES.map((status) => (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-3.5 w-10" />
                    </div>
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                ))
              : TASK_STATUSES.map((status) => {
                  const meta = STATUS_META[status]
                  const count = breakdown[status]
                  const percent = totalCounted > 0 ? (count / totalCounted) * 100 : 0
                  return (
                    <div key={status} className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="inline-flex items-center gap-2 font-medium">
                          <span aria-hidden="true" className={cn('h-2 w-2 rounded-full', meta.dot)} />
                          {meta.label}
                        </span>
                        <span className="tabular-nums text-muted">
                          {count}
                          <span className="ml-1.5 text-xs opacity-70">{Math.round(percent)}%</span>
                        </span>
                      </div>
                      <Progress
                        value={percent}
                        label={meta.label}
                        className="h-1.5"
                        barClassName={cn('bg-none', meta.bar)}
                      />
                    </div>
                  )
                })}
          </CardContent>
        </Card>
      </div>

      {/* --------------------------------------------------------- right */}
      <div className="space-y-5">
        <Card>
          <CardHeader title="Details" />
          <CardContent className="pt-0">
            <DetailRow icon={<Hash />} label="Key">
              <Badge className="font-mono tracking-wider">{project.key}</Badge>
            </DetailRow>
            <DetailRow icon={<UserRound />} label="Owner">
              {project.owner ? (
                <span className="inline-flex min-w-0 items-center gap-2">
                  <Avatar user={project.owner} size="xs" showTitle={false} />
                  <span className="truncate">{project.owner.full_name}</span>
                </span>
              ) : (
                <span className="text-muted">—</span>
              )}
            </DetailRow>
            <DetailRow icon={<Clock3 />} label="Status">
              <Badge className={cn('border-transparent', projectStatus.chip)}>{projectStatus.label}</Badge>
            </DetailRow>
            <DetailRow icon={<CalendarRange />} label="Start date">
              {formatDate(project.start_date)}
            </DetailRow>
            <DetailRow icon={<CalendarDays />} label="Due date">
              {formatDate(project.due_date)}
            </DetailRow>
            <DetailRow icon={<History />} label="Created">
              {formatDate(project.created_at)}
            </DetailRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Members"
            description={pluralize(members.length, 'person', 'people') + ' on this project'}
            action={<Users className="h-4 w-4 text-muted" />}
          />
          <CardContent className="space-y-1">
            {members.length === 0 && <p className="py-2 text-sm text-muted">No members yet.</p>}
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 rounded-xl px-1 py-2">
                <Avatar user={member.user} size="sm" showTitle={false} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium tracking-tight">{member.user.full_name}</p>
                  <p className="truncate text-xs text-muted">{member.user.job_title || member.user.email}</p>
                </div>
                <Badge className={cn('shrink-0 border-transparent capitalize', ROLE_CHIP[member.role])}>
                  {member.role}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Recent activity" description="Latest updates in this project" />
          <CardContent>
            {activityLoading ? (
              <div className="space-y-4">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
                    <div className="w-full space-y-1.5">
                      <Skeleton className="h-3.5 w-full" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (activity?.length ?? 0) === 0 ? (
              <p className="py-2 text-sm text-muted">Nothing has happened here yet.</p>
            ) : (
              <ol className="relative">
                {(activity ?? []).map((entry) => (
                  <li
                    key={entry.id}
                    className={cn(
                      'relative pb-4 pl-9 last:pb-0',
                      "after:absolute after:bottom-0 after:left-[11px] after:top-7 after:w-px after:bg-[var(--app-border)] after:content-['']",
                      'last:after:hidden',
                    )}
                  >
                    <Avatar
                      user={entry.actor}
                      size="xs"
                      showTitle={false}
                      className="absolute left-0 top-0 h-6 w-6 text-[9px]"
                    />
                    <p className="text-sm leading-snug">
                      <span className="font-medium">{entry.actor?.full_name ?? 'Someone'}</span>{' '}
                      <span className="text-muted">{entry.summary}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted opacity-80">{timeAgo(entry.created_at)}</p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
