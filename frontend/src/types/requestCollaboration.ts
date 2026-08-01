export interface RequestComment {
  id: number
  body: string
  author_name: string
  author_employee: {
    id: number
    full_name: string
    employee_number: string
  } | null
  can_delete: boolean
  created_at: string | null
  updated_at: string | null
}

export interface RequestAttachment {
  id: number
  original_name: string
  mime_type: string | null
  size: number
  sha256: string
  uploaded_by_name: string
  can_download: boolean
  can_delete: boolean
  created_at: string | null
}

export interface RequestAuditEvent {
  id: number
  event_type: string
  summary: string
  metadata: Record<string, unknown> | null
  actor_name: string | null
  ip_address: string | null
  occurred_at: string | null
}

export interface RequestCollaborationData {
  comments: RequestComment[]
  attachments: RequestAttachment[]
  audit_events: RequestAuditEvent[]
  permissions: {
    comment: boolean
    upload: boolean
    view_audit: boolean
  }
}