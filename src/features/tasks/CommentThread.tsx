import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageSquare, Trash2 } from 'lucide-react'
import { Avatar, Button, EmptyState, Spinner } from '@/components/ui'
import { useAddComment, useDeleteComment } from '@/hooks/queries'
import { useAuth } from '@/store/auth'
import { cn, timeAgo } from '@/lib/utils'
import type { Comment } from '@/types'

export interface CommentThreadProps {
  taskId: number
  comments: Comment[]
}

const MAX_COMPOSER_HEIGHT = 168

/** Discussion for a task: bubbles + an auto-growing composer. */
export function CommentThread({ taskId, comments }: CommentThreadProps) {
  const { user } = useAuth()
  const [body, setBody] = useState('')
  const [pending, setPending] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const timerRef = useRef<number | null>(null)

  const addComment = useAddComment()
  const deleteComment = useDeleteComment()

  useLayoutEffect(() => {
    const node = textareaRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.min(node.scrollHeight, MAX_COMPOSER_HEIGHT)}px`
  }, [body])

  useEffect(() => {
    setBody('')
    setPending(null)
  }, [taskId])

  /* Drop the placeholder bubble as soon as the real comment lands. */
  useEffect(() => {
    if (!pending) return
    const landed = comments.some((comment) => comment.body === pending && comment.author?.id === user?.id)
    if (landed) setPending(null)
  }, [comments, pending, user?.id])

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    },
    [],
  )

  const submit = async () => {
    const text = body.trim()
    if (!text || addComment.isPending) return
    setBody('')
    setPending(text)
    try {
      await addComment.mutateAsync({ taskId, body: text })
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(
        () => setPending((current) => (current === text ? null : current)),
        2500,
      )
    } catch {
      setPending(null)
      setBody(text)
    }
  }

  const remove = (comment: Comment) => {
    void deleteComment.mutateAsync({ id: comment.id, taskId }).catch(() => undefined)
  }

  const isEmpty = comments.length === 0 && !pending

  return (
    <section aria-label="Comments">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <MessageSquare className="h-4 w-4 text-[var(--app-muted)]" />
          Comments
        </h3>
        {comments.length > 0 && (
          <span className="shrink-0 text-xs font-medium text-muted">{comments.length}</span>
        )}
      </div>

      {isEmpty ? (
        <EmptyState
          icon={MessageSquare}
          title="No comments yet"
          description="Start the conversation — questions, decisions and context all live here."
          className="py-8"
        />
      ) : (
        <ul className="mt-3 space-y-3.5">
          <AnimatePresence initial={false}>
            {comments.map((comment) => {
              const mine = Boolean(user && comment.author?.id === user.id)
              return (
                <motion.li
                  key={comment.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className={cn('group/comment flex gap-2.5', mine && 'flex-row-reverse')}
                >
                  <Avatar user={comment.author} size="sm" className="mt-0.5" />
                  <div className={cn('min-w-0 max-w-[85%]', mine && 'flex flex-col items-end')}>
                    <div className={cn('flex items-center gap-2', mine && 'flex-row-reverse')}>
                      <span className="truncate text-xs font-semibold tracking-tight">
                        {mine ? 'You' : comment.author?.full_name ?? 'Someone'}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted">{timeAgo(comment.created_at)}</span>
                      {mine && (
                        <button
                          type="button"
                          onClick={() => remove(comment)}
                          aria-label="Delete comment"
                          className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[var(--app-muted)] opacity-0 transition hover:bg-rose-500/10 hover:text-rose-500 focus-visible:opacity-100 group-hover/comment:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p
                      className={cn(
                        'mt-1 whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                        mine
                          ? 'rounded-tr-md bg-brand-500/12 text-[var(--app-text)] ring-1 ring-inset ring-brand-500/20'
                          : 'surface-2 rounded-tl-md ring-1 ring-inset ring-[var(--app-border)]',
                      )}
                    >
                      {comment.body}
                    </p>
                  </div>
                </motion.li>
              )
            })}

            {pending && (
              <motion.li
                key="pending-comment"
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 0.6, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex flex-row-reverse gap-2.5"
              >
                <Avatar user={user} size="sm" className="mt-0.5" />
                <div className="flex min-w-0 max-w-[85%] flex-col items-end">
                  <div className="flex flex-row-reverse items-center gap-2">
                    <span className="text-xs font-semibold tracking-tight">You</span>
                    <Spinner className="h-3 w-3 text-[var(--app-muted)]" label="Posting comment" />
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words rounded-2xl rounded-tr-md bg-brand-500/12 px-3.5 py-2.5 text-sm leading-relaxed ring-1 ring-inset ring-brand-500/20">
                    {pending}
                  </p>
                </div>
              </motion.li>
            )}
          </AnimatePresence>
        </ul>
      )}

      <div className="mt-4 flex items-start gap-2.5">
        <Avatar user={user} size="sm" className="mt-1" />
        <div className="min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            value={body}
            rows={1}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                void submit()
              }
            }}
            placeholder="Write a comment…"
            aria-label="Write a comment"
            className="scroll-thin surface w-full resize-none rounded-xl px-3.5 py-2.5 text-sm leading-relaxed text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-muted)] focus:border-brand-500/70 focus:ring-4 focus:ring-brand-500/12"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="hidden text-[11px] text-muted sm:inline">Ctrl / Cmd + Enter to post</span>
            <Button
              size="sm"
              onClick={() => void submit()}
              loading={addComment.isPending}
              disabled={!body.trim()}
              className="ml-auto"
            >
              Comment
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
