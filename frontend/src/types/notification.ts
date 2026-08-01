export type NotificationStatusFilter =
  | 'all'
  | 'unread'
  | 'read'

export interface AppNotification {
  id: number
  type: string
  title: string
  message: string
  action_url: string | null
  data: Record<string, unknown> | null
  is_read: boolean
  read_at: string | null
  created_at: string | null
}

export interface PaginatedNotifications {
  data: AppNotification[]
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    from: number | null
    last_page: number
    per_page: number
    to: number | null
    total: number
  }
}