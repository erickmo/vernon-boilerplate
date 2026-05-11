import { frappeClient } from '@/lib/frappe-client'

const MD = 'vernon_tasks.task.page.leader_dashboard.leader_dashboard'
const MR = 'vernon_tasks.task.page.leader_review.leader_review'

// ─── Leader Dashboard types ───────────────────────────────────────────────────

export interface LeaderStats {
  pending_review: number
  approval_rate: number
  team_points_month: number
}

export interface PhaseDistribution {
  phase: string
  count: number
}

export interface LeaderboardEntry {
  member: string
  points: number
}

export interface OverdueTask {
  task_name: string
  task_title: string
  member: string
  deadline: string
  phase: string
  days_overdue: number
}

// ─── Leader Review types ──────────────────────────────────────────────────────

export interface ReviewTask {
  name: string
  title: string
  project: string
  priority: string
  deadline: string
  assigned_to: string
  pdca_phase: string
  kanban_status: string
  estimated_hours: number
  review_scheduled_date: string | null
}

export interface TeamWorkloadEntry {
  assigned_to: string
  total_hours: number
  capacity: number
  overloaded: boolean
}

export interface TeamBlockedTask {
  name: string
  title: string
  project: string
  priority: string
  deadline: string
  assigned_to: string
  pdca_phase: string
  kanban_status: string
  blocker_name: string
  blocker_title: string
  blocker_assignee: string
  days_blocked: number
}

// ─── Services ─────────────────────────────────────────────────────────────────

export const leaderDashboardService = {
  getLeaderStats: () =>
    frappeClient.method<LeaderStats>(`${MD}.get_leader_stats`),

  getPhaseDistribution: () =>
    frappeClient.method<PhaseDistribution[]>(`${MD}.get_phase_distribution`),

  getTeamLeaderboard: () =>
    frappeClient.method<LeaderboardEntry[]>(`${MD}.get_team_leaderboard`),

  getOverdueTasks: () =>
    frappeClient.method<OverdueTask[]>(`${MD}.get_overdue_tasks`),
}

export const leaderReviewService = {
  getReviewQueue: () =>
    frappeClient.method<ReviewTask[]>(`${MR}.get_review_queue`),

  getTeamWorkload: () =>
    frappeClient.method<TeamWorkloadEntry[]>(`${MR}.get_team_workload`),

  getTeamBlockedTasks: () =>
    frappeClient.method<TeamBlockedTask[]>(`${MR}.get_team_blocked_tasks`),

  approveTask: (task_name: string) =>
    frappeClient.method<{ status: string }>(`${MR}.approve_task`, { task_name }),

  rejectTask: (task_name: string, reason: string) =>
    frappeClient.method<{ status: string }>(`${MR}.reject_task`, { task_name, reason }),
}
