export interface DashboardAnalyticsMetrics {
  requests_created: number
  requests_completed: number
  pending_requests: number
  approval_rate: number
  average_completion_hours: number | null
  pending_tasks: number
  overdue_tasks: number
  due_soon_tasks: number
  sla_compliance_rate: number
  average_task_action_hours: number | null
}

export interface DashboardStatusMetric {
  status: string
  count: number
}

export interface DashboardTrendPoint {
  date: string
  created: number
  completed: number
}

export interface DashboardPerformanceItem {
  id: number
  name: string
  code: string
  total: number
  approved: number
  rejected: number
  pending: number
  average_completion_hours: number | null
}

export interface DashboardSlaSummary {
  pending: number
  overdue: number
  due_soon: number
  completed_within_sla: number
  completed_late: number
  completed_without_deadline: number
}

export interface DashboardActivityItem {
  id: number
  event_type: string
  summary: string
  actor_name: string | null
  internal_request_id: number | null
  occurred_at: string | null
}

export interface DashboardAnalytics {
  period: {
    days: 7 | 30 | 90
    start_date: string
    end_date: string
  }
  metrics: DashboardAnalyticsMetrics
  request_statuses: DashboardStatusMetric[]
  request_trend: DashboardTrendPoint[]
  request_types: DashboardPerformanceItem[]
  departments: DashboardPerformanceItem[]
  sla: DashboardSlaSummary
  recent_activity: DashboardActivityItem[]
  generated_at: string
}