import apiClient from '../api/client'
import type { WorkspaceSearchResponse } from '../types/workspaceSearch'

export const workspaceSearchService = {
  async search(
    query: string,
    limit = 6,
  ): Promise<WorkspaceSearchResponse> {
    const response = await apiClient.get<{
      data: WorkspaceSearchResponse
    }>('/workspace-search', {
      params: {
        q: query,
        limit,
      },
    })

    return response.data.data
  },
}
