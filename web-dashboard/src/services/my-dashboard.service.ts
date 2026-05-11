import { frappeClient } from '@/lib/frappe-client'

const M = 'vernon_tasks.task.page.my_dashboard.my_dashboard'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmployeeStats {
  done_today: number
  done_week: number
  points_month: number
  blocked: number
}

export interface DailyCompletion {
  date: string
  count: number
}

export interface HoursSummary {
  actual_hours: number
  estimated_hours: number
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const myDashboardService = {
  getEmployeeStats: () =>
    frappeClient.method<EmployeeStats>(`${M}.get_employee_stats`),

  getDailyCompletions: () =>
    frappeClient.method<DailyCompletion[]>(`${M}.get_daily_completions`),

  getHoursSummary: () =>
    frappeClient.method<HoursSummary>(`${M}.get_hours_summary`),
}
