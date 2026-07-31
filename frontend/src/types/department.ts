export type DepartmentStatus =
  | 'all'
  | 'active'
  | 'inactive'

export type DepartmentSort =
  | 'newest'
  | 'oldest'
  | 'name_asc'
  | 'name_desc'
  | 'code_asc'
  | 'code_desc'

export interface Department {
  id: number
  company_id: number
  name: string
  code: string
  description: string | null
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

export interface DepartmentPayload {
  name: string
  code: string
  description: string | null
  is_active: boolean
}

export interface DepartmentFilters {
  page: number
  search: string
  status: DepartmentStatus
  sort: DepartmentSort
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

export interface PaginatedDepartments {
  data: Department[]
  links: PaginationLinks
  meta: PaginationMeta
}