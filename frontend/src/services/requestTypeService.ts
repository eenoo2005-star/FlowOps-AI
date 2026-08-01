import apiClient from '../api/client'
import type {
  PaginatedRequestTypes,
  RequestType,
  RequestTypeFilters,
  RequestTypePayload,
} from '../types/internalRequest'

function buildParameters(
  filters: RequestTypeFilters,
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

export const requestTypeService = {
  async list(
    filters: RequestTypeFilters,
  ): Promise<PaginatedRequestTypes> {
    const response =
      await apiClient.get<PaginatedRequestTypes>(
        '/request-types',
        {
          params: buildParameters(filters),
        },
      )

    return response.data
  },

  async create(
    payload: RequestTypePayload,
  ): Promise<RequestType> {
    const response = await apiClient.post<{
      data: RequestType
    }>('/request-types', payload)

    return response.data.data
  },

  async update(
    requestTypeId: number,
    payload: RequestTypePayload,
  ): Promise<RequestType> {
    const response = await apiClient.patch<{
      data: RequestType
    }>(`/request-types/${requestTypeId}`, payload)

    return response.data.data
  },

  async remove(requestTypeId: number): Promise<void> {
    await apiClient.delete(
      `/request-types/${requestTypeId}`,
    )
  },
}