export type ApprovalTaskStatus = 'pending' | 'approved' | 'rejected'

export interface ApprovalTask {
  id: number
  status: ApprovalTaskStatus
  due_at: string | null
  can_approve: boolean
  can_reject: boolean
  assigned_role: string | null
  workflow_step: {
    id: number
    name: string
    code: string
    step_order: number
  } | null
  assigned_employee: {
    id: number
    full_name: string
    employee_number: string
  } | null
  internal_request: {
    id: number
    reference_number: string
    title: string
    description: string | null
    priority: string
    requester_employee: {
      id: number
      full_name: string
      employee_number: string
    } | null
  } | null
  decisions: {
    id: number
    decision: 'approved' | 'rejected'
    note: string | null
    acted_at: string | null
    acted_by_user: {
      id: number
      name: string
      email: string
    } | null
  }[]
}

export interface PaginatedApprovalTasks {
  data: ApprovalTask[]
  meta: {
    current_page: number
    last_page: number
    total: number
  }
}