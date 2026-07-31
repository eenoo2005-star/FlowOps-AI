import apiClient from '../api/client'
import type { DashboardSummary } from '../types/dashboard'

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const response = await apiClient.get<{
      data: DashboardSummary
    }>('/dashboard/summary')

    return response.data.data
  },
}