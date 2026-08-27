import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ListChecks, Plus, X } from 'lucide-react'
import { Progress } from '@/components/ui'
import { useAddSubtask, useDeleteSubtask, useUpdateSubtask } from '@/hooks/queries'
import { cn } from '@/lib/utils'
import type { Subtask } from '@/types'

export interface SubtaskListProps {
  taskId: number
  subtasks: Subtask[]
}

/** Checklist under a task: toggle, delete and inline-add subtasks. */
export function SubtaskList({ taskId, subtasks }: SubtaskListProps) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addSubtask = useAddSubtask()
  const updateSubtask = useUpdateSubtask()
  const deleteSubtask = useDeleteSubtask()

  const total = subtasks.length
  const doneCount = subtasks.filter((subtask) => subtask.is_done).length
  const percent = total ? Math.round((doneCount / total) * 100) : 0

  useEffect(() => {
    setAdding(false)
    setDraft('')
  }, [taskId])

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  /* The mutation hooks surface their own error toasts — swallow the rejection. */
  const toggle = (subtask: Subtask) => {
    void updateSubtask
      .mutateAsync({ id: subtask.id, taskId, data: { is_done: !subtask.is_done } })
      .catch(() => undefined)
  }

  const remove = (subtask: Subtask) => {
    void deleteSubtask.mutateAsync({ id: subtask.id, taskId }).catch(() => undefined)
  }

  const commitDraft = async () => {
    const title = draft.trim()
    if (!title) {
      setAdding(false)
      return
    }
    setDraft('')
    try {
      await addSubtask.mutateAsync({ taskId, title })
      inputRef.current?.focus()
    } catch {
      setDraft(title)
    }
  }

  return (
    <section aria-label="Subtasks">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <ListChecks className="h-4 w-4 text-[var(--app-muted)]" />
          Subtasks
        </h3>
        {total > 0 && (
          <span className="shrink-0 text-xs font-medium text-muted">
            {doneCount} of {total} done
          </span>
        )}
      </div>

      {total > 0 && (
        <Progress
          value={percent}
          label="Subtask progress"
          className="mt-2.5 h-1"
          barClassName={percent === 100 ? 'bg-emerald-500 bg-none' : undefined}
        />
      )}

      <ul className="mt-2 -mx-2">
        <AnimatePresence initial={false}>
          {subtasks.map((subtask) => (
            <motion.li
              key={subtask.id}
              layout
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="group/subtask flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-black/[0.035] dark:hover:bg-white/[0.04]"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={subtask.is_done}
                aria-label={subtask.is_done ? `Mark "${subtask.title}" as not done` : `Mark "${subtask.title}" as done`}
                onClick={() => toggle(subtask)}
                className={cn(
                  'grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md border transition duration-150 active:scale-90',
                  subtask.is_done
                    ? 'brand-gradient border-transparent'
                    : 'border-[var(--app-border)] bg-transparent hover:border-brand-500/60',
                )}
              >
                <AnimatePresence initial={false}>
                  {subtask.is_done && (
                    <motion.svg
                      key="check"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      className="h-3 w-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.path
                        d="M4.5 12.5 9.5 17.5 19.5 6.5"
                        stroke="#fff"
                        strokeWidth={3.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                      />
                    </motion.svg>
                  )}
                </AnimatePresence>
              </button>

              <span
                className={cn(
                  'min-w-0 flex-1 break-words text-sm leading-snug transition',
                  subtask.is_done && 'text-muted line-through',
                )}
              >
                {subtask.title}
              </span>

              <button
                type="button"
                onClick={() => remove(subtask)}
                aria-label={`Delete subtask "${subtask.title}"`}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[var(--app-muted)] opacity-0 transition hover:bg-rose-500/10 hover:text-rose-500 focus-visible:opacity-100 group-hover/subtask:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {adding ? (
        <div className="mt-1 flex items-center gap-2.5 px-2">
          <span className="h-[18px] w-[18px] shrink-0 rounded-md border border-dashed border-[var(--app-border)]" aria-hidden="true" />
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void commitDraft()
              } else if (event.key === 'Escape') {
                event.preventDefault()
                setDraft('')
                setAdding(false)
              }
            }}
            onBlur={() => {
              if (!draft.trim()) setAdding(false)
            }}
            placeholder="What needs doing? Enter to add, Esc to cancel"
            aria-label="New subtask title"
            className="h-8 w-full rounded-lg border border-transparent bg-transparent text-sm text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted)]"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted transition hover:text-brand-500"
        >
          <Plus className="h-3.5 w-3.5" />
          Add subtask
        </button>
      )}
    </section>
  )
}
