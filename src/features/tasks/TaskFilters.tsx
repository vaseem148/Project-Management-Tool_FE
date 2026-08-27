import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarClock, Check, ChevronDown, CircleDot, Flag, Tag, UserRound, X } from 'lucide-react'
import { Avatar, Button, SearchInput } from '@/components/ui'
import { PRIORITIES, PRIORITY_META, STATUS_META, TASK_STATUSES, cn, colorClasses } from '@/lib/utils'
import type { Label, TaskPriority, TaskStatus, User } from '@/types'

export type TaskFilterState = {
  q: string
  status: TaskStatus[]
  priority: TaskPriority[]
  assignee_id?: number
  label_id?: number
  due?: 'overdue' | 'today' | 'week'
}

export const defaultTaskFilters: TaskFilterState = {
  q: '',
  status: [],
  priority: [],
  assignee_id: undefined,
  label_id: undefined,
  due: undefined,
}

export interface TaskFiltersProps {
  value: TaskFilterState
  onChange: (value: TaskFilterState) => void
  members?: User[]
  labels?: Label[]
  showProject?: boolean
}

const DUE_OPTIONS: Array<{ value: TaskFilterState['due']; label: string }> = [
  { value: undefined, label: 'Any time' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
]

type MenuKey = 'status' | 'priority' | 'assignee' | 'label' | 'due'

/* --------------------------------------------------------------- primitives */

interface FilterMenuProps {
  label: string
  hint?: string | null
  icon: ReactNode
  active: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  align?: 'left' | 'right'
  children: ReactNode
}

/** Popover trigger + panel. Multi-select panels must stay open while toggling. */
function FilterMenu({ label, hint, icon, active, open, onOpenChange, align = 'left', children }: FilterMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const changeRef = useRef(onOpenChange)
  changeRef.current = onOpenChange

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (target && rootRef.current && !rootRef.current.contains(target)) changeRef.current(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') changeRef.current(false)
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

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={hint ? label + ': ' + hint : label}
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium tracking-tight',
          'outline-none transition duration-150 focus-visible:ring-2 focus-visible:ring-[var(--app-ring)]',
          active
            ? 'border-brand-500/45 bg-brand-500/10 text-brand-600 dark:text-brand-300'
            : 'surface text-[var(--app-text)] hover:bg-black/[0.035] dark:hover:bg-white/[0.06]',
          !active && open && 'border-brand-500/40',
        )}
      >
        <span className={cn('inline-flex [&_svg]:h-4 [&_svg]:w-4', !active && 'text-[var(--app-muted)]')}>{icon}</span>
        <span className="hidden whitespace-nowrap sm:inline">{label}</span>
        {hint && (
          <>
            <span className="hidden opacity-40 sm:inline" aria-hidden="true">
              ·
            </span>
            <span className="max-w-[7rem] truncate">{hint}</span>
          </>
        )}
        <ChevronDown className={cn('h-4 w-4 shrink-0 opacity-50 transition duration-200', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: align === 'right' ? 'top right' : 'top left' }}
            className={cn(
              'surface scroll-thin absolute top-full z-50 mt-2 max-h-72 w-56 overflow-y-auto rounded-xl p-1.5',
              'shadow-[0_24px_60px_-24px_rgba(8,10,18,0.55)]',
              align === 'right' ? 'right-0' : 'left-0',
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const ROW_BASE =
  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium outline-none transition ' +
  'hover:bg-black/5 focus-visible:bg-black/5 dark:hover:bg-white/[0.07] dark:focus-visible:bg-white/[0.07]'

interface CheckRowProps {
  checked: boolean
  dot?: string
  children: ReactNode
  onSelect: () => void
}

function CheckRow({ checked, dot, children, onSelect }: CheckRowProps) {
  return (
    <button type="button" role="menuitemcheckbox" aria-checked={checked} onClick={onSelect} className={ROW_BASE}>
      <span
        aria-hidden="true"
        className={cn(
          'grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border transition',
          checked ? 'border-brand-500 bg-brand-500 text-white' : 'border-[var(--app-border)]',
        )}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3.5} />}
      </span>
      {dot && <span aria-hidden="true" className={cn('h-2 w-2 shrink-0 rounded-full', dot)} />}
      <span className="truncate">{children}</span>
    </button>
  )
}

interface RadioRowProps {
  checked: boolean
  leading?: ReactNode
  children: ReactNode
  onSelect: () => void
}

function RadioRow({ checked, leading, children, onSelect }: RadioRowProps) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={checked}
      onClick={onSelect}
      className={cn(ROW_BASE, checked && 'text-brand-600 dark:text-brand-300')}
    >
      {leading}
      <span className="truncate">{children}</span>
      {checked && <Check className="ml-auto h-4 w-4 shrink-0 text-brand-500" />}
    </button>
  )
}

/* ------------------------------------------------------------------ toolbar */

export function TaskFilters({ value, onChange, members = [], labels = [], showProject = false }: TaskFiltersProps) {
  const [term, setTerm] = useState(value.q)
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null)

  const latest = useRef({ value, onChange })
  latest.current = { value, onChange }

  useEffect(() => {
    setTerm(value.q)
  }, [value.q])

  useEffect(() => {
    if (term === latest.current.value.q) return
    const timer = window.setTimeout(() => {
      latest.current.onChange({ ...latest.current.value, q: term })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [term])

  const patch = (next: Partial<TaskFilterState>) => onChange({ ...value, ...next })

  const toggleStatus = (status: TaskStatus) =>
    patch({
      status: value.status.includes(status)
        ? value.status.filter((item) => item !== status)
        : [...value.status, status],
    })

  const togglePriority = (priority: TaskPriority) =>
    patch({
      priority: value.priority.includes(priority)
        ? value.priority.filter((item) => item !== priority)
        : [...value.priority, priority],
    })

  const assignee = useMemo(
    () => members.find((member) => member.id === value.assignee_id),
    [members, value.assignee_id],
  )
  const activeLabel = useMemo(() => labels.find((item) => item.id === value.label_id), [labels, value.label_id])
  const activeDue = DUE_OPTIONS.find((option) => option.value === value.due)

  const activeCount =
    value.status.length +
    value.priority.length +
    (value.assignee_id ? 1 : 0) +
    (value.label_id ? 1 : 0) +
    (value.due ? 1 : 0) +
    (value.q.trim() ? 1 : 0)

  const menuProps = (key: MenuKey) => ({
    open: openMenu === key,
    onOpenChange: (next: boolean) => setOpenMenu(next ? key : null),
  })

  return (
    <div className="glass rounded-2xl p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={term}
          onChange={setTerm}
          placeholder={showProject ? 'Search all tasks…' : 'Search tasks…'}
          className="w-full sm:w-56 lg:w-72"
        />

        <FilterMenu
          label="Status"
          hint={value.status.length ? String(value.status.length) : null}
          icon={<CircleDot />}
          active={value.status.length > 0}
          {...menuProps('status')}
        >
          {TASK_STATUSES.map((status) => (
            <CheckRow
              key={status}
              checked={value.status.includes(status)}
              dot={STATUS_META[status].dot}
              onSelect={() => toggleStatus(status)}
            >
              {STATUS_META[status].label}
            </CheckRow>
          ))}
          {value.status.length > 0 && (
            <button
              type="button"
              onClick={() => patch({ status: [] })}
              className={cn(ROW_BASE, 'mt-1 border-t border-[var(--app-border)] pt-2 text-xs text-muted')}
            >
              Clear status
            </button>
          )}
        </FilterMenu>

        <FilterMenu
          label="Priority"
          hint={value.priority.length ? String(value.priority.length) : null}
          icon={<Flag />}
          active={value.priority.length > 0}
          {...menuProps('priority')}
        >
          {PRIORITIES.map((priority) => (
            <CheckRow
              key={priority}
              checked={value.priority.includes(priority)}
              dot={PRIORITY_META[priority].dot}
              onSelect={() => togglePriority(priority)}
            >
              {PRIORITY_META[priority].label}
            </CheckRow>
          ))}
          {value.priority.length > 0 && (
            <button
              type="button"
              onClick={() => patch({ priority: [] })}
              className={cn(ROW_BASE, 'mt-1 border-t border-[var(--app-border)] pt-2 text-xs text-muted')}
            >
              Clear priority
            </button>
          )}
        </FilterMenu>

        <FilterMenu
          label="Assignee"
          hint={assignee ? assignee.full_name : null}
          icon={<UserRound />}
          active={Boolean(value.assignee_id)}
          {...menuProps('assignee')}
        >
          <RadioRow
            checked={!value.assignee_id}
            onSelect={() => {
              patch({ assignee_id: undefined })
              setOpenMenu(null)
            }}
          >
            Anyone
          </RadioRow>
          {members.length === 0 && <p className="px-2.5 py-2 text-xs text-muted">No people to filter by.</p>}
          {members.map((member) => (
            <RadioRow
              key={member.id}
              checked={value.assignee_id === member.id}
              leading={<Avatar user={member} size="xs" showTitle={false} className="h-5 w-5 text-[8px]" />}
              onSelect={() => {
                patch({ assignee_id: value.assignee_id === member.id ? undefined : member.id })
                setOpenMenu(null)
              }}
            >
              {member.full_name}
            </RadioRow>
          ))}
        </FilterMenu>

        <FilterMenu
          label="Label"
          hint={activeLabel ? activeLabel.name : null}
          icon={<Tag />}
          active={Boolean(value.label_id)}
          align="right"
          {...menuProps('label')}
        >
          <RadioRow
            checked={!value.label_id}
            onSelect={() => {
              patch({ label_id: undefined })
              setOpenMenu(null)
            }}
          >
            All labels
          </RadioRow>
          {labels.length === 0 && <p className="px-2.5 py-2 text-xs text-muted">No labels yet.</p>}
          {labels.map((item) => (
            <RadioRow
              key={item.id}
              checked={value.label_id === item.id}
              leading={
                <span
                  aria-hidden="true"
                  className={cn('h-2.5 w-2.5 shrink-0 rounded-full', colorClasses(item.color).bg)}
                />
              }
              onSelect={() => {
                patch({ label_id: value.label_id === item.id ? undefined : item.id })
                setOpenMenu(null)
              }}
            >
              {item.name}
            </RadioRow>
          ))}
        </FilterMenu>

        <FilterMenu
          label="Due"
          hint={value.due && activeDue ? activeDue.label : null}
          icon={<CalendarClock />}
          active={Boolean(value.due)}
          align="right"
          {...menuProps('due')}
        >
          {DUE_OPTIONS.map((option) => (
            <RadioRow
              key={option.label}
              checked={value.due === option.value}
              onSelect={() => {
                patch({ due: option.value })
                setOpenMenu(null)
              }}
            >
              {option.label}
            </RadioRow>
          ))}
        </FilterMenu>

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-muted"
            leftIcon={<X />}
            onClick={() => {
              setOpenMenu(null)
              onChange({ ...defaultTaskFilters })
            }}
          >
            Clear
            <span className="ml-1 rounded-full bg-brand-500/15 px-1.5 text-[10px] font-semibold text-brand-600 dark:text-brand-300">
              {activeCount}
            </span>
          </Button>
        )}
      </div>
    </div>
  )
}
