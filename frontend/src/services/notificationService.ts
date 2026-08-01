import apiClient from '../api/client'
import type {
  AppNotification,
  NotificationStatusFilter,
  PaginatedNotifications,
} from '../types/notification'

export const notificationService = {
  async list(filters: {
    page: number
    status: NotificationStatusFilter
    per_page: number
  }): Promise<PaginatedNotifications> {
    const response =
      await apiClient.get<PaginatedNotifications>(
        '/notifications',
        {
          params: filters,
        },
      )

    return response.data
  },

  async unreadCount(): Promise<number> {
    const response = await apiClient.get<{
      data: {
        unread_count: number
      }
    }>('/notifications/unread-count')

    return response.data.data.unread_count
  },

  async markRead(
    notificationId: number,
  ): Promise<AppNotification> {
    const response = await apiClient.post<{
      data: AppNotification
    }>(
      `/notifications/${notificationId}/read`,
    )

    return response.data.data
  },

  async markAllRead(): Promise<void> {
    await apiClient.post(
      '/notifications/mark-all-read',
    )
  },
}