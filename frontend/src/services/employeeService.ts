import apiClient from '../api/client'
import type {
  Employee,
  EmployeeFilters,
  EmployeePayload,
  PaginatedEmployees,
} from '../types/employee'

function buildParameters(
  filters: EmployeeFilters,
): Record<string, string | number> {
  const parameters: Record<string, string | number> = {
    page: filters.page,
    status: filters.status,
    employment_type: filters.employment_type,
    sort: filters.sort,
    per_page: filters.per_page,
  }

  const search = filters.search.trim()

  if (search !== '') {
    parameters.search = search
  }

  if (filters.department_id !== null) {
    parameters.department_id = filters.department_id
  }

  return parameters
}

export const employeeService = {
  async list(
    filters: EmployeeFilters,
  ): Promise<PaginatedEmployees> {
    const response =
      await apiClient.get<PaginatedEmployees>(
        '/employees',
        {
          params: buildParameters(filters),
        },
      )

    return response.data
  },

  async create(
    payload: EmployeePayload,
  ): Promise<Employee> {
    const response = await apiClient.post<{
      data: Employee
    }>('/employees', payload)

    return response.data.data
  },

  async update(
    employeeId: number,
    payload: EmployeePayload,
  ): Promise<Employee> {
    const response = await apiClient.patch<{
      data: Employee
    }>(`/employees/${employeeId}`, payload)

    return response.data.data
  },

  async remove(employeeId: number): Promise<void> {
    await apiClient.delete(`/employees/${employeeId}`)
  },
}