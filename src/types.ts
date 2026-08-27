export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived'
export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface User {
  id: number
  email: string
  full_name: string
  job_title?: string | null
  avatar_color?: string | null
  bio?: string | null
  created_at?: string | null
}

export interface Label {
  id: number
  project_id: number
  name: string
  color: string
}

export interface Member {
  id: number
  project_id: number
  role: MemberRole
  joined_at?: string | null
  user: User
}

export interface ProjectStats {
  total_tasks: number
  done_tasks: number
  in_progress_tasks: number
  overdue_tasks: number
  progress: number
  member_count: number
}

export interface ProjectSummary {
  id: number
  key: string
  name: string
  color: string
  status: ProjectStatus
}

export interface Project {
  id: number
  key: string
  name: string
  description?: string | null
  color: string
  status: ProjectStatus
  start_date?: string | null
  due_date?: string | null
  created_at?: string | null
  owner?: User | null
  members: Member[]
  stats: ProjectStats
}

export interface Subtask {
  id: number
  task_id: number
  title: string
  is_done: boolean
}

export interface Comment {
  id: number
  task_id: number
  body: string
  created_at?: string | null
  author?: User | null
}

export interface Task {
  id: number
  project_id: number
  title: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date?: string | null
  estimate_hours?: number | null
  position: number
  created_at?: string | null
  updated_at?: string | null
  completed_at?: string | null
  assignee?: User | null
  reporter?: User | null
  labels: Label[]
  project?: ProjectSummary | null
  comment_count: number
  subtask_count: number
  subtask_done_count: number
}

export interface TaskDetail extends Task {
  subtasks: Subtask[]
  comments: Comment[]
}

export interface Activity {
  id: number
  action: string
  summary: string
  meta?: Record<string, unknown> | null
  created_at?: string | null
  actor?: User | null
  project?: ProjectSummary | null
  task_id?: number | null
}

export interface CountByKey { key: string; label: string; count: number }
export interface TrendPoint { date: string; created: number; completed: number }
export interface WorkloadEntry { user: User; open_tasks: number; done_tasks: number }

export interface DashboardSummary {
  total_projects: number
  active_projects: number
  total_tasks: number
  my_open_tasks: number
  completed_tasks: number
  overdue_tasks: number
  due_soon_tasks: number
  completion_rate: number
  tasks_by_status: CountByKey[]
  tasks_by_priority: CountByKey[]
  trend: TrendPoint[]
  workload: WorkloadEntry[]
  upcoming: Task[]
  recent_activity: Activity[]
  projects: Project[]
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}
