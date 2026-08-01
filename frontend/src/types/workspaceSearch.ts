export type WorkspaceSearchKind =
  | 'navigation'
  | 'employee'
  | 'department'
  | 'workflow'
  | 'request_type'
  | 'request'
  | 'approval_task'

export interface WorkspaceSearchResult {
  kind: WorkspaceSearchKind
  group: string
  id: number | string
  title: string
  subtitle: string
  status: string
  url: string
}

export interface WorkspaceSearchResponse {
  query: string
  results: WorkspaceSearchResult[]
}
