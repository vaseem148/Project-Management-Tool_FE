import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, CircleUser, FolderKanban, Mail, SearchX, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Modal,
  SearchInput,
  Select,
  Skeleton,
} from '@/components/ui'
import { useAddMember, useProjects, useTasks, useUsers } from '@/hooks/queries'
import { STATUS_META, cn, colorClasses, formatDate, pluralize, timeAgo, toDate } from '@/lib/utils'
import type { MemberRole, Project, Task, User } from '@/types'

interface PersonStats {
  open: number
  done: number
  recent: Task[]
}

const EMPTY_STATS: PersonStats = { open: 0, done: 0, recent: [] }

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member — can create and edit tasks' },
  { value: 'admin', label: 'Admin — can manage members' },
  { value: 'viewer', label: 'Viewer — read only' },
]

function memberIds(project: Project): Set<number> {
  const ids = new Set<number>()
  if (project.owner) ids.add(project.owner.id)
  for (const member of project.members) ids.add(member.user.id)
  return ids
}

/* ---------------------------------------------------------------- sub views */

function ProjectChips({ projects, max = 3 }: { projects: Project[]; max?: number }) {
  if (projects.length === 0) {
    return <span className="text-xs text-muted">Not on a shared project yet</span>
  }
  const shown = projects.slice(0, max)
  const overflow = projects.length - shown.length
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((project) => {
        const tone = colorClasses(project.color)
        return (
          <span
            key={project.id}
            title={project.name}
            className={cn(
              'inline-flex max-w-[9.5rem] items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-5',
              tone.soft,
              tone.text,
            )}
          >
            <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', tone.bg)} aria-hidden="true" />
            <span className="truncate">{project.name}</span>
          </span>
        )
      })}
      {overflow > 0 && (
        <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[11px] font-medium leading-5 text-muted dark:bg-white/[0.08]">
          +{overflow}
        </span>
      )}
    </div>
  )
}

function StatTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="surface surface-2 rounded-xl px-3 py-2">
      <p className={cn('text-base font-semibold leading-none tracking-tight tabular-nums', tone)}>{value}</p>
      <p className="mt-1 text-[11px] text-muted">{label}</p>
    </div>
  )
}

function MemberCard({
  person,
  projects,
  stats,
  index,
  onOpen,
}: {
  person: User
  projects: Project[]
  stats: PersonStats
  index: number
  onOpen: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index, 10) * 0.03, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card
        hover
        role="button"
        tabIndex={0}
        aria-label={`Open ${person.full_name}`}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onOpen()
          }
        }}
        className="h-full cursor-pointer p-5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-ring)]"
      >
        <div className="flex items-start gap-3.5">
          <Avatar user={person} size="lg" showTitle={false} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-semibold tracking-tight">{person.full_name}</h3>
            <p className="truncate text-xs text-muted">{person.job_title || 'Team member'}</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
              <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{person.email}</span>
            </p>
          </div>
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
          <FolderKanban className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Member of {pluralize(projects.length, 'project')}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <StatTile label="Open tasks" value={stats.open} tone="text-brand-500" />
          <StatTile label="Completed" value={stats.done} tone="text-emerald-500" />
        </div>

        <div className="mt-4">
          <ProjectChips projects={projects} />
        </div>
      </Card>
    </motion.div>
  )
}

function PersonModal({
  person,
  projects,
  stats,
  onClose,
}: {
  person: User | null
  projects: Project[]
  stats: PersonStats
  onClose: () => void
}) {
  return (
    <Modal
      open={Boolean(person)}
      onClose={onClose}
      title={person?.full_name ?? 'Teammate'}
      description={person?.job_title || 'Team member'}
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      {person && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar user={person} size="lg" className="h-14 w-14 text-base" showTitle={false} />
            <div className="min-w-0 space-y-1">
              <p className="flex items-center gap-1.5 text-sm text-muted">
                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{person.email}</span>
              </p>
              <p className="flex items-center gap-1.5 text-sm text-muted">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Joined {formatDate(person.created_at)}
              </p>
            </div>
          </div>

          {person.bio && <p className="text-sm leading-relaxed text-muted">{person.bio}</p>}

          <div className="grid grid-cols-3 gap-2">
            <StatTile label="Open tasks" value={stats.open} tone="text-brand-500" />
            <StatTile label="Completed" value={stats.done} tone="text-emerald-500" />
            <StatTile label="Projects" value={projects.length} tone="text-cyan-500" />
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Shared projects</h4>
            <ProjectChips projects={projects} max={8} />
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Recent tasks</h4>
            {stats.recent.length === 0 ? (
              <p className="surface surface-2 rounded-xl px-4 py-6 text-center text-sm text-muted">
                Nothing assigned to {person.full_name.split(' ')[0]} yet.
              </p>
            ) : (
              <ul className="surface divide-y divide-[var(--app-border)] overflow-hidden rounded-xl">
                {stats.recent.map((task) => (
                  <li key={task.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span
                      className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_META[task.status].dot)}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'truncate text-sm font-medium tracking-tight',
                          task.status === 'done' && 'text-muted line-through',
                        )}
                      >
                        {task.title}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {task.project?.name ?? 'Project'} · {STATUS_META[task.status].label}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted">{timeAgo(task.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

function InviteModal({
  open,
  onClose,
  projects,
  users,
}: {
  open: boolean
  onClose: () => void
  projects: Project[]
  users: User[]
}) {
  const [projectId, setProjectId] = useState('')
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState<MemberRole>('member')

  const selected = projects.find((project) => String(project.id) === projectId)
  const addMember = useAddMember(selected?.id)

  const existing = selected ? memberIds(selected) : new Set<number>()
  const candidates = users.filter((person) => !existing.has(person.id))

  const close = () => {
    setProjectId('')
    setUserId('')
    setRole('member')
    onClose()
  }

  const submit = async () => {
    if (!selected || !userId) return
    const person = users.find((candidate) => String(candidate.id) === userId)
    try {
      await addMember.mutateAsync({ user_id: Number(userId), role })
      toast.success(`${person?.full_name ?? 'Teammate'} added to ${selected.name}`)
      close()
    } catch {
      /* the mutation hook surfaces the error toast */
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Invite to project"
      description="Give a teammate access to one of your projects."
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={addMember.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => void submit()}
            loading={addMember.isPending}
            disabled={!selected || !userId}
            leftIcon={<UserPlus />}
          >
            Add to project
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          label="Project"
          value={projectId}
          onChange={(event) => {
            setProjectId(event.target.value)
            setUserId('')
          }}
          options={[
            { value: '', label: 'Choose a project…' },
            ...projects.map((project) => ({ value: String(project.id), label: `${project.key} · ${project.name}` })),
          ]}
        />
        <Select
          label="Teammate"
          value={userId}
          disabled={!selected}
          onChange={(event) => setUserId(event.target.value)}
          hint={
            selected && candidates.length === 0
              ? 'Everyone on your team is already a member of this project.'
              : undefined
          }
          options={[
            { value: '', label: selected ? 'Choose a teammate…' : 'Pick a project first' },
            ...candidates.map((person) => ({
              value: String(person.id),
              label: person.job_title ? `${person.full_name} — ${person.job_title}` : person.full_name,
            })),
          ]}
        />
        <Select
          label="Role"
          value={role}
          onChange={(event) => setRole(event.target.value as MemberRole)}
          options={ROLE_OPTIONS}
        />
      </div>
    </Modal>
  )
}

function TeamSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="p-5">
          <div className="flex items-start gap-3.5">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <Skeleton className="mt-4 h-3 w-28" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
          <Skeleton className="mt-4 h-5 w-44 rounded-full" />
        </Card>
      ))}
    </div>
  )
}

/* --------------------------------------------------------------------- page */

export default function Team() {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  const usersQuery = useUsers()
  const projectsQuery = useProjects()
  // One request for every visible task; the per-person stats are counted client side.
  const tasksQuery = useTasks({})

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data])
  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data])
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data])

  const projectsByUser = useMemo(() => {
    const map = new Map<number, Project[]>()
    for (const project of projects) {
      for (const id of memberIds(project)) {
        const list = map.get(id)
        if (list) list.push(project)
        else map.set(id, [project])
      }
    }
    return map
  }, [projects])

  const statsByUser = useMemo(() => {
    const map = new Map<number, PersonStats>()
    const ordered = [...tasks].sort(
      (a, b) => (toDate(b.created_at)?.getTime() ?? 0) - (toDate(a.created_at)?.getTime() ?? 0),
    )
    for (const task of ordered) {
      const id = task.assignee?.id
      if (!id) continue
      let entry = map.get(id)
      if (!entry) {
        entry = { open: 0, done: 0, recent: [] }
        map.set(id, entry)
      }
      if (task.status === 'done') entry.done += 1
      else entry.open += 1
      if (entry.recent.length < 5) entry.recent.push(task)
    }
    return map
  }, [tasks])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const list = needle
      ? users.filter((person) =>
          [person.full_name, person.email, person.job_title ?? ''].some((field) =>
            field.toLowerCase().includes(needle),
          ),
        )
      : users
    return [...list].sort((a, b) => a.full_name.localeCompare(b.full_name))
  }, [users, search])

  const selected = selectedId === null ? null : (users.find((person) => person.id === selectedId) ?? null)
  const isLoading = usersQuery.isPending || projectsQuery.isPending

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Team</h1>
          <p className="mt-1 text-sm text-muted">
            {usersQuery.isPending
              ? 'Loading your teammates…'
              : `${pluralize(users.length, 'person', 'people')} working across ${pluralize(projects.length, 'project')}`}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search people…"
            className="w-full sm:w-64"
          />
          <Button onClick={() => setInviteOpen(true)} leftIcon={<UserPlus />} className="shrink-0">
            Invite to project
          </Button>
        </div>
      </header>

      <div className="mt-6">
        {isLoading ? (
          <TeamSkeleton />
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={search ? SearchX : Users}
              title={search ? 'No one matches that search' : 'No teammates yet'}
              description={
                search
                  ? 'Try another name, email address or job title.'
                  : 'Invite a colleague to one of your projects and they will appear here.'
              }
              action={
                search ? (
                  <Button variant="secondary" onClick={() => setSearch('')}>
                    Clear search
                  </Button>
                ) : (
                  <Button onClick={() => setInviteOpen(true)} leftIcon={<UserPlus />}>
                    Invite to project
                  </Button>
                )
              }
            />
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((person, index) => (
              <MemberCard
                key={person.id}
                person={person}
                index={index}
                projects={projectsByUser.get(person.id) ?? []}
                stats={statsByUser.get(person.id) ?? EMPTY_STATS}
                onOpen={() => setSelectedId(person.id)}
              />
            ))}
          </div>
        )}
      </div>

      {!isLoading && filtered.length > 0 && (
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted">
          <CircleUser className="h-3.5 w-3.5" aria-hidden="true" />
          Showing {pluralize(filtered.length, 'teammate')}
        </p>
      )}

      <PersonModal
        person={selected}
        projects={selected ? (projectsByUser.get(selected.id) ?? []) : []}
        stats={selected ? (statsByUser.get(selected.id) ?? EMPTY_STATS) : EMPTY_STATS}
        onClose={() => setSelectedId(null)}
      />

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} projects={projects} users={users} />
    </div>
  )
}
