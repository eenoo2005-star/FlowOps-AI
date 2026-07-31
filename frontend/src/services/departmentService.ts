import apiClient from '../api/client'
import type {
  Department,
  DepartmentFilters,
  DepartmentPayload,
  PaginatedDepartments,
} from '../types/department'

function buildParameters(
  filters: DepartmentFilters,
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

export const departmentService = {
  async list(
    filters: DepartmentFilters,
  ): Promise<PaginatedDepartments> {
    const response =
      await apiClient.get<PaginatedDepartments>(
        '/departments',
        {
          params: buildParameters(filters),
        },
      )

    return response.data
  },

  async create(
    payload: DepartmentPayload,
  ): Promise<Department> {
    const response = await apiClient.post<{
      data: Department
    }>('/departments', payload)

    return response.data.data
  },

  async update(
    departmentId: number,
    payload: DepartmentPayload,
  ): Promise<Department> {
    const response = await apiClient.patch<{
      data: Department
    }>(`/departments/${departmentId}`, payload)

    return response.data.data
  },

  async remove(departmentId: number): Promise<void> {
    await apiClient.delete(
      `/departments/${departmentId}`,
    )
  },
}