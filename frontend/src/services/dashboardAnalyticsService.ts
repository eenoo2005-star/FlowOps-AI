import apiClient from '../api/client'
import type { DashboardAnalytics } from '../types/dashboardAnalytics'

export const dashboardAnalyticsService = {
  async getAnalytics(
    days: 7 | 30 | 90,
  ): Promise<DashboardAnalytics> {
    const response = await apiClient.get<{
      data: DashboardAnalytics
    }>('/dashboard/analytics', {
      params: {
        days,
      },
    })

    return response.data.data
  },
}