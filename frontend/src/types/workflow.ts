export type WorkflowStatusFilter =
  | 'all'
  | 'active'
  | 'inactive'

export type WorkflowSort =
  | 'newest'
  | 'oldest'
  | 'name_asc'
  | 'name_desc'
  | 'code_asc'
  | 'code_desc'

export type ApproverType =
  | 'role'
  | 'employee'
  | 'requester_manager'
  | 'department_manager'

export type ApprovalMode =
  | 'any'
  | 'all'

export interface WorkflowApproverEmployee {
  id: number
  full_name: string
}

export interface WorkflowStep {
  id: number
  company_id: number
  workflow_definition_id: number
  name: string
  code: string
  description: string | null
  step_order: number
  approver_type: ApproverType
  approver_role: string | null
  approver_employee_id: number | null
  approver_employee: WorkflowApproverEmployee | null
  approval_mode: ApprovalMode
  required_approvals: number
  sla_hours: number | null
  can_reject: boolean
  is_final: boolean
  created_at: string | null
  updated_at: string | null
}

export interface WorkflowDefinition {
  id: number
  company_id: number
  name: string
  code: string
  description: string | null
  version: number
  is_active: boolean
  steps_count?: number
  steps?: WorkflowStep[]
  created_at: string | null
  updated_at: string | null
}

export interface WorkflowDefinitionPayload {
  name: string
  code: string
  description: string | null
  version: number
  is_active: boolean
}

export interface WorkflowStepPayload {
  name: string
  code: string
  description: string | null
  step_order: number
  approver_type: ApproverType
  approver_role: string | null
  approver_employee_id: number | null
  approval_mode: ApprovalMode
  required_approvals: number
  sla_hours: number | null
  can_reject: boolean
  is_final: boolean
}

export interface WorkflowFilters {
  page: number
  search: string
  status: WorkflowStatusFilter
  sort: WorkflowSort
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

export interface PaginatedWorkflowDefinitions {
  data: WorkflowDefinition[]
  links: PaginationLinks
  meta: PaginationMeta
}