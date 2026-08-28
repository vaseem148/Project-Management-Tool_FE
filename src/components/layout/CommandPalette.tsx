import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CornerDownLeft,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Search,
  SearchX,
  Settings as SettingsIcon,
  SquareCheckBig,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Skeleton, Spinner, useDialogBehavior } from '@/components/ui'
import { useProjects, useTasks } from '@/hooks/queries'
import { cn, colorClasses, STATUS_META } from '@/lib/utils'
import type { Project, Task } from '@/types'

const DEBOUNCE_MS = 200
const MAX_PROJECTS = 5
const MAX_TASKS = 6

interface NavAction {
  label: string
  hint: string
  icon: LucideIcon
  to: string
}

const NAV_ACTIONS: NavAction[] = [
  { label: 'Dashboard', hint: 'Overview, trends and activity', icon: LayoutDashboard, to: '/' },
  { label: 'Projects', hint: 'Browse every project', icon: FolderKanban, to: '/projects' },
  { label: 'My Tasks', hint: 'Everything assigned to you', icon: ListChecks, to: '/tasks' },
  { label: 'Team', hint: 'People in your workspace', icon: Users, to: '/team' },
  { label: 'Settings', hint: 'Profile and preferences', icon: SettingsIcon, to: '/settings' },
]

type PaletteEntry =
  | { kind: 'nav'; key: string; index: number; action: NavAction }
  | { kind: 'project'; key: string; index: number; project: Project }
  | { kind: 'task'; key: string; index: number; task: Task }

interface PaletteGroup {
  key: string
  label: string
  entries: PaletteEntry[]
}

export interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Workspace-wide search. Owns the ⌘K / Ctrl+K shortcut; the dialog body only
 * mounts while open so its queries stay idle the rest of the time.
 */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const close = useCallback(() => onOpenChange(false), [onOpenChange])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onOpenChange])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>{open && <PaletteDialog key="command-palette" onClose={close} />}</AnimatePresence>,
    document.body,
  )
}

function PaletteDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])

  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [active, setActive] = useState(0)

  useDialogBehavior(true, panelRef, onClose)

  useEffect(() => {
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [query])

  const { data: projects, isFetching: projectsFetching } = useProjects(debounced ? { q: debounced } : undefined)
  const { data: tasks, isFetching: tasksFetching } = useTasks({ q: debounced || undefined, sort: 'created_at' })

  const { groups, flat } = useMemo(() => {
    const needle = debounced.toLowerCase()
    let index = 0

    const navEntries: PaletteEntry[] = NAV_ACTIONS.filter(
      (action) =>
        !needle ||
        action.label.toLowerCase().includes(needle) ||
        action.hint.toLowerCase().includes(needle),
    ).map((action) => ({ kind: 'nav', key: `nav-${action.to}`, index: index++, action }))

    const projectEntries: PaletteEntry[] = (projects ?? [])
      .slice(0, MAX_PROJECTS)
      .map((project) => ({ kind: 'project', key: `project-${project.id}`, index: index++, project }))

    const taskEntries: PaletteEntry[] = (tasks ?? [])
      .slice(0, MAX_TASKS)
      .map((task) => ({ kind: 'task', key: `task-${task.id}`, index: index++, task }))

    const nextGroups: PaletteGroup[] = []
    if (navEntries.length) nextGroups.push({ key: 'nav', label: 'Jump to', entries: navEntries })
    if (projectEntries.length) nextGroups.push({ key: 'projects', label: 'Projects', entries: projectEntries })
    if (taskEntries.length) {
      nextGroups.push({ key: 'tasks', label: debounced ? 'Tasks' : 'Recent tasks', entries: taskEntries })
    }

    return { groups: nextGroups, flat: [...navEntries, ...projectEntries, ...taskEntries] }
  }, [debounced, projects, tasks])

  const activeIndex = flat.length ? Math.min(active, flat.length - 1) : 0

  useEffect(() => {
    setActive(0)
  }, [debounced])

  useEffect(() => {
    itemRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, flat.length])

  const select = useCallback(
    (entry: PaletteEntry | undefined) => {
      if (!entry) return
      if (entry.kind === 'nav') navigate(entry.action.to)
      else if (entry.kind === 'project') navigate(`/projects/${entry.project.id}`)
      else navigate(`/projects/${entry.task.project_id}?task=${entry.task.id}`)
      onClose()
    },
    [navigate, onClose],
  )

  const onInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((current) => (flat.length ? (Math.min(current, flat.length - 1) + 1) % flat.length : 0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current) =>
        flat.length ? (Math.min(current, flat.length - 1) - 1 + flat.length) % flat.length : 0,
      )
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActive(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setActive(Math.max(flat.length - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      select(flat[activeIndex])
    }
  }

  const loading = projectsFetching || tasksFetching
  const showSkeleton = loading && flat.length === 0
  const showEmpty = !loading && flat.length === 0

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center px-4 pb-6 pt-[10vh] sm:pt-[12vh]">
      <motion.div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search projects and tasks"
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 6 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28, mass: 0.7 }}
        className="surface relative flex max-h-[70vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl outline-none shadow-[0_40px_100px_-30px_rgba(8,10,18,0.7)]"
      >
        {/* ------------------------------------------------------- input */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--app-border)] px-4">
          <Search className="h-[18px] w-[18px] shrink-0 text-[var(--app-muted)]" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-listbox"
            aria-autocomplete="list"
            aria-activedescendant={flat.length ? `palette-option-${activeIndex}` : undefined}
            aria-label="Search projects and tasks"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search projects and tasks…"
            autoComplete="off"
            spellCheck={false}
            className="h-full w-full bg-transparent text-[15px] text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted)]"
          />
          {loading && <Spinner className="h-4 w-4 shrink-0 text-[var(--app-muted)]" label="Searching" />}
          <kbd className="hidden shrink-0 rounded-md border border-[var(--app-border)] bg-[var(--app-panel-2)] px-1.5 py-0.5 font-sans text-[10px] font-semibold tracking-wide text-muted sm:block">
            Esc
          </kbd>
        </div>

        {/* ----------------------------------------------------- results */}
        <div
          id="palette-listbox"
          role="listbox"
          aria-label="Search results"
          className="scroll-thin min-h-0 flex-1 overflow-y-auto p-2"
        >
          {showSkeleton && (
            <div className="flex flex-col gap-2 p-1">
              {[0, 1, 2, 3].map((row) => (
                <Skeleton key={row} className="h-11 w-full" />
              ))}
            </div>
          )}

          {showEmpty && (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brand-500/20 via-indigo-500/12 to-cyan-400/15 ring-1 ring-inset ring-brand-500/20">
                <SearchX className="h-5 w-5 text-brand-500" strokeWidth={1.75} />
              </span>
              <p className="text-sm font-semibold tracking-tight">No matches</p>
              <p className="mt-1 max-w-xs text-xs text-muted">
                Nothing found for “{debounced || query}”. Try a project name, a task title or a keyword.
              </p>
            </div>
          )}

          {groups.map((group) => (
            <div key={group.key} className="mb-1 last:mb-0">
              <div className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                {group.label}
              </div>
              <div className="flex flex-col">
                {group.entries.map((entry) => {
                  const isActive = entry.index === activeIndex
                  return (
                    <button
                      key={entry.key}
                      id={`palette-option-${entry.index}`}
                      ref={(node) => {
                        itemRefs.current[entry.index] = node
                      }}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      tabIndex={-1}
                      onMouseMove={() => setActive(entry.index)}
                      onClick={() => select(entry)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left outline-none transition',
                        isActive ? 'bg-brand-500/12' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05]',
                      )}
                    >
                      <EntryIcon entry={entry} active={isActive} />

                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            'block truncate text-sm font-medium tracking-tight',
                            isActive ? 'text-brand-600 dark:text-brand-200' : 'text-[var(--app-text)]',
                          )}
                        >
                          {entry.kind === 'nav'
                            ? entry.action.label
                            : entry.kind === 'project'
                              ? entry.project.name
                              : entry.task.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-muted">
                          {entry.kind === 'nav' ? entry.action.hint : null}
                          {entry.kind === 'project'
                            ? `${entry.project.key} · ${entry.project.stats.total_tasks} tasks · ${entry.project.stats.progress}% done`
                            : null}
                          {entry.kind === 'task'
                            ? `${entry.task.project?.name ?? 'Task'} · ${STATUS_META[entry.task.status].label}`
                            : null}
                        </span>
                      </span>

                      <CornerDownLeft
                        aria-hidden="true"
                        className={cn(
                          'h-3.5 w-3.5 shrink-0 text-[var(--app-muted)] transition-opacity',
                          isActive ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ------------------------------------------------------ hints */}
        <div className="flex shrink-0 items-center gap-4 border-t border-[var(--app-border)] bg-[var(--app-panel-2)] px-4 py-2.5 text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <Key>↑</Key>
            <Key>↓</Key>
            navigate
          </span>
          <span className="flex items-center gap-1.5">
            <Key>↵</Key>
            open
          </span>
          <span className="ml-auto hidden sm:inline">
            {flat.length} {flat.length === 1 ? 'result' : 'results'}
          </span>
        </div>
      </motion.div>
    </div>
  )
}

function Key({ children }: { children: string }) {
  return (
    <kbd className="grid h-[18px] min-w-[18px] place-items-center rounded border border-[var(--app-border)] bg-[var(--app-panel)] px-1 font-sans text-[10px] font-semibold leading-none text-muted">
      {children}
    </kbd>
  )
}

function EntryIcon({ entry, active }: { entry: PaletteEntry; active: boolean }) {
  if (entry.kind === 'nav') {
    const Icon = entry.action.icon
    return (
      <span
        className={cn(
          'grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--app-border)] bg-[var(--app-panel-2)] transition',
          active && 'border-brand-500/30 text-brand-500',
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
    )
  }

  if (entry.kind === 'project') {
    const tone = colorClasses(entry.project.color)
    return (
      <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', tone.soft)}>
        <span className={cn('h-2.5 w-2.5 rounded-full', tone.bg)} aria-hidden="true" />
      </span>
    )
  }

  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--app-border)] bg-[var(--app-panel-2)]">
      <span className="relative grid place-items-center">
        <SquareCheckBig className="h-4 w-4 text-[var(--app-muted)]" aria-hidden="true" />
        <span
          aria-hidden="true"
          className={cn(
            'absolute -right-2 -top-1.5 h-1.5 w-1.5 rounded-full',
            STATUS_META[entry.task.status].dot,
          )}
        />
      </span>
    </span>
  )
}
