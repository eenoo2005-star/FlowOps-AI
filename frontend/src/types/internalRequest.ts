export type RequestPriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent'

export type InternalRequestStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'cancelled'

export type InternalRequestStatusFilter =
  | 'all'
  | InternalRequestStatus

export type RequestPriorityFilter =
  | 'all'
  | RequestPriority

export interface RequestTypeWorkflow {
  id: number
  name: string
  code: string
  version: number
  is_active: boolean
}

export interface RequestType {
  id: number
  company_id: number
  workflow_definition_id: number
  name: string
  code: string
  description: string | null
  instructions: string | null
  is_active: boolean
  workflow_definition: RequestTypeWorkflow | null
  created_at: string | null
  updated_at: string | null
}

export interface RequestTypePayload {
  workflow_definition_id: number
  name: string
  code: string
  description: string | null
  instructions: string | null
  is_active: boolean
}

export interface RequestTypeFilters {
  page: number
  search: string
  status: 'all' | 'active' | 'inactive'
  per_page: number
}

export interface RequesterEmployee {
  id: number
  full_name: string
  employee_number: string
}

export interface InternalRequestWorkflow {
  id: number
  name: string
  code: string
  version: number
}

export interface CurrentWorkflowStep {
  id: number
  name: string
  code: string
  step_order: number
}

export interface RuntimeTaskStep {
  id: number
  name: string
  code: string
  step_order: number
}

export interface RuntimeTaskEmployee {
  id: number
  full_name: string
  employee_number: string
}

export interface RuntimeTask {
  id: number
  workflow_instance_id: number
  workflow_step_id: number
  assigned_employee_id: number | null
  assigned_role: string | null
  status: string
  due_at: string | null
  acted_at: string | null
  decision_note: string | null
  workflow_step: RuntimeTaskStep | null
  assigned_employee: RuntimeTaskEmployee | null
}

export interface WorkflowInstance {
  id: number
  internal_request_id: number
  workflow_definition_id: number
  current_workflow_step_id: number | null
  status: string
  started_at: string | null
  completed_at: string | null
  tasks: RuntimeTask[]
}

export interface InternalRequest {
  id: number
  company_id: number
  request_type_id: number
  workflow_definition_id: number
  requester_employee_id: number
  current_workflow_step_id: number | null
  reference_number: string
  title: string
  description: string | null
  payload: Record<string, unknown> | null
  priority: RequestPriority
  status: InternalRequestStatus
  submitted_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  request_type: {
    id: number
    name: string
    code: string
  } | null
  requester_employee: RequesterEmployee | null
  workflow_definition: InternalRequestWorkflow | null
  current_workflow_step: CurrentWorkflowStep | null
  workflow_instance: WorkflowInstance | null
  created_at: string | null
  updated_at: string | null
}

export interface CreateInternalRequestPayload {
  request_type_id: number
  requester_employee_id: number | null
  title: string
  description: string | null
  payload: Record<string, unknown> | null
  priority: RequestPriority
}

export interface UpdateInternalRequestPayload {
  title: string
  description: string | null
  payload: Record<string, unknown> | null
  priority: RequestPriority
}

export interface InternalRequestFilters {
  page: number
  search: string
  status: InternalRequestStatusFilter
  priority: RequestPriorityFilter
  request_type_id: number | null
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

export interface PaginatedRequestTypes {
  data: RequestType[]
  links: PaginationLinks
  meta: PaginationMeta
}

export interface PaginatedInternalRequests {
  data: InternalRequest[]
  links: PaginationLinks
  meta: PaginationMeta
}