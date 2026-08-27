import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Input, Modal, Select, Textarea } from '@/components/ui'
import { useCreateTask, useLabels, useProjectMembers, useProjects, useUpdateTask } from '@/hooks/queries'
import { cn, colorClasses, PRIORITIES, PRIORITY_META, STATUS_META, TASK_STATUSES } from '@/lib/utils'
import type { Task, TaskPriority, TaskStatus } from '@/types'

export interface TaskFormModalProps {
  open: boolean
  onClose: () => void
  projectId?: number
  defaultStatus?: TaskStatus
  task?: Task | null
}

interface FormState {
  project_id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignee_id: string
  due_date: string
  estimate_hours: string
  label_ids: number[]
}

const STATUS_OPTIONS = TASK_STATUSES.map((status) => ({ value: status, label: STATUS_META[status].label }))
const PRIORITY_OPTIONS = PRIORITIES.map((priority) => ({ value: priority, label: PRIORITY_META[priority].label }))

function buildState(task: Task | null | undefined, projectId?: number, defaultStatus?: TaskStatus): FormState {
  return {
    project_id: String(task?.project_id ?? projectId ?? ''),
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? defaultStatus ?? 'todo',
    priority: task?.priority ?? 'medium',
    assignee_id: task?.assignee ? String(task.assignee.id) : '',
    due_date: task?.due_date ? task.due_date.slice(0, 10) : '',
    estimate_hours: task?.estimate_hours != null ? String(task.estimate_hours) : '',
    label_ids: task?.labels.map((label) => label.id) ?? [],
  }
}

/** Create or edit a task. Project is fixed when `projectId` is supplied or when editing. */
export function TaskFormModal({ open, onClose, projectId, defaultStatus, task }: TaskFormModalProps) {
  const isEdit = Boolean(task)
  const [form, setForm] = useState<FormState>(() => buildState(task, projectId, defaultStatus))
  const [error, setError] = useState<string | null>(null)

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const showProjectSelect = !projectId
  const { data: projects } = useProjects()

  const activeProjectId = projectId ?? task?.project_id ?? (form.project_id ? Number(form.project_id) : undefined)
  const { data: members } = useProjectMembers(activeProjectId)
  const { data: labels } = useLabels(activeProjectId)

  useEffect(() => {
    if (!open) return
    setForm(buildState(task, projectId, defaultStatus))
    setError(null)
    // Re-seeding on identity changes of `task` would clobber typing mid-edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id, projectId, defaultStatus])

  /* Pick a sensible default project when creating from a global context. */
  useEffect(() => {
    if (!open || !showProjectSelect || isEdit || form.project_id) return
    const first = projects?.[0]
    if (first) setForm((current) => ({ ...current, project_id: String(first.id) }))
  }, [open, showProjectSelect, isEdit, form.project_id, projects])

  const projectOptions = useMemo(
    () => [
      { value: '', label: projects?.length ? 'Select a project…' : 'No projects yet' },
      ...(projects ?? []).map((project) => ({ value: String(project.id), label: `${project.key} · ${project.name}` })),
    ],
    [projects],
  )

  const assigneeOptions = useMemo(
    () => [
      { value: '', label: 'Unassigned' },
      ...(members ?? []).map((member) => ({ value: String(member.user.id), label: member.user.full_name })),
    ],
    [members],
  )

  const isPending = createTask.isPending || updateTask.isPending

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const changeProject = (value: string) =>
    setForm((current) => ({ ...current, project_id: value, assignee_id: '', label_ids: [] }))

  const toggleLabel = (labelId: number) =>
    setForm((current) => ({
      ...current,
      label_ids: current.label_ids.includes(labelId)
        ? current.label_ids.filter((id) => id !== labelId)
        : [...current.label_ids, labelId],
    }))

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = form.title.trim()
    if (!title) {
      setError('Give the task a title')
      return
    }
    if (!activeProjectId) {
      setError(null)
      toast.error('Pick a project for this task')
      return
    }
    setError(null)

    const estimate = form.estimate_hours.trim()
    const payload = {
      title,
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      assignee_id: form.assignee_id ? Number(form.assignee_id) : null,
      due_date: form.due_date || null,
      estimate_hours: estimate ? Number(estimate) : null,
      label_ids: form.label_ids,
    }

    try {
      if (task) {
        await updateTask.mutateAsync({ id: task.id, data: payload })
        toast.success('Task updated')
      } else {
        await createTask.mutateAsync({ project_id: activeProjectId, ...payload })
        toast.success('Task created')
      }
      onClose()
    } catch {
      /* the mutation hooks already surface the error toast */
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit task' : 'New task'}
      description={isEdit ? 'Update the details of this task.' : 'Capture the work — you can refine it later.'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" loading={isPending} disabled={!form.title.trim()}>
            {isEdit ? 'Save changes' : 'Create task'}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit} className="space-y-4">
        {showProjectSelect && (
          <Select
            label="Project"
            options={projectOptions}
            value={form.project_id}
            onChange={(event) => changeProject(event.target.value)}
            disabled={isEdit}
            hint={isEdit ? 'A task cannot be moved between projects.' : undefined}
          />
        )}

        <Input
          label="Title"
          value={form.title}
          onChange={(event) => set('title', event.target.value)}
          placeholder="e.g. Ship the onboarding flow"
          error={error}
          autoFocus
          maxLength={240}
        />

        <Textarea
          label="Description"
          value={form.description}
          onChange={(event) => set('description', event.target.value)}
          placeholder="Add context, acceptance criteria or links…"
          rows={4}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(event) => set('status', event.target.value as TaskStatus)}
          />
          <Select
            label="Priority"
            options={PRIORITY_OPTIONS}
            value={form.priority}
            onChange={(event) => set('priority', event.target.value as TaskPriority)}
          />
          <Select
            label="Assignee"
            options={assigneeOptions}
            value={form.assignee_id}
            onChange={(event) => set('assignee_id', event.target.value)}
            hint={activeProjectId && members && members.length === 0 ? 'Invite people to this project first.' : undefined}
          />
          <Input
            label="Due date"
            type="date"
            value={form.due_date}
            onChange={(event) => set('due_date', event.target.value)}
          />
          <Input
            label="Estimate (hours)"
            type="number"
            min={0}
            step={0.5}
            inputMode="decimal"
            value={form.estimate_hours}
            onChange={(event) => set('estimate_hours', event.target.value)}
            placeholder="0"
          />
        </div>

        {labels && labels.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted">Labels</p>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => {
                const checked = form.label_ids.includes(label.id)
                const tone = colorClasses(label.color)
                return (
                  <button
                    key={label.id}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => toggleLabel(label.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                      checked
                        ? cn(tone.soft, tone.text, tone.border)
                        : 'border-[var(--app-border)] text-muted hover:border-brand-500/40 hover:text-[var(--app-text)]',
                    )}
                  >
                    {checked ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <span className={cn('h-2 w-2 rounded-full', tone.bg)} aria-hidden="true" />
                    )}
                    {label.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
