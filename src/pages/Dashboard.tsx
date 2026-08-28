import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { AlertTriangle, CheckCircle2, FolderKanban, LayoutDashboard, ListChecks, Plus } from 'lucide-react'
import { Button, Card, EmptyState, Skeleton } from '@/components/ui'
import { ActivityFeed } from '@/features/dashboard/ActivityFeed'
import { PriorityBars } from '@/features/dashboard/PriorityBars'
import { StatCard, type StatDelta } from '@/features/dashboard/StatCard'
import { StatusDonut } from '@/features/dashboard/StatusDonut'
import { TrendChart } from '@/features/dashboard/TrendChart'
import { UpcomingPanel } from '@/features/dashboard/UpcomingPanel'
import { WorkloadPanel } from '@/features/dashboard/WorkloadPanel'
import { ProjectFormModal } from '@/features/projects/ProjectFormModal'
import { useDashboard } from '@/hooks/queries'
import { useAuth } from '@/store/auth'
import { pluralize } from '@/lib/utils'
import type { TrendPoint } from '@/types'

function greeting(date: Date): string {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function firstName(fullName?: string | null): string {
  if (!fullName) return 'there'
  return fullName.trim().split(/\s+/)[0] ?? fullName
}

/** Second week against the first, so the pill reflects real movement. */
function weeklyDelta(trend: TrendPoint[], key: 'created' | 'completed', positive: boolean): StatDelta | null {
  if (trend.length < 14) return null
  const previous = trend.slice(0, 7).reduce((sum, point) => sum + point[key], 0)
  const recent = trend.slice(7).reduce((sum, point) => sum + point[key], 0)
  if (previous === 0) return recent === 0 ? null : { value: 100, positive, caption: 'vs last week' }
  const change = Math.round(((recent - previous) / previous) * 100)
  if (change === 0) return null
  return { value: change, positive: change > 0 ? positive : !positive, caption: 'vs last week' }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-4 w-40 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-72 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { data, isLoading } = useDashboard()
  const [createOpen, setCreateOpen] = useState(false)
  const today = useMemo(() => new Date(), [])

  if (isLoading && !data) return <DashboardSkeleton />

  if (!data || data.total_projects === 0) {
    return (
      <>
        <Card className="py-4">
          <EmptyState
            icon={LayoutDashboard}
            title="Your workspace is empty"
            description="Create your first project to start tracking tasks, deadlines and team workload."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button leftIcon={<Plus />} onClick={() => setCreateOpen(true)}>
                  New project
                </Button>
                <Link to="/projects">
                  <Button variant="outline">Browse projects</Button>
                </Link>
              </div>
            }
          />
        </Card>
        <ProjectFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      </>
    )
  }

  const openTasks = data.total_tasks - data.completed_tasks

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting(today)}, {firstName(user?.full_name)} <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            {format(today, 'EEEE, MMMM d')} · {pluralize(data.my_open_tasks, 'task')} assigned to you ·{' '}
            {pluralize(data.due_soon_tasks, 'deadline')} this week
          </p>
        </div>
        <Button leftIcon={<Plus />} onClick={() => setCreateOpen(true)}>
          New project
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Active projects"
          value={data.active_projects}
          icon={FolderKanban}
          tone="violet"
          hint={`${data.total_projects} total`}
          to="/projects"
        />
        <StatCard
          index={1}
          label="Tasks in flight"
          value={openTasks}
          icon={ListChecks}
          tone="cyan"
          hint={`${data.total_tasks} tracked overall`}
          delta={weeklyDelta(data.trend, 'created', true)}
          to="/tasks"
        />
        <StatCard
          index={2}
          label="Completed"
          value={data.completed_tasks}
          icon={CheckCircle2}
          tone="emerald"
          hint={`${data.completion_rate}% completion rate`}
          delta={weeklyDelta(data.trend, 'completed', true)}
        />
        <StatCard
          index={3}
          label="Overdue"
          value={data.overdue_tasks}
          icon={AlertTriangle}
          tone="rose"
          hint={data.overdue_tasks === 0 ? 'Nothing past due' : 'Needs attention today'}
          to="/tasks"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <TrendChart data={data.trend} className="lg:col-span-2" />
        <StatusDonut data={data.tasks_by_status} completionRate={data.completion_rate} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <UpcomingPanel tasks={data.upcoming} />
        <WorkloadPanel entries={data.workload} />
        <PriorityBars data={data.tasks_by_priority} />
      </section>

      <ActivityFeed items={data.recent_activity} />

      <ProjectFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
