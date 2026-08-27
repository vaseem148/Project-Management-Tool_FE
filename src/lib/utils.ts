import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNowStrict, isPast, isToday, isTomorrow, parseISO } from 'date-fns'
import type { TaskPriority, TaskStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const STATUS_META: Record<TaskStatus, { label: string; dot: string; chip: string; bar: string }> = {
  backlog: { label: 'Backlog', dot: 'bg-slate-400', chip: 'bg-slate-500/12 text-slate-500 dark:text-slate-300', bar: 'bg-slate-400' },
  todo: { label: 'To Do', dot: 'bg-sky-500', chip: 'bg-sky-500/12 text-sky-600 dark:text-sky-300', bar: 'bg-sky-500' },
  in_progress: { label: 'In Progress', dot: 'bg-amber-500', chip: 'bg-amber-500/14 text-amber-600 dark:text-amber-300', bar: 'bg-amber-500' },
  in_review: { label: 'In Review', dot: 'bg-violet-500', chip: 'bg-violet-500/14 text-violet-600 dark:text-violet-300', bar: 'bg-violet-500' },
  done: { label: 'Done', dot: 'bg-emerald-500', chip: 'bg-emerald-500/14 text-emerald-600 dark:text-emerald-300', bar: 'bg-emerald-500' },
}

export const TASK_STATUSES: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done']

export const PRIORITY_META: Record<TaskPriority, { label: string; chip: string; dot: string; rank: number }> = {
  low: { label: 'Low', chip: 'bg-slate-500/12 text-slate-500 dark:text-slate-300', dot: 'bg-slate-400', rank: 0 },
  medium: { label: 'Medium', chip: 'bg-sky-500/12 text-sky-600 dark:text-sky-300', dot: 'bg-sky-500', rank: 1 },
  high: { label: 'High', chip: 'bg-orange-500/14 text-orange-600 dark:text-orange-300', dot: 'bg-orange-500', rank: 2 },
  urgent: { label: 'Urgent', chip: 'bg-rose-500/14 text-rose-600 dark:text-rose-300', dot: 'bg-rose-500', rank: 3 },
}

export const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent']

export const PROJECT_STATUS_META: Record<string, { label: string; chip: string }> = {
  active: { label: 'Active', chip: 'bg-emerald-500/14 text-emerald-600 dark:text-emerald-300' },
  on_hold: { label: 'On Hold', chip: 'bg-amber-500/14 text-amber-600 dark:text-amber-300' },
  completed: { label: 'Completed', chip: 'bg-sky-500/14 text-sky-600 dark:text-sky-300' },
  archived: { label: 'Archived', chip: 'bg-slate-500/12 text-slate-500 dark:text-slate-300' },
}

export const COLORS = ['violet', 'indigo', 'sky', 'cyan', 'emerald', 'amber', 'orange', 'rose', 'pink', 'slate'] as const
export type ColorName = (typeof COLORS)[number]

const COLOR_CLASSES: Record<string, { bg: string; soft: string; text: string; ring: string; border: string }> = {
  violet: { bg: 'bg-violet-500', soft: 'bg-violet-500/12', text: 'text-violet-500', ring: 'ring-violet-500/30', border: 'border-violet-500/30' },
  indigo: { bg: 'bg-indigo-500', soft: 'bg-indigo-500/12', text: 'text-indigo-500', ring: 'ring-indigo-500/30', border: 'border-indigo-500/30' },
  sky: { bg: 'bg-sky-500', soft: 'bg-sky-500/12', text: 'text-sky-500', ring: 'ring-sky-500/30', border: 'border-sky-500/30' },
  cyan: { bg: 'bg-cyan-500', soft: 'bg-cyan-500/12', text: 'text-cyan-500', ring: 'ring-cyan-500/30', border: 'border-cyan-500/30' },
  emerald: { bg: 'bg-emerald-500', soft: 'bg-emerald-500/12', text: 'text-emerald-500', ring: 'ring-emerald-500/30', border: 'border-emerald-500/30' },
  amber: { bg: 'bg-amber-500', soft: 'bg-amber-500/12', text: 'text-amber-500', ring: 'ring-amber-500/30', border: 'border-amber-500/30' },
  orange: { bg: 'bg-orange-500', soft: 'bg-orange-500/12', text: 'text-orange-500', ring: 'ring-orange-500/30', border: 'border-orange-500/30' },
  rose: { bg: 'bg-rose-500', soft: 'bg-rose-500/12', text: 'text-rose-500', ring: 'ring-rose-500/30', border: 'border-rose-500/30' },
  pink: { bg: 'bg-pink-500', soft: 'bg-pink-500/12', text: 'text-pink-500', ring: 'ring-pink-500/30', border: 'border-pink-500/30' },
  slate: { bg: 'bg-slate-500', soft: 'bg-slate-500/12', text: 'text-slate-500', ring: 'ring-slate-500/30', border: 'border-slate-500/30' },
}

export function colorClasses(color?: string | null) {
  return COLOR_CLASSES[color ?? 'violet'] ?? COLOR_CLASSES.violet
}

export function initials(name?: string | null) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return (first + second).toUpperCase() || name.slice(0, 1).toUpperCase()
}

export function toDate(value?: string | null): Date | null {
  if (!value) return null
  const parsed = parseISO(value.length <= 10 ? value + 'T00:00:00' : value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatDate(value?: string | null, pattern = 'MMM d, yyyy') {
  const date = toDate(value)
  return date ? format(date, pattern) : '—'
}

export function formatDueDate(value?: string | null) {
  const date = toDate(value)
  if (!date) return null
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'MMM d')
}

export function isOverdue(value?: string | null, status?: TaskStatus) {
  const date = toDate(value)
  if (!date || status === 'done') return false
  return isPast(date) && !isToday(date)
}

export function timeAgo(value?: string | null) {
  const date = toDate(value)
  if (!date) return ''
  return formatDistanceToNowStrict(date) + ' ago'
}

export function pluralize(count: number, word: string, plural?: string) {
  return count + ' ' + (count === 1 ? word : plural ?? word + 's')
}

/** Stable pseudo-random color for a user id, used for avatars. */
export function avatarColor(seed: number | string, explicit?: string | null): string {
  if (explicit && COLOR_CLASSES[explicit]) return explicit
  const key = typeof seed === 'number' ? seed : seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return COLORS[Math.abs(key) % COLORS.length]
}
