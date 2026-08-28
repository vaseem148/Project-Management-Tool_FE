import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowRightLeft,
  FolderPlus,
  History,
  MessageSquare,
  PenLine,
  Plus,
  ShieldCheck,
  Tag,
  Trash2,
  UserMinus,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { Avatar, Badge, Card, CardContent, CardHeader, EmptyState } from '@/components/ui'
import { cn, colorClasses, timeAgo } from '@/lib/utils'
import type { Activity } from '@/types'

export interface ActivityFeedProps {
  items: Activity[]
  /** How many entries to render. */
  limit?: number
  className?: string
}

const ACTION_META: Record<string, { icon: LucideIcon; tone: string }> = {
  task_created: { icon: Plus, tone: 'bg-emerald-500 text-white' },
  task_updated: { icon: PenLine, tone: 'bg-sky-500 text-white' },
  task_moved: { icon: ArrowRightLeft, tone: 'bg-amber-500 text-white' },
  task_deleted: { icon: Trash2, tone: 'bg-rose-500 text-white' },
  comment_added: { icon: MessageSquare, tone: 'bg-brand-500 text-white' },
  project_created: { icon: FolderPlus, tone: 'bg-emerald-500 text-white' },
  project_updated: { icon: PenLine, tone: 'bg-sky-500 text-white' },
  project_deleted: { icon: Trash2, tone: 'bg-rose-500 text-white' },
  member_added: { icon: UserPlus, tone: 'bg-cyan-500 text-white' },
  member_removed: { icon: UserMinus, tone: 'bg-rose-500 text-white' },
  member_updated: { icon: ShieldCheck, tone: 'bg-sky-500 text-white' },
  label_created: { icon: Tag, tone: 'bg-brand-500 text-white' },
  label_deleted: { icon: Tag, tone: 'bg-rose-500 text-white' },
}

const FALLBACK_META = { icon: History, tone: 'bg-slate-500 text-white' }

/** Backend summaries sometimes already start with the actor's name — never print it twice. */
function summaryWithoutActor(summary: string, actorName?: string | null) {
  if (!actorName) return summary
  const trimmed = summary.trimStart()
  if (trimmed.toLowerCase().startsWith(actorName.toLowerCase())) {
    return trimmed.slice(actorName.length).trimStart()
  }
  return trimmed
}

export function ActivityFeed({ items, limit = 8, className }: ActivityFeedProps) {
  const entries = items.slice(0, limit)

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader title="Recent activity" description="What your team has been up to" />
      <CardContent>
        {entries.length === 0 ? (
          <EmptyState
            icon={History}
            title="No activity yet"
            description="Create a project or a task and the timeline starts filling up."
            className="py-10"
          />
        ) : (
          <ol className="relative">
            <span
              aria-hidden="true"
              className="absolute bottom-4 left-4 top-4 w-px bg-[var(--app-border)]"
            />
            {entries.map((entry, index) => {
              const meta = ACTION_META[entry.action] ?? FALLBACK_META
              const ActionIcon = meta.icon
              const name = entry.actor?.full_name ?? 'Someone'
              const rest = summaryWithoutActor(entry.summary, entry.actor?.full_name)
              const projectTone = colorClasses(entry.project?.color)
              return (
                <motion.li
                  key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
                  className="relative flex gap-3 pb-4 last:pb-0"
                >
                  <span className="relative z-10 shrink-0">
                    <Avatar
                      user={entry.actor}
                      size="sm"
                      className="ring-2 ring-[var(--app-panel)]"
                    />
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full ring-2 ring-[var(--app-panel)]',
                        meta.tone,
                      )}
                    >
                      <ActionIcon className="h-2.5 w-2.5" strokeWidth={2.5} />
                    </span>
                  </span>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[13px] leading-snug">
                      <span className="font-semibold">{name}</span>{' '}
                      <span className="text-muted">{rest}</span>
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {entry.project && (
                        <Link
                          to={`/projects/${entry.project.id}`}
                          className="rounded-full outline-none transition hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--app-ring)]"
                        >
                          <Badge dot={projectTone.bg} className="max-w-[12rem]">
                            {entry.project.name}
                          </Badge>
                        </Link>
                      )}
                      <span className="text-[11px] text-muted">{timeAgo(entry.created_at)}</span>
                    </div>
                  </div>
                </motion.li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
