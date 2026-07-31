export type EmploymentType =
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'intern'

export type EmployeeStatus =
  | 'active'
  | 'inactive'
  | 'on_leave'

export type EmployeeStatusFilter =
  | 'all'
  | EmployeeStatus

export type EmploymentTypeFilter =
  | 'all'
  | EmploymentType

export type EmployeeSort =
  | 'newest'
  | 'oldest'
  | 'name_asc'
  | 'name_desc'
  | 'employee_number_asc'
  | 'employee_number_desc'
  | 'hire_date_asc'
  | 'hire_date_desc'

export interface EmployeeDepartment {
  id: number
  name: string
  code: string
}

export interface EmployeeManager {
  id: number
  full_name: string
}

export interface EmployeeUser {
  id: number
  name: string
  email: string
}

export interface Employee {
  id: number
  company_id: number
  department_id: number | null
  user_id: number | null
  manager_id: number | null
  employee_number: string
  first_name: string
  last_name: string
  full_name: string
  job_title: string | null
  work_email: string | null
  phone: string | null
  hire_date: string | null
  employment_type: EmploymentType
  status: EmployeeStatus
  avatar: string | null
  notes: string | null
  department: EmployeeDepartment | null
  manager: EmployeeManager | null
  user: EmployeeUser | null
  created_at: string | null
  updated_at: string | null
}

export interface EmployeePayload {
  department_id: number | null
  manager_id: number | null
  employee_number: string
  first_name: string
  last_name: string
  job_title: string | null
  work_email: string | null
  phone: string | null
  hire_date: string | null
  employment_type: EmploymentType
  status: EmployeeStatus
  avatar: string | null
  notes: string | null
}

export interface EmployeeFilters {
  page: number
  search: string
  status: EmployeeStatusFilter
  employment_type: EmploymentTypeFilter
  department_id: number | null
  sort: EmployeeSort
  per_page: number
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

export interface PaginatedEmployees {
  data: Employee[]
  links: PaginationLinks
  meta: PaginationMeta
}