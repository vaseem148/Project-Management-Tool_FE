import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, LogOut, Menu, Moon, Plus, Search, Sun, UserRound } from 'lucide-react'
import { Avatar, Button, Dropdown, Skeleton, Tooltip } from '@/components/ui'
import { useActivity } from '@/hooks/queries'
import { useAuth } from '@/store/auth'
import { useTheme } from '@/store/theme'
import { cn, timeAgo } from '@/lib/utils'

/** Pages listen for this to open their task composer. */
export const NEW_TASK_EVENT = 'pmt:new-task'

const SEEN_KEY = 'pmt.activity-seen'

const ICON_BUTTON =
  'grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[var(--app-muted)] transition ' +
  'hover:bg-black/5 hover:text-[var(--app-text)] dark:hover:bg-white/[0.07] ' +
  'outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-ring)]'

const IS_MAC =
  typeof navigator !== 'undefined' && /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent)

function readSeen(): string {
  try {
    return localStorage.getItem(SEEN_KEY) ?? ''
  } catch {
    return ''
  }
}

function writeSeen(value: string) {
  try {
    localStorage.setItem(SEEN_KEY, value)
  } catch {
    /* storage blocked — the badge simply reappears next session */
  }
}

/* ------------------------------------------------------------ notifications */

function NotificationsMenu() {
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState<string>(() => readSeen())
  const rootRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { data, isLoading } = useActivity({ limit: 5 })

  const items = data ?? []
  const latest = items[0]?.created_at ?? ''
  const unread = items.filter((entry) => (entry.created_at ?? '') > seen).length

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (target && rootRef.current && !rootRef.current.contains(target)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next && latest && latest !== seen) {
      writeSeen(latest)
      setSeen(latest)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} new` : 'Notifications'}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(ICON_BUTTON, 'relative', open && 'bg-black/5 text-[var(--app-text)] dark:bg-white/[0.07]')}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-brand-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-[var(--app-panel)]"
          >
            {unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Recent activity"
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'top right' }}
            className="surface absolute right-0 top-full z-50 mt-2 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-xl p-1.5 shadow-[0_24px_60px_-24px_rgba(8,10,18,0.55)]"
          >
            <div className="flex items-center justify-between px-2.5 pb-1.5 pt-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Activity</span>
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="rounded-md px-1 text-[11px] font-medium text-muted transition hover:text-brand-500"
              >
                View all
              </Link>
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-2 p-2">
                {[0, 1, 2].map((row) => (
                  <Skeleton key={row} className="h-10 w-full" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="px-2.5 py-6 text-center text-xs text-muted">
                Nothing yet — activity from your projects lands here.
              </p>
            ) : (
              <ul className="scroll-thin max-h-[min(60vh,380px)] overflow-y-auto">
                {items.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpen(false)
                        if (entry.project) {
                          navigate(
                            entry.task_id
                              ? `/projects/${entry.project.id}?task=${entry.task_id}`
                              : `/projects/${entry.project.id}`,
                          )
                        }
                      }}
                      className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-black/5 focus-visible:bg-black/5 dark:hover:bg-white/[0.07] dark:focus-visible:bg-white/[0.07]"
                    >
                      <Avatar user={entry.actor} size="xs" showTitle={false} className="mt-0.5" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] leading-snug text-[var(--app-text)] line-clamp-2">
                          {entry.summary}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                          {entry.project && <span className="truncate">{entry.project.name}</span>}
                          {entry.project && <span aria-hidden="true">·</span>}
                          <span className="shrink-0">{timeAgo(entry.created_at)}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---------------------------------------------------------------- topbar */

export interface TopbarProps {
  onOpenSidebar: () => void
  onOpenSearch: () => void
}

export function Topbar({ onOpenSidebar, onOpenSearch }: TopbarProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const theme = useTheme((state) => state.theme)
  const toggleTheme = useTheme((state) => state.toggle)

  const newTask = () => window.dispatchEvent(new CustomEvent(NEW_TASK_EVENT))

  return (
    <header className="glass sticky top-0 z-40 rounded-none border-x-0 border-t-0">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-2 px-5 sm:gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open navigation"
          className={cn(ICON_BUTTON, 'lg:hidden')}
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>

        <Link
          to="/"
          aria-label="Nexus PM home"
          className="brand-gradient hidden h-9 w-9 shrink-0 place-items-center rounded-xl text-[15px] font-extrabold text-white shadow-[var(--shadow-glow)] sm:grid lg:hidden"
        >
          N
        </Link>

        {/* --------------------------------------------------------- search */}
        <button
          type="button"
          onClick={onOpenSearch}
          className={cn(
            'surface group hidden h-10 w-full max-w-[420px] items-center gap-2.5 rounded-xl px-3.5 text-sm text-[var(--app-muted)]',
            'transition hover:border-brand-500/40 hover:text-[var(--app-text)] sm:flex',
            'outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-ring)]',
          )}
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">Search projects and tasks…</span>
          <kbd className="ml-auto hidden shrink-0 items-center gap-0.5 rounded-md border border-[var(--app-border)] bg-[var(--app-panel-2)] px-1.5 py-0.5 font-sans text-[10px] font-semibold tracking-wide text-muted md:inline-flex">
            {IS_MAC ? '⌘' : 'Ctrl'} K
          </kbd>
        </button>

        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Search"
          className={cn(ICON_BUTTON, 'sm:hidden')}
        >
          <Search className="h-[18px] w-[18px]" />
        </button>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Button leftIcon={<Plus />} onClick={newTask} className="hidden sm:inline-flex">
            New task
          </Button>
          <Button size="icon" aria-label="New task" onClick={newTask} className="h-10 w-10 sm:hidden">
            <Plus />
          </Button>

          <Tooltip label={theme === 'dark' ? 'Light mode' : 'Dark mode'} side="bottom">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className={ICON_BUTTON}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ opacity: 0, rotate: -70, scale: 0.6 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 70, scale: 0.6 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-flex"
                >
                  {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </Tooltip>

          <NotificationsMenu />

          <Dropdown
            align="right"
            trigger={
              <button
                type="button"
                aria-label="Account menu"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl outline-none transition hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[var(--app-ring)] dark:hover:bg-white/[0.07]"
              >
                <Avatar user={user} size="sm" showTitle={false} />
              </button>
            }
            items={[
              { label: 'Profile settings', icon: <UserRound />, onSelect: () => navigate('/settings') },
              { label: 'Log out', icon: <LogOut />, danger: true, onSelect: logout },
            ]}
          />
        </div>
      </div>
    </header>
  )
}
