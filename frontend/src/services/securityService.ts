import apiClient from '../api/client'
import type {
  PaginatedLoginAttempts,
  SecurityAttemptFilters,
  SecurityOverview,
} from '../types/security'

function buildAttemptParameters(
  filters: SecurityAttemptFilters,
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

  const countryCode = filters.country_code
    .trim()
    .toUpperCase()

  if (countryCode !== '') {
    parameters.country_code = countryCode
  }

  if (filters.risk_min !== '') {
    parameters.risk_min = filters.risk_min
  }

  if (filters.risk_max !== '') {
    parameters.risk_max = filters.risk_max
  }

  return parameters
}

export const securityService = {
  async getOverview(days: number): Promise<SecurityOverview> {
    const response = await apiClient.get<{
      data: SecurityOverview
    }>('/security/overview', {
      params: {
        days,
      },
    })

    return response.data.data
  },

  async getLoginAttempts(
    filters: SecurityAttemptFilters,
  ): Promise<PaginatedLoginAttempts> {
    const response =
      await apiClient.get<PaginatedLoginAttempts>(
        '/security/login-attempts',
        {
          params: buildAttemptParameters(filters),
        },
      )

    return response.data
  },
}