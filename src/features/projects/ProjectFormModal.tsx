import { useEffect, useId, useMemo, useState, type FormEvent } from 'react'
import { Check, Search, Users } from 'lucide-react'
import { toast } from 'sonner'
import {
  Avatar,
  Button,
  Input,
  Modal,
  Select,
  Spinner,
  Textarea,
} from '@/components/ui'
import { useCreateProject, useUpdateProject, useUsers } from '@/hooks/queries'
import type { ProjectCreate, ProjectUpdate } from '@/hooks/queries'
import { useAuth } from '@/store/auth'
import { cn, COLORS, colorClasses, PROJECT_STATUS_META } from '@/lib/utils'
import type { Project, ProjectStatus, User } from '@/types'

export interface ProjectFormModalProps {
  open: boolean
  onClose: () => void
  project?: Project | null
}

interface FormState {
  name: string
  key: string
  description: string
  color: string
  status: ProjectStatus
  start_date: string
  due_date: string
}

interface FormErrors {
  name?: string
  key?: string
  due_date?: string
}

const STATUS_OPTIONS = (['active', 'on_hold', 'completed', 'archived'] as ProjectStatus[]).map(
  (value) => ({ value, label: PROJECT_STATUS_META[value].label }),
)

const EMPTY: FormState = {
  name: '',
  key: '',
  description: '',
  color: 'violet',
  status: 'active',
  start_date: '',
  due_date: '',
}

/** Uppercase initials for multi-word names, first letters otherwise. Max 10 chars. */
export function suggestProjectKey(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  const raw =
    words.length === 1
      ? words[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 4)
      : words.map((word) => word.replace(/[^a-zA-Z0-9]/g, '').charAt(0)).join('')
  return raw.toUpperCase().slice(0, 10)
}

function sanitizeKey(value: string) {
  return value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase().slice(0, 10)
}

function fromProject(project: Project): FormState {
  return {
    name: project.name,
    key: project.key,
    description: project.description ?? '',
    color: project.color || 'violet',
    status: project.status,
    start_date: project.start_date ?? '',
    due_date: project.due_date ?? '',
  }
}

export function ProjectFormModal({ open, onClose, project }: ProjectFormModalProps) {
  const isEdit = Boolean(project)
  const formId = useId()
  const { user } = useAuth()

  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<FormErrors>({})
  const [keyTouched, setKeyTouched] = useState(false)
  const [memberIds, setMemberIds] = useState<number[]>([])
  const [memberQuery, setMemberQuery] = useState('')

  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const saving = createProject.isPending || updateProject.isPending

  const { data: users, isLoading: usersLoading } = useUsers()

  // Reset every time the dialog is opened, so create and edit never leak state.
  useEffect(() => {
    if (!open) return
    setForm(project ? fromProject(project) : EMPTY)
    setErrors({})
    setKeyTouched(Boolean(project))
    setMemberIds([])
    setMemberQuery('')
  }, [open, project])

  const candidates = useMemo(() => {
    const list = (users ?? []).filter((candidate) => candidate.id !== user?.id)
    const needle = memberQuery.trim().toLowerCase()
    if (!needle) return list
    return list.filter(
      (candidate) =>
        candidate.full_name.toLowerCase().includes(needle) ||
        candidate.email.toLowerCase().includes(needle) ||
        (candidate.job_title ?? '').toLowerCase().includes(needle),
    )
  }, [users, user?.id, memberQuery])

  function patch(changes: Partial<FormState>) {
    setForm((previous) => ({ ...previous, ...changes }))
  }

  function onNameChange(value: string) {
    // While creating, the key tracks the name until the user takes it over.
    if (!isEdit && !keyTouched) patch({ name: value, key: suggestProjectKey(value) })
    else patch({ name: value })
    if (errors.name) setErrors((previous) => ({ ...previous, name: undefined }))
  }

  function toggleMember(id: number) {
    setMemberIds((previous) =>
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id],
    )
  }

  function validate(): FormErrors {
    const next: FormErrors = {}
    if (form.name.trim().length < 2) next.name = 'Give the project a name of at least 2 characters.'
    if (!isEdit && form.key.trim() && form.key.trim().length < 2) next.key = 'Use at least 2 characters.'
    if (form.start_date && form.due_date && form.due_date < form.start_date) {
      next.due_date = 'The due date must be on or after the start date.'
    }
    return next
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const name = form.name.trim()
    const shared = {
      name,
      description: form.description.trim() || null,
      color: form.color,
      status: form.status,
      start_date: form.start_date || null,
      due_date: form.due_date || null,
    }

    try {
      if (project) {
        await updateProject.mutateAsync({ id: project.id, data: shared satisfies ProjectUpdate })
        toast.success(`“${name}” updated`)
      } else {
        const payload: ProjectCreate = {
          ...shared,
          key: form.key.trim() || null,
          member_ids: memberIds,
        }
        await createProject.mutateAsync(payload)
        toast.success(`“${name}” created`)
      }
      onClose()
    } catch {
      /* the mutation hooks already surface the API error as a toast */
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'Edit project' : 'New project'}
      description={
        isEdit
          ? 'Update the details, timeline and status of this project.'
          : 'Set up a workspace for your team — you can invite more people later.'
      }
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {isEdit ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
          <Input
            label="Project name"
            placeholder="Website redesign"
            value={form.name}
            onChange={(event) => onNameChange(event.target.value)}
            error={errors.name}
            maxLength={160}
          />
          <Input
            label="Key"
            placeholder="WR"
            value={form.key}
            disabled={isEdit}
            onChange={(event) => {
              setKeyTouched(true)
              patch({ key: sanitizeKey(event.target.value) })
              if (errors.key) setErrors((previous) => ({ ...previous, key: undefined }))
            }}
            error={errors.key}
            hint={isEdit ? undefined : 'From the name'}
            className="font-mono uppercase tracking-wider"
          />
        </div>

        <Textarea
          label="Description"
          rows={3}
          placeholder="What is this project about?"
          value={form.description}
          onChange={(event) => patch({ description: event.target.value })}
        />

        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted">Accent color</span>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((color) => {
              const tone = colorClasses(color)
              const active = form.color === color
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => patch({ color })}
                  aria-label={color}
                  aria-pressed={active}
                  className={cn(
                    'grid h-8 w-8 place-items-center rounded-full text-white transition',
                    'ring-offset-2 ring-offset-[var(--app-panel)] hover:scale-110',
                    tone.bg,
                    active ? 'ring-2 ring-[var(--app-text)]' : 'ring-1 ring-inset ring-white/20',
                  )}
                >
                  {active && <Check className="h-4 w-4" strokeWidth={3} />}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(event) => patch({ status: event.target.value as ProjectStatus })}
          />
          <Input
            label="Start date"
            type="date"
            value={form.start_date}
            onChange={(event) => patch({ start_date: event.target.value })}
          />
          <Input
            label="Due date"
            type="date"
            value={form.due_date}
            min={form.start_date || undefined}
            onChange={(event) => {
              patch({ due_date: event.target.value })
              if (errors.due_date) setErrors((previous) => ({ ...previous, due_date: undefined }))
            }}
            error={errors.due_date}
          />
        </div>

        {!isEdit && (
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-muted">Team members</span>
              <span className="text-[11px] text-muted">
                {memberIds.length > 0 ? `${memberIds.length} selected` : 'You are the owner'}
              </span>
            </div>

            <div className="surface overflow-hidden rounded-xl">
              <div className="relative border-b border-[var(--app-border)]">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-muted)]"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={memberQuery}
                  onChange={(event) => setMemberQuery(event.target.value)}
                  placeholder="Search teammates…"
                  aria-label="Search teammates"
                  className="h-10 w-full bg-transparent pl-10 pr-3 text-sm outline-none placeholder:text-[var(--app-muted)]"
                />
              </div>

              <div className="scroll-thin max-h-52 overflow-y-auto p-1.5">
                {usersLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted">
                    <Spinner className="h-4 w-4" />
                    Loading people…
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="flex flex-col items-center gap-1.5 py-8 text-center">
                    <Users className="h-5 w-5 text-[var(--app-muted)]" aria-hidden="true" />
                    <p className="text-xs text-muted">
                      {memberQuery ? 'Nobody matches that search.' : 'No other people have signed up yet.'}
                    </p>
                  </div>
                ) : (
                  candidates.map((candidate: User) => {
                    const checked = memberIds.includes(candidate.id)
                    return (
                      <button
                        key={candidate.id}
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        onClick={() => toggleMember(candidate.id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition',
                          checked ? 'bg-brand-500/10' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05]',
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[6px] border transition',
                            checked
                              ? 'border-brand-500 bg-brand-500 text-white'
                              : 'border-[var(--app-border)] bg-transparent',
                          )}
                        >
                          {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                        <Avatar user={candidate} size="sm" showTitle={false} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{candidate.full_name}</span>
                          <span className="block truncate text-[11px] text-muted">
                            {candidate.job_title || candidate.email}
                          </span>
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
