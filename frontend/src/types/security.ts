export type LoginAttemptStatus =
  | 'all'
  | 'successful'
  | 'failed'

export type LoginAttemptSort =
  | 'newest'
  | 'oldest'
  | 'risk_high'
  | 'risk_low'

export interface SecurityAttemptFilters {
  page: number
  status: LoginAttemptStatus
  search: string
  country_code: string
  risk_min: string
  risk_max: string
  sort: LoginAttemptSort
  per_page: number
}

export interface SecurityCompany {
  id: number
  name: string
  code: string
}

export interface SecurityUser {
  id: number
  name: string
  email: string
}

export interface LoginAttemptLocation {
  country_code: string | null
  country: string | null
  region: string | null
  city: string | null
}

export interface LoginAttempt {
  id: number
  company: SecurityCompany | null
  user: SecurityUser | null
  email_masked: string
  ip_address: string
  user_agent: string | null
  was_successful: boolean
  failure_reason: string | null
  risk_score: number
  location: LoginAttemptLocation
  attempted_at: string | null
  created_at: string | null
}

export interface SecurityMetrics {
  total_attempts: number
  successful_attempts: number
  failed_attempts: number
  elevated_risk_attempts: number
  unique_ip_addresses: number
  success_rate: number
}

export interface CountryStatistic {
  country_code: string
  country: string | null
  attempts: number
}

export interface FailureReasonStatistic {
  failure_reason: string
  attempts: number
}

export interface SecurityOverview {
  period: {
    days: number
    from: string
    to: string
  }
  metrics: SecurityMetrics
  top_countries: CountryStatistic[]
  top_failure_reasons: FailureReasonStatistic[]
  recent_elevated_attempts: LoginAttempt[]
}

export interface PaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
}

export interface PaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

export interface PaginatedLoginAttempts {
  data: LoginAttempt[]
  links: PaginationLinks
  meta: PaginationMeta
}