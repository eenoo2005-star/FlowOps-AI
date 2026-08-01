import apiClient from '../api/client'
import type {
  PaginatedWorkflowDefinitions,
  WorkflowDefinition,
  WorkflowDefinitionPayload,
  WorkflowFilters,
  WorkflowStep,
  WorkflowStepPayload,
} from '../types/workflow'

function buildParameters(
  filters: WorkflowFilters,
): Record<string, string | number> {
  const parameters: Record<string, string | number> = {
    page: filters.page,
    status: filters.status,
    sort: filters.sort,
    per_page: filters.per_page,
  }

  const search = filters.search.trim()

  if (search !== '') {
    parameters.search = search
  }

  return parameters
}

export const workflowService = {
  async list(
    filters: WorkflowFilters,
  ): Promise<PaginatedWorkflowDefinitions> {
    const response =
      await apiClient.get<PaginatedWorkflowDefinitions>(
        '/workflow-definitions',
        {
          params: buildParameters(filters),
        },
      )

    return response.data
  },

  async show(
    workflowDefinitionId: number,
  ): Promise<WorkflowDefinition> {
    const response = await apiClient.get<{
      data: WorkflowDefinition
    }>(
      `/workflow-definitions/${workflowDefinitionId}`,
    )

    return response.data.data
  },

  async create(
    payload: WorkflowDefinitionPayload,
  ): Promise<WorkflowDefinition> {
    const response = await apiClient.post<{
      data: WorkflowDefinition
    }>('/workflow-definitions', payload)

    return response.data.data
  },

  async update(
    workflowDefinitionId: number,
    payload: WorkflowDefinitionPayload,
  ): Promise<WorkflowDefinition> {
    const response = await apiClient.patch<{
      data: WorkflowDefinition
    }>(
      `/workflow-definitions/${workflowDefinitionId}`,
      payload,
    )

    return response.data.data
  },

  async remove(
    workflowDefinitionId: number,
  ): Promise<void> {
    await apiClient.delete(
      `/workflow-definitions/${workflowDefinitionId}`,
    )
  },

  async createStep(
    workflowDefinitionId: number,
    payload: WorkflowStepPayload,
  ): Promise<WorkflowStep> {
    const response = await apiClient.post<{
      data: WorkflowStep
    }>(
      `/workflow-definitions/${workflowDefinitionId}/steps`,
      payload,
    )

    return response.data.data
  },

  async updateStep(
    workflowDefinitionId: number,
    workflowStepId: number,
    payload: WorkflowStepPayload,
  ): Promise<WorkflowStep> {
    const response = await apiClient.patch<{
      data: WorkflowStep
    }>(
      `/workflow-definitions/${workflowDefinitionId}/steps/${workflowStepId}`,
      payload,
    )

    return response.data.data
  },

  async removeStep(
    workflowDefinitionId: number,
    workflowStepId: number,
  ): Promise<void> {
    await apiClient.delete(
      `/workflow-definitions/${workflowDefinitionId}/steps/${workflowStepId}`,
    )
  },
}