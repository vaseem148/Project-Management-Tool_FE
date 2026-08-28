import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, MoreHorizontal, Tag, Trash2, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  Drawer,
  Dropdown,
  Input,
  Select,
  Skeleton,
  Textarea,
} from '@/components/ui'
import {
  useDeleteTask,
  useLabels,
  useProjectMembers,
  useTask,
  useUpdateTask,
  type TaskUpdate,
} from '@/hooks/queries'
import {
  cn,
  colorClasses,
  isOverdue,
  PRIORITIES,
  PRIORITY_META,
  STATUS_META,
  TASK_STATUSES,
  timeAgo,
} from '@/lib/utils'
import { CommentThread } from './CommentThread'
import { SubtaskList } from './SubtaskList'
import type { TaskPriority, TaskStatus } from '@/types'

export interface TaskDetailDrawerProps {
  taskId: number | null
  open: boolean
  onClose: () => void
}

const STATUS_OPTIONS = TASK_STATUSES.map((status) => ({ value: status, label: STATUS_META[status].label }))
const PRIORITY_OPTIONS = PRIORITIES.map((priority) => ({ value: priority, label: PRIORITY_META[priority].label }))

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="w-full">
      <p className="mb-1.5 text-xs font-medium text-muted">{label}</p>
      {children}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6 px-5 py-5">
      <Skeleton className="h-7 w-3/4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  )
}

/** Full task view: inline editing, properties, labels, subtasks and comments. */
export function TaskDetailDrawer({ taskId, open, onClose }: TaskDetailDrawerProps) {
  const { data: task } = useTask(taskId)
  const { data: members } = useProjectMembers(task?.project_id)
  const { data: labels } = useLabels(task?.project_id)

  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [editingDescription, setEditingDescription] = useState(false)
  const [descriptionDraft, setDescriptionDraft] = useState('')
  const [estimateDraft, setEstimateDraft] = useState('')
  const [confirming, setConfirming] = useState(false)

  const titleRef = useRef<HTMLTextAreaElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditingTitle(false)
    setEditingDescription(false)
    setConfirming(false)
  }, [taskId])

  useEffect(() => {
    setEstimateDraft(task?.estimate_hours != null ? String(task.estimate_hours) : '')
  }, [task?.id, task?.estimate_hours])

  useEffect(() => {
    if (!editingTitle) return
    const node = titleRef.current
    node?.focus()
    node?.setSelectionRange(node.value.length, node.value.length)
  }, [editingTitle])

  useEffect(() => {
    if (editingDescription) descriptionRef.current?.focus()
  }, [editingDescription])

  /* The mutation hook raises its own toast on failure — swallow the rejection. */
  const patch = (data: TaskUpdate) => {
    if (!task) return
    void updateTask.mutateAsync({ id: task.id, data }).catch(() => undefined)
  }

  const openTitleEditor = () => {
    setTitleDraft(task?.title ?? '')
    setEditingTitle(true)
  }

  const commitTitle = () => {
    setEditingTitle(false)
    const next = titleDraft.trim()
    if (!task || !next || next === task.title) return
    patch({ title: next })
  }

  const openDescriptionEditor = () => {
    setDescriptionDraft(task?.description ?? '')
    setEditingDescription(true)
  }

  const commitDescription = () => {
    setEditingDescription(false)
    if (!task) return
    const next = descriptionDraft.trim()
    if (next === (task.description ?? '').trim()) return
    patch({ description: next })
  }

  const commitEstimate = () => {
    if (!task) return
    const raw = estimateDraft.trim()
    const current = task.estimate_hours ?? null
    if (raw === '') {
      if (current !== null) patch({ estimate_hours: null })
      return
    }
    const value = Number(raw)
    if (!Number.isFinite(value) || value < 0) {
      setEstimateDraft(current != null ? String(current) : '')
      return
    }
    if (value !== current) patch({ estimate_hours: value })
  }

  const toggleLabel = (labelId: number) => {
    if (!task) return
    const current = task.labels.map((label) => label.id)
    patch({
      label_ids: current.includes(labelId) ? current.filter((id) => id !== labelId) : [...current, labelId],
    })
  }

  const confirmDelete = async () => {
    if (!task) return
    try {
      await deleteTask.mutateAsync(task.id)
      toast.success('Task deleted')
      setConfirming(false)
      onClose()
    } catch {
      /* the mutation hook already surfaced the error */
    }
  }

  const projectTone = colorClasses(task?.project?.color)
  const overdue = task ? isOverdue(task.due_date, task.status) : false

  return (
    <>
      {/* Escape reaches both dialogs, so hold the drawer open while confirming. */}
      <Drawer
        open={open}
        onClose={() => {
          if (!confirming) onClose()
        }}
        width="w-[min(680px,100vw)]"
      >
        <div className="flex min-h-full flex-col">
          <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-[var(--app-border)] bg-[var(--app-panel)] px-5 py-3 pr-14">
            {task ? (
              <>
                <span className="shrink-0 rounded-md bg-[var(--app-panel-2)] px-2 py-1 font-mono text-[11px] font-semibold text-muted ring-1 ring-inset ring-[var(--app-border)]">
                  #{task.id}
                </span>
                {task.project && (
                  <Badge dot={projectTone.bg} className="min-w-0">
                    {task.project.key} · {task.project.name}
                  </Badge>
                )}
                <div className="ml-auto shrink-0">
                  <Dropdown
                    align="right"
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Task actions">
                        <MoreHorizontal />
                      </Button>
                    }
                    items={[
                      {
                        label: 'Delete task',
                        icon: <Trash2 />,
                        danger: true,
                        onSelect: () => setConfirming(true),
                      },
                    ]}
                  />
                </div>
              </>
            ) : (
              <>
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-40" />
              </>
            )}
          </header>

          {!task ? (
            <DetailSkeleton />
          ) : (
            <div className="flex-1 space-y-6 px-5 py-5">
              {/* ------------------------------------------------------- title */}
              {editingTitle ? (
                <textarea
                  ref={titleRef}
                  value={titleDraft}
                  rows={2}
                  maxLength={240}
                  onChange={(event) => setTitleDraft(event.target.value)}
                  onBlur={commitTitle}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      commitTitle()
                    } else if (event.key === 'Escape') {
                      event.preventDefault()
                      setEditingTitle(false)
                    }
                  }}
                  aria-label="Task title"
                  className="scroll-thin surface w-full resize-none rounded-xl px-3 py-2 text-xl font-semibold leading-snug tracking-tight text-[var(--app-text)] outline-none focus:border-brand-500/70 focus:ring-4 focus:ring-brand-500/12"
                />
              ) : (
                <button
                  type="button"
                  onClick={openTitleEditor}
                  className="-mx-3 block w-[calc(100%+1.5rem)] rounded-xl px-3 py-2 text-left text-xl font-semibold leading-snug tracking-tight transition hover:bg-black/[0.035] dark:hover:bg-white/[0.04]"
                >
                  {task.title}
                </button>
              )}

              {/* ------------------------------------------------- description */}
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted">Description</p>
                {editingDescription ? (
                  <div>
                    <Textarea
                      ref={descriptionRef}
                      value={descriptionDraft}
                      rows={5}
                      onChange={(event) => setDescriptionDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          event.preventDefault()
                          setEditingDescription(false)
                        }
                      }}
                      placeholder="Add context, acceptance criteria or links…"
                      aria-label="Task description"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <Button size="sm" onClick={commitDescription}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingDescription(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={openDescriptionEditor}
                    className={cn(
                      'block w-full whitespace-pre-wrap break-words rounded-xl px-3 py-2.5 text-left text-sm leading-relaxed transition',
                      'surface-2 ring-1 ring-inset ring-[var(--app-border)] hover:ring-brand-500/40',
                      !task.description?.trim() && 'text-muted',
                    )}
                  >
                    {task.description?.trim() || 'Add a description…'}
                  </button>
                )}
              </div>

              {/* -------------------------------------------------- properties */}
              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  label="Status"
                  options={STATUS_OPTIONS}
                  value={task.status}
                  onChange={(event) => patch({ status: event.target.value as TaskStatus })}
                />
                <Select
                  label="Priority"
                  options={PRIORITY_OPTIONS}
                  value={task.priority}
                  onChange={(event) => patch({ priority: event.target.value as TaskPriority })}
                />

                <Field label="Assignee">
                  <Dropdown
                    align="left"
                    className="w-full [&>span]:w-full"
                    trigger={
                      <button
                        type="button"
                        className="surface flex h-10 w-full items-center gap-2 rounded-xl px-3 text-sm transition hover:border-brand-500/40"
                      >
                        <Avatar user={task.assignee} size="xs" showTitle={false} />
                        <span className={cn('truncate', !task.assignee && 'text-muted')}>
                          {task.assignee?.full_name ?? 'Unassigned'}
                        </span>
                        <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-[var(--app-muted)]" />
                      </button>
                    }
                    items={[
                      {
                        label: 'Unassigned',
                        icon: <UserRound />,
                        onSelect: () => patch({ assignee_id: null }),
                      },
                      ...(members ?? []).map((member) => ({
                        label: member.user.full_name,
                        icon: <Avatar user={member.user} size="xs" showTitle={false} />,
                        onSelect: () => patch({ assignee_id: member.user.id }),
                      })),
                    ]}
                  />
                </Field>

                <Input
                  label="Due date"
                  type="date"
                  value={task.due_date ? task.due_date.slice(0, 10) : ''}
                  onChange={(event) => patch({ due_date: event.target.value || null })}
                  error={overdue ? 'Past due' : null}
                />

                <Input
                  label="Estimate (hours)"
                  type="number"
                  min={0}
                  step={0.5}
                  inputMode="decimal"
                  placeholder="0"
                  value={estimateDraft}
                  onChange={(event) => setEstimateDraft(event.target.value)}
                  onBlur={commitEstimate}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      event.currentTarget.blur()
                    }
                  }}
                />
              </div>

              {/* ------------------------------------------------------ labels */}
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
                  <Tag className="h-3.5 w-3.5" />
                  Labels
                </p>
                {labels && labels.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {labels.map((label) => {
                      const active = task.labels.some((item) => item.id === label.id)
                      const tone = colorClasses(label.color)
                      return (
                        <button
                          key={label.id}
                          type="button"
                          role="checkbox"
                          aria-checked={active}
                          onClick={() => toggleLabel(label.id)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition active:scale-[0.97]',
                            active
                              ? cn(tone.soft, tone.text, tone.border)
                              : 'border-[var(--app-border)] text-muted hover:border-brand-500/40 hover:text-[var(--app-text)]',
                          )}
                        >
                          <span className={cn('h-2 w-2 rounded-full', active ? tone.bg : 'bg-[var(--app-border)]')} aria-hidden="true" />
                          {label.name}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted">No labels in this project yet.</p>
                )}
              </div>

              <div className="border-t border-[var(--app-border)] pt-5">
                <SubtaskList taskId={task.id} subtasks={task.subtasks} />
              </div>

              <div className="border-t border-[var(--app-border)] pt-5">
                <CommentThread taskId={task.id} comments={task.comments} />
              </div>
            </div>
          )}

          {task && (
            <footer className="sticky bottom-0 mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-[var(--app-border)] bg-[var(--app-panel-2)] px-5 py-2.5 text-[11px] text-muted">
              <span>
                Created {timeAgo(task.created_at)} by {task.reporter?.full_name ?? 'someone'}
              </span>
              <span>Updated {timeAgo(task.updated_at)}</span>
            </footer>
          )}
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={confirmDelete}
        title="Delete this task?"
        description="The task, its subtasks and its comments will be permanently removed."
        confirmLabel="Delete task"
        loading={deleteTask.isPending}
        danger
      />
    </>
  )
}
