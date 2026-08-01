import apiClient from '../api/client'
import type {
  CreateInternalRequestPayload,
  InternalRequest,
  InternalRequestFilters,
  PaginatedInternalRequests,
  UpdateInternalRequestPayload,
} from '../types/internalRequest'

function buildParameters(
  filters: InternalRequestFilters,
): Record<string, string | number> {
  const parameters: Record<string, string | number> = {
    page: filters.page,
    status: filters.status,
    priority: filters.priority,
    per_page: filters.per_page,
  }

  const search = filters.search.trim()

  if (search !== '') {
    parameters.search = search
  }

  if (filters.request_type_id !== null) {
    parameters.request_type_id =
      filters.request_type_id
  }

  return parameters
}

export const internalRequestService = {
  async list(
    filters: InternalRequestFilters,
  ): Promise<PaginatedInternalRequests> {
    const response =
      await apiClient.get<PaginatedInternalRequests>(
        '/internal-requests',
        {
          params: buildParameters(filters),
        },
      )

    return response.data
  },

  async show(
    requestId: number,
  ): Promise<InternalRequest> {
    const response = await apiClient.get<{
      data: InternalRequest
    }>(`/internal-requests/${requestId}`)

    return response.data.data
  },

  async create(
    payload: CreateInternalRequestPayload,
  ): Promise<InternalRequest> {
    const response = await apiClient.post<{
      data: InternalRequest
    }>('/internal-requests', payload)

    return response.data.data
  },

  async update(
    requestId: number,
    payload: UpdateInternalRequestPayload,
  ): Promise<InternalRequest> {
    const response = await apiClient.patch<{
      data: InternalRequest
    }>(`/internal-requests/${requestId}`, payload)

    return response.data.data
  },

  async remove(requestId: number): Promise<void> {
    await apiClient.delete(
      `/internal-requests/${requestId}`,
    )
  },

  async submit(
    requestId: number,
  ): Promise<InternalRequest> {
    const response = await apiClient.post<{
      data: InternalRequest
    }>(
      `/internal-requests/${requestId}/submit`,
    )

    return response.data.data
  },
}