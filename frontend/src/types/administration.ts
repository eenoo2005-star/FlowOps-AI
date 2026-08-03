export interface AdministrationReadinessItem {
  key: string
  label: string
  status: 'active' | 'queued'
  description: string
}

export interface AdministrationRecentAuditEvent {
  id: number
  event_type: string
  summary: string
  actor_name: string | null
  ip_address: string | null
  occurred_at: string | null
}

export interface AdministrationOverview {
  role_count: number
  permission_count: number
  user_count: number
  audit_events_7d: number
  recent_audit_events: AdministrationRecentAuditEvent[]
  readiness: AdministrationReadinessItem[]
}

export interface AdministrationRole {
  id: number
  name: string
  guard_name: string
  users_count: number
  permissions: string[]
  is_system_role: boolean
  editable: boolean
}

export interface AdministrationPermission {
  id: number
  name: string
  guard_name: string
  group: string
  description: string
}

export interface AdministrationAuditInternalRequest {
  id: number
  title: string
  status: string
  reference_number: string | null
}

export interface AdministrationAuditActorUser {
  id: number
  name: string
  email: string
}

export interface AdministrationAuditEvent {
  id: number
  event_type: string
  summary: string
  metadata: Record<string, unknown> | null
  actor_name: string | null
  ip_address: string | null
  user_agent: string | null
  occurred_at: string | null
  internal_request: AdministrationAuditInternalRequest | null
  actor_user: AdministrationAuditActorUser | null
}

export interface AdministrationAuditFilters {
  page: number
  search: string
  event_type: string
  sort: 'newest' | 'oldest'
  per_page: number
}

export interface AdministrationPaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
}

export interface AdministrationAuditResponse {
  data: AdministrationAuditEvent[]
  meta: AdministrationPaginationMeta
  event_types: string[]
}
