import apiClient from '../api/client'
import type {
  AdministrationAuditFilters,
  AdministrationAuditResponse,
  AdministrationOverview,
  AdministrationPermission,
  AdministrationRole,
} from '../types/administration'

function buildAuditParameters(
  filters: AdministrationAuditFilters,
): Record<string, string | number> {
  const parameters: Record<string, string | number> = {
    page: filters.page,
    sort: filters.sort,
    per_page: filters.per_page,
  }

  const search = filters.search.trim()

  if (search !== '') {
    parameters.search = search
  }

  if (filters.event_type !== '') {
    parameters.event_type = filters.event_type
  }

  return parameters
}

export const administrationService = {
  async getOverview(): Promise<AdministrationOverview> {
    const response = await apiClient.get<{
      data: AdministrationOverview
    }>('/administration/overview')

    return response.data.data
  },

  async getRoles(): Promise<AdministrationRole[]> {
    const response = await apiClient.get<{
      data: AdministrationRole[]
    }>('/administration/roles')

    return response.data.data
  },

  async getPermissions(): Promise<AdministrationPermission[]> {
    const response = await apiClient.get<{
      data: AdministrationPermission[]
    }>('/administration/permissions')

    return response.data.data
  },

  async updateRolePermissions(
    roleId: number,
    permissions: string[],
  ): Promise<AdministrationRole> {
    const response = await apiClient.patch<{
      message: string
      data: AdministrationRole
    }>(`/administration/roles/${roleId}/permissions`, {
      permissions,
    })

    return response.data.data
  },

  async getAuditEvents(
    filters: AdministrationAuditFilters,
  ): Promise<AdministrationAuditResponse> {
    const response = await apiClient.get<AdministrationAuditResponse>(
      '/administration/audit-events',
      {
        params: buildAuditParameters(filters),
      },
    )

    return response.data
  },
}
