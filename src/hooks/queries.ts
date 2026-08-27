import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, apiError } from '@/lib/api'
import { USER_UPDATED_EVENT } from '@/store/auth'
import type {
  Activity,
  Comment,
  DashboardSummary,
  Label,
  Member,
  MemberRole,
  Project,
  ProjectStatus,
  Subtask,
  Task,
  TaskDetail,
  TaskPriority,
  TaskStatus,
  User,
} from '@/types'

/* ------------------------------------------------------------------ payloads */

export interface ProjectCreate {
  name: string
  description?: string | null
  color?: string
  status?: ProjectStatus
  start_date?: string | null
  due_date?: string | null
  key?: string | null
  member_ids?: number[]
}

export interface ProjectUpdate {
  name?: string
  description?: string | null
  color?: string
  status?: ProjectStatus
  start_date?: string | null
  due_date?: string | null
}

export interface TaskCreate {
  project_id: number
  title: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  assignee_id?: number | null
  due_date?: string | null
  estimate_hours?: number | null
  label_ids?: number[]
}

export interface TaskUpdate {
  title?: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  assignee_id?: number | null
  due_date?: string | null
  estimate_hours?: number | null
  label_ids?: number[]
}

export interface SubtaskUpdate {
  title?: string
  is_done?: boolean
}

export interface UserUpdate {
  full_name?: string
  job_title?: string | null
  avatar_color?: string | null
  bio?: string | null
}

export interface LabelCreate {
  name: string
  color: string
}

export interface MemberCreate {
  user_id: number
  role: MemberRole
}

export interface ProjectQuery {
  q?: string
  status?: string
}

export interface ActivityQuery {
  project_id?: number
  limit?: number
}

export type TaskQuery = {
  project_id?: number
  status?: TaskStatus[]
  priority?: TaskPriority[]
  assignee_id?: number
  label_id?: number
  q?: string
  due?: 'overdue' | 'today' | 'week'
  mine?: boolean
  sort?: string
}

/* -------------------------------------------------------------- query params */

/** Repeated params for arrays (status=todo&status=done); empty values dropped. */
function serializeParams(params: Record<string, unknown>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null || item === '') continue
        search.append(key, String(item))
      }
      continue
    }
    if (typeof value === 'boolean') {
      if (value) search.append(key, 'true')
      continue
    }
    search.append(key, String(value))
  }
  return search.toString()
}

async function getList<T>(url: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const { data } = await api.get<T[]>(url, { params, paramsSerializer: { serialize: serializeParams } })
  return data
}

/** Drop empty filters so query keys stay stable and requests stay clean. */
function normalizeTaskQuery(filters: TaskQuery): TaskQuery {
  const out: TaskQuery = {}
  if (filters.project_id) out.project_id = filters.project_id
  if (filters.status && filters.status.length) out.status = [...filters.status]
  if (filters.priority && filters.priority.length) out.priority = [...filters.priority]
  if (filters.assignee_id) out.assignee_id = filters.assignee_id
  if (filters.label_id) out.label_id = filters.label_id
  const q = filters.q?.trim()
  if (q) out.q = q
  if (filters.due) out.due = filters.due
  if (filters.mine) out.mine = true
  if (filters.sort) out.sort = filters.sort
  return out
}

/* ---------------------------------------------------------------- query keys */

export const queryKeys = {
  me: ['me'] as const,
  usersRoot: ['users'] as const,
  users: (q?: string) => ['users', q?.trim() ?? ''] as const,
  projectsRoot: ['projects'] as const,
  projects: (params?: ProjectQuery) =>
    ['projects', { q: params?.q?.trim() ?? '', status: params?.status ?? '' }] as const,
  projectRoot: ['project'] as const,
  project: (id?: number) => ['project', id ?? null] as const,
  members: (projectId?: number) => ['project', projectId ?? null, 'members'] as const,
  labels: (projectId?: number) => ['project', projectId ?? null, 'labels'] as const,
  tasksRoot: ['tasks'] as const,
  tasks: (filters?: TaskQuery) => ['tasks', normalizeTaskQuery(filters ?? {})] as const,
  taskRoot: ['task'] as const,
  task: (id?: number | null) => ['task', id ?? null] as const,
  comments: (taskId?: number | null) => ['task', taskId ?? null, 'comments'] as const,
  dashboard: ['dashboard'] as const,
  activityRoot: ['activity'] as const,
  activity: (params?: ActivityQuery) => ['activity', params?.project_id ?? null, params?.limit ?? 30] as const,
}

function fail(message: string) {
  return (error: unknown) => toast.error(apiError(error, message))
}

/** Everything that can go stale when a task or project is written to. */
function invalidateBoards(qc: QueryClient, projectId?: number | null) {
  void qc.invalidateQueries({ queryKey: queryKeys.tasksRoot })
  void qc.invalidateQueries({ queryKey: queryKeys.dashboard })
  void qc.invalidateQueries({ queryKey: queryKeys.activityRoot })
  void qc.invalidateQueries({ queryKey: queryKeys.projectsRoot })
  if (projectId) void qc.invalidateQueries({ queryKey: queryKeys.project(projectId) })
}

/* --------------------------------------------------------------------- users */

export function useUsers(q?: string) {
  return useQuery({
    queryKey: queryKeys.users(q),
    queryFn: () => getList<User>('/users', { q: q?.trim() }),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: UserUpdate) => (await api.patch<User>('/auth/me', data)).data,
    onSuccess: (user) => {
      qc.setQueryData(queryKeys.me, user)
      window.dispatchEvent(new CustomEvent<User>(USER_UPDATED_EVENT, { detail: user }))
      void qc.invalidateQueries({ queryKey: queryKeys.usersRoot })
      void qc.invalidateQueries({ queryKey: queryKeys.projectsRoot })
      void qc.invalidateQueries({ queryKey: queryKeys.projectRoot })
    },
    onError: fail('Could not save your profile'),
  })
}

/* ------------------------------------------------------------------ projects */

export function useProjects(params?: ProjectQuery) {
  return useQuery({
    queryKey: queryKeys.projects(params),
    queryFn: () => getList<Project>('/projects', { q: params?.q?.trim(), status: params?.status }),
  })
}

export function useProject(id?: number) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: async () => (await api.get<Project>(`/projects/${id}`)).data,
    enabled: Boolean(id),
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: ProjectCreate) => (await api.post<Project>('/projects', data)).data,
    onSuccess: (project) => {
      qc.setQueryData(queryKeys.project(project.id), project)
      void qc.invalidateQueries({ queryKey: queryKeys.projectsRoot })
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard })
      void qc.invalidateQueries({ queryKey: queryKeys.activityRoot })
    },
    onError: fail('Could not create the project'),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProjectUpdate }) =>
      (await api.patch<Project>(`/projects/${id}`, data)).data,
    onSuccess: (project) => {
      qc.setQueryData(queryKeys.project(project.id), project)
      void qc.invalidateQueries({ queryKey: queryKeys.projectsRoot })
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard })
      void qc.invalidateQueries({ queryKey: queryKeys.activityRoot })
    },
    onError: fail('Could not update the project'),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/projects/${id}`)
      return id
    },
    onSuccess: (id) => {
      qc.removeQueries({ queryKey: queryKeys.project(id) })
      void qc.invalidateQueries({ queryKey: queryKeys.projectsRoot })
      void qc.invalidateQueries({ queryKey: queryKeys.tasksRoot })
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard })
      void qc.invalidateQueries({ queryKey: queryKeys.activityRoot })
    },
    onError: fail('Could not delete the project'),
  })
}

/* ------------------------------------------------------------------- members */

export function useProjectMembers(projectId?: number) {
  return useQuery({
    queryKey: queryKeys.members(projectId),
    queryFn: () => getList<Member>(`/projects/${projectId}/members`),
    enabled: Boolean(projectId),
  })
}

export function useAddMember(projectId?: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: MemberCreate) => (await api.post<Member>(`/projects/${projectId}/members`, data)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.members(projectId) })
      void qc.invalidateQueries({ queryKey: queryKeys.project(projectId) })
      void qc.invalidateQueries({ queryKey: queryKeys.projectsRoot })
      void qc.invalidateQueries({ queryKey: queryKeys.activityRoot })
    },
    onError: fail('Could not add that member'),
  })
}

export function useUpdateMember(projectId?: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: MemberRole }) =>
      (await api.patch<Member>(`/projects/${projectId}/members/${userId}`, { role })).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.members(projectId) })
      void qc.invalidateQueries({ queryKey: queryKeys.project(projectId) })
      void qc.invalidateQueries({ queryKey: queryKeys.projectsRoot })
    },
    onError: fail('Could not change that role'),
  })
}

export function useRemoveMember(projectId?: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: number) => {
      await api.delete(`/projects/${projectId}/members/${userId}`)
      return userId
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.members(projectId) })
      void qc.invalidateQueries({ queryKey: queryKeys.project(projectId) })
      void qc.invalidateQueries({ queryKey: queryKeys.projectsRoot })
      void qc.invalidateQueries({ queryKey: queryKeys.tasksRoot })
    },
    onError: fail('Could not remove that member'),
  })
}

/* -------------------------------------------------------------------- labels */

export function useLabels(projectId?: number) {
  return useQuery({
    queryKey: queryKeys.labels(projectId),
    queryFn: () => getList<Label>(`/projects/${projectId}/labels`),
    enabled: Boolean(projectId),
  })
}

export function useCreateLabel(projectId?: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: LabelCreate) => (await api.post<Label>(`/projects/${projectId}/labels`, data)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.labels(projectId) })
    },
    onError: fail('Could not create the label'),
  })
}

export function useDeleteLabel(projectId?: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (labelId: number) => {
      await api.delete(`/labels/${labelId}`)
      return labelId
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.labels(projectId) })
      void qc.invalidateQueries({ queryKey: queryKeys.tasksRoot })
      void qc.invalidateQueries({ queryKey: queryKeys.taskRoot })
    },
    onError: fail('Could not delete the label'),
  })
}

/* --------------------------------------------------------------------- tasks */

export function useTasks(filters: TaskQuery) {
  const params = normalizeTaskQuery(filters)
  return useQuery({
    queryKey: queryKeys.tasks(params),
    queryFn: () => getList<Task>('/tasks', params as Record<string, unknown>),
  })
}

export function useTask(taskId?: number | null) {
  return useQuery({
    queryKey: queryKeys.task(taskId),
    queryFn: async () => (await api.get<TaskDetail>(`/tasks/${taskId}`)).data,
    enabled: Boolean(taskId),
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: TaskCreate) => (await api.post<Task>('/tasks', data)).data,
    onSuccess: (task) => invalidateBoards(qc, task.project_id),
    onError: fail('Could not create the task'),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TaskUpdate }) =>
      (await api.patch<Task>(`/tasks/${id}`, data)).data,
    onSuccess: (task) => {
      void qc.invalidateQueries({ queryKey: queryKeys.task(task.id) })
      invalidateBoards(qc, task.project_id)
    },
    onError: fail('Could not update the task'),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/tasks/${id}`)
      return id
    },
    onSuccess: (id) => {
      qc.removeQueries({ queryKey: queryKeys.task(id) })
      invalidateBoards(qc)
    },
    onError: fail('Could not delete the task'),
  })
}

interface MoveTaskVars {
  id: number
  status: TaskStatus
  position?: number | null
}

interface MoveTaskContext {
  lists: [readonly unknown[], Task[] | undefined][]
  detail: TaskDetail | undefined
}

export function useMoveTask() {
  const qc = useQueryClient()
  return useMutation<Task, unknown, MoveTaskVars, MoveTaskContext>({
    mutationFn: async ({ id, status, position }) =>
      (await api.post<Task>(`/tasks/${id}/move`, { status, position: position ?? null })).data,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: queryKeys.tasksRoot })
      const lists = qc.getQueriesData<Task[]>({ queryKey: queryKeys.tasksRoot })
      const detail = qc.getQueryData<TaskDetail>(queryKeys.task(vars.id))

      for (const [key, data] of lists) {
        if (!data) continue
        let next = data.map((task) =>
          task.id === vars.id ? { ...task, status: vars.status, position: vars.position ?? task.position } : task,
        )
        const params = key[1] as TaskQuery | undefined
        if (typeof vars.position === 'number' && (!params?.sort || params.sort === 'position')) {
          next = [...next].sort((a, b) => a.position - b.position)
        }
        qc.setQueryData(key, next)
      }
      if (detail) {
        qc.setQueryData<TaskDetail>(queryKeys.task(vars.id), {
          ...detail,
          status: vars.status,
          position: vars.position ?? detail.position,
        })
      }
      return { lists, detail }
    },
    onError: (error, vars, context) => {
      for (const [key, data] of context?.lists ?? []) qc.setQueryData(key, data)
      if (context?.detail) qc.setQueryData(queryKeys.task(vars.id), context.detail)
      toast.error(apiError(error, 'Could not move the task'))
    },
    onSettled: (task, _error, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.task(vars.id) })
      invalidateBoards(qc, task?.project_id)
    },
  })
}

/* ------------------------------------------------------------------ subtasks */

export function useAddSubtask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, title }: { taskId: number; title: string }) =>
      (await api.post<Subtask>(`/tasks/${taskId}/subtasks`, { title })).data,
    onSuccess: (_subtask, { taskId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.task(taskId) })
      void qc.invalidateQueries({ queryKey: queryKeys.tasksRoot })
    },
    onError: fail('Could not add the subtask'),
  })
}

export function useUpdateSubtask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; taskId: number; data: SubtaskUpdate }) =>
      (await api.patch<Subtask>(`/subtasks/${id}`, data)).data,
    onSuccess: (_subtask, { taskId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.task(taskId) })
      void qc.invalidateQueries({ queryKey: queryKeys.tasksRoot })
    },
    onError: fail('Could not update the subtask'),
  })
}

export function useDeleteSubtask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: number; taskId: number }) => {
      await api.delete(`/subtasks/${id}`)
      return id
    },
    onSuccess: (_id, { taskId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.task(taskId) })
      void qc.invalidateQueries({ queryKey: queryKeys.tasksRoot })
    },
    onError: fail('Could not delete the subtask'),
  })
}

/* ------------------------------------------------------------------ comments */

export function useComments(taskId?: number | null) {
  return useQuery({
    queryKey: queryKeys.comments(taskId),
    queryFn: () => getList<Comment>(`/tasks/${taskId}/comments`),
    enabled: Boolean(taskId),
  })
}

export function useAddComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, body }: { taskId: number; body: string }) =>
      (await api.post<Comment>(`/tasks/${taskId}/comments`, { body })).data,
    onSuccess: (_comment, { taskId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.task(taskId) })
      void qc.invalidateQueries({ queryKey: queryKeys.tasksRoot })
      void qc.invalidateQueries({ queryKey: queryKeys.activityRoot })
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
    onError: fail('Could not post the comment'),
  })
}

export function useDeleteComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: number; taskId: number }) => {
      await api.delete(`/comments/${id}`)
      return id
    },
    onSuccess: (_id, { taskId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.task(taskId) })
      void qc.invalidateQueries({ queryKey: queryKeys.tasksRoot })
    },
    onError: fail('Could not delete the comment'),
  })
}

/* ------------------------------------------------------- dashboard + activity */

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => (await api.get<DashboardSummary>('/dashboard/summary')).data,
  })
}

export function useActivity(params?: ActivityQuery) {
  return useQuery({
    queryKey: queryKeys.activity(params),
    queryFn: () => getList<Activity>('/activity', { project_id: params?.project_id, limit: params?.limit ?? 30 }),
  })
}
