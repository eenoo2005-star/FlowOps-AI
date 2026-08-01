import apiClient from '../api/client'
import type {
  ApprovalTask,
  PaginatedApprovalTasks,
} from '../types/approvalTask'

interface ApprovalTaskListParameters {
  page: number
  search: string
  status: string
  per_page: number
}

function buildParameters(
  filters: ApprovalTaskListParameters,
): Record<string, string | number> {
  const parameters: Record<string, string | number> = {
    page: filters.page,
    status: filters.status,
    per_page: filters.per_page,
  }

  const search = filters.search.trim()

  if (search !== '') {
    parameters.search = search
  }

  return parameters
}

export const approvalTaskService = {
  async list(
    filters: ApprovalTaskListParameters,
  ): Promise<PaginatedApprovalTasks> {
    const response =
      await apiClient.get<PaginatedApprovalTasks>(
        '/workflow-tasks',
        {
          params: buildParameters(filters),
        },
      )

    return response.data
  },

  async show(id: number): Promise<ApprovalTask> {
    const response = await apiClient.get<{
      data: ApprovalTask
    }>(`/workflow-tasks/${id}`)

    return response.data.data
  },

  async approve(
    id: number,
    note: string | null,
  ): Promise<ApprovalTask> {
    const response = await apiClient.post<{
      data: ApprovalTask
    }>(
      `/workflow-tasks/${id}/approve`,
      { note },
    )

    return response.data.data
  },

  async reject(
    id: number,
    note: string,
  ): Promise<ApprovalTask> {
    const response = await apiClient.post<{
      data: ApprovalTask
    }>(
      `/workflow-tasks/${id}/reject`,
      { note },
    )

    return response.data.data
  },
}