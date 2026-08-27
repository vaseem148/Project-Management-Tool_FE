import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  ChevronsUpDown,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Settings as SettingsIcon,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Avatar, Dropdown, Skeleton } from '@/components/ui'
import { useProjects } from '@/hooks/queries'
import { useAuth } from '@/store/auth'
import { cn, colorClasses } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'My Tasks', icon: ListChecks },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

const MAX_PINNED_PROJECTS = 5

export interface SidebarProps {
  className?: string
  /** Called after any navigation — used to dismiss the mobile slide-over. */
  onNavigate?: () => void
  /** When provided, renders a close button (mobile slide-over only). */
  onClose?: () => void
}

export function Sidebar({ className, onNavigate, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { data: projects, isLoading } = useProjects()

  const pinned = (projects ?? []).slice(0, MAX_PINNED_PROJECTS)

  return (
    <aside
      className={cn('glass flex h-full w-full flex-col rounded-none border-y-0 border-l-0', className)}
      aria-label="Primary"
    >
      {/* ------------------------------------------------------------ brand */}
      <div className="flex h-16 shrink-0 items-center gap-2 px-4">
        <Link
          to="/"
          onClick={onNavigate}
          className="group flex min-w-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-ring)]"
          aria-label="Nexus PM home"
        >
          <span className="brand-gradient grid h-9 w-9 shrink-0 place-items-center rounded-xl shadow-[var(--shadow-glow)] transition group-hover:brightness-110">
            <span className="text-[15px] font-extrabold leading-none tracking-tight text-white">N</span>
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[15px] font-semibold leading-tight tracking-tight">Nexus PM</span>
            <span className="mt-0.5 text-[10px] font-medium uppercase leading-none tracking-[0.18em] text-muted">
              Workspace
            </span>
          </span>
        </Link>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[var(--app-muted)] transition hover:bg-black/5 hover:text-[var(--app-text)] dark:hover:bg-white/[0.07]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* -------------------------------------------------------------- nav */}
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <nav className="flex flex-col gap-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium tracking-tight transition',
                    'outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-ring)]',
                    isActive
                      ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/12 dark:text-brand-300'
                      : 'text-muted hover:bg-black/[0.04] hover:text-[var(--app-text)] dark:hover:bg-white/[0.05]',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      aria-hidden="true"
                      className={cn(
                        'brand-gradient absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full transition-opacity duration-200',
                        isActive ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <Icon
                      className="h-[18px] w-[18px] shrink-0"
                      strokeWidth={isActive ? 2.2 : 1.8}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* --------------------------------------------------- your projects */}
        <div className="mt-7">
          <div className="flex items-center justify-between px-3 pb-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Your projects</h2>
            <Link
              to="/projects"
              onClick={onNavigate}
              className="rounded-md px-1 text-[11px] font-medium text-muted transition hover:text-brand-500 focus-visible:ring-2 focus-visible:ring-[var(--app-ring)]"
            >
              All
            </Link>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-1.5 px-3 py-1">
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} className="h-7 w-full" />
              ))}
            </div>
          ) : pinned.length === 0 ? (
            <p className="px-3 py-2 text-xs leading-relaxed text-muted">
              No projects yet.{' '}
              <Link to="/projects" onClick={onNavigate} className="font-medium text-brand-500 hover:underline">
                Create one
              </Link>
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {pinned.map((project) => (
                <li key={project.id}>
                  <NavLink
                    to={`/projects/${project.id}`}
                    onClick={onNavigate}
                    title={project.name}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition',
                        'outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-ring)]',
                        isActive
                          ? 'bg-brand-500/10 font-medium text-brand-600 dark:text-brand-300'
                          : 'text-muted hover:bg-black/[0.04] hover:text-[var(--app-text)] dark:hover:bg-white/[0.05]',
                      )
                    }
                  >
                    <span
                      aria-hidden="true"
                      className={cn('h-2 w-2 shrink-0 rounded-full', colorClasses(project.color).bg)}
                    />
                    <span className="truncate">{project.name}</span>
                    <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted">
                      {project.stats.total_tasks}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------------- footer */}
      <div className="shrink-0 border-t border-[var(--app-border)] p-3">
        <Dropdown
          align="left"
          className="w-full [&>span]:w-full [&>div]:bottom-full [&>div]:top-auto [&>div]:mb-2 [&>div]:mt-0 [&>div]:w-full"
          trigger={
            <button
              type="button"
              aria-label="Account menu"
              className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-[var(--app-ring)] dark:hover:bg-white/[0.05]"
            >
              <Avatar user={user} size="sm" showTitle={false} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium leading-tight tracking-tight">
                  {user?.full_name ?? 'Signed in'}
                </span>
                <span className="truncate text-[11px] leading-tight text-muted">
                  {user?.job_title || user?.email || 'Member'}
                </span>
              </span>
              <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-[var(--app-muted)]" aria-hidden="true" />
            </button>
          }
          items={[
            {
              label: 'Profile settings',
              icon: <UserRound />,
              onSelect: () => {
                onNavigate?.()
                navigate('/settings')
              },
            },
            {
              label: 'Log out',
              icon: <LogOut />,
              danger: true,
              onSelect: () => {
                onNavigate?.()
                logout()
              },
            },
          ]}
        />
      </div>
    </aside>
  )
}
