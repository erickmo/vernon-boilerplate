import { frappeClient } from '@/lib/frappe-client'

const M = 'vernon_tasks.task.page.my_work.my_work'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VtTask {
  name: string
  title: string
  project: string
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  pdca_phase: 'BACKLOG' | 'PLAN' | 'DO' | 'CHECK' | 'ACT' | 'DONE'
  kanban_status: string
  allocated_hours?: number
  deadline?: string
  estimated_hours?: number
  actual_hours?: number
}

export interface BlockedTask extends VtTask {
  blocker_name: string
  blocker_title: string
  blocker_assignee: string
  days_blocked: number
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const tasksService = {
  getMyDay: () =>
    frappeClient.method<VtTask[]>(`${M}.get_my_day`),

  getWhatToDoToday: () =>
    frappeClient.method<VtTask[]>(`${M}.get_what_to_do_today`),

  getMyBlockedTasks: () =>
    frappeClient.method<BlockedTask[]>(`${M}.get_my_blocked_tasks`),

  startTask: (task: string) =>
    frappeClient.method<{ status: string }>(`${M}.start_task`, { task }),

  submitForReview: (task: string) =>
    frappeClient.method<{ status: string }>(`${M}.submit_for_review`, { task }),
}
