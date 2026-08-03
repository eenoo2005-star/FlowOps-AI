import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CheckSquare2,
  Command,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  Workflow,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { workspaceSearchService } from '../../services/workspaceSearchService'
import type { AuthUser } from '../../types/auth'
import type {
  WorkspaceSearchKind,
  WorkspaceSearchResult,
} from '../../types/workspaceSearch'
import { OPEN_EVENT } from './workspaceSearchEvents'

interface WorkspaceSearchProps {
  user: AuthUser | undefined
}

interface NavigationResult
  extends WorkspaceSearchResult {
  permission?: string
  keywords: string
}

const navigationResults: NavigationResult[] = [
  {
    kind: 'navigation',
    group: 'Navigation',
    id: 'dashboard',
    title: 'Dashboard',
    subtitle: 'Company overview and operational status',
    status: 'page',
    url: '/dashboard',
    keywords: 'home overview operations',
  },
  {
    kind: 'navigation',
    group: 'Navigation',
    id: 'analytics',
    title: 'Analytics',
    subtitle: 'Request, approval and SLA performance',
    status: 'page',
    url: '/analytics',
    permission: 'reports.view',
    keywords: 'reports charts metrics performance',
  },
  {
    kind: 'navigation',
    group: 'Navigation',
    id: 'notifications',
    title: 'Notifications',
    subtitle: 'Alerts, reminders and escalations',
    status: 'page',
    url: '/notifications',
    permission: 'notifications.view',
    keywords: 'alerts reminders overdue',
  },
  {
    kind: 'navigation',
    group: 'Navigation',
    id: 'departments',
    title: 'Departments',
    subtitle: 'Organization structure',
    status: 'page',
    url: '/departments',
    permission: 'departments.view',
    keywords: 'organization teams units',
  },
  {
    kind: 'navigation',
    group: 'Navigation',
    id: 'employees',
    title: 'Employees',
    subtitle: 'People directory and employment records',
    status: 'page',
    url: '/employees',
    permission: 'employees.view',
    keywords: 'people staff directory',
  },
  {
    kind: 'navigation',
    group: 'Navigation',
    id: 'workflows',
    title: 'Workflows',
    subtitle: 'Approval definitions and workflow steps',
    status: 'page',
    url: '/workflows',
    permission: 'workflows.view',
    keywords: 'automation approval process',
  },
  {
    kind: 'navigation',
    group: 'Navigation',
    id: 'request-types',
    title: 'Request Types',
    subtitle: 'Request catalogue and workflow mapping',
    status: 'page',
    url: '/request-types',
    permission: 'request-types.view',
    keywords: 'forms catalogue templates',
  },
  {
    kind: 'navigation',
    group: 'Navigation',
    id: 'requests',
    title: 'Requests',
    subtitle: 'Create, submit and track requests',
    status: 'page',
    url: '/requests',
    permission: 'requests.view',
    keywords: 'submissions drafts cases',
  },
  {
    kind: 'navigation',
    group: 'Navigation',
    id: 'approvals',
    title: 'Approvals',
    subtitle: 'Assigned approval tasks and decisions',
    status: 'page',
    url: '/approvals',
    permission: 'workflow-tasks.view',
    keywords: 'inbox decisions pending',
  },
  {
    kind: 'navigation',
    group: 'Navigation',
    id: 'security',
    title: 'Security',
    subtitle: 'Authentication risk and login activity',
    status: 'page',
    url: '/security',
    permission: 'view security dashboard',
    keywords: 'login risk access audit',
  },
]

const kindIcons: Record<
  WorkspaceSearchKind,
  LucideIcon
> = {
  navigation: LayoutDashboard,
  employee: UserRound,
  department: Building2,
  workflow: Workflow,
  request_type: Boxes,
  request: FileText,
  approval_task: CheckSquare2,
}


function WorkspaceSearch({
  user,
}: WorkspaceSearchProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] =
    useState('')
  const [selectedIndex, setSelectedIndex] =
    useState(0)

  const permissions = useMemo(
    () => user?.permissions ?? [],
    [user?.permissions],
  )

  useEffect(() => {
    const openSearch = () => {
      setSelectedIndex(0)
      setOpen(true)
    }

    const keyboardShortcut = (
      event: globalThis.KeyboardEvent,
    ) => {
      const isShortcut =
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'k'

      if (isShortcut) {
        event.preventDefault()
        setSelectedIndex(0)
        setOpen(true)
      }

      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener(
      OPEN_EVENT,
      openSearch,
    )
    window.addEventListener(
      'keydown',
      keyboardShortcut,
    )

    return () => {
      window.removeEventListener(
        OPEN_EVENT,
        openSearch,
      )
      window.removeEventListener(
        'keydown',
        keyboardShortcut,
      )
    }
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    const frame = window.requestAnimationFrame(
      () => inputRef.current?.focus(),
    )

    return () =>
      window.cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 180)

    return () => window.clearTimeout(timer)
  }, [query])

  const remoteQuery = useQuery({
    queryKey: [
      'workspace-search',
      debouncedQuery,
    ],
    queryFn: () =>
      workspaceSearchService.search(
        debouncedQuery,
      ),
    enabled:
      open && debouncedQuery.length >= 2,
    staleTime: 15_000,
    retry: false,
  })

  const availableNavigation = useMemo(
    () =>
      navigationResults.filter(
        (item) =>
          !item.permission ||
          permissions.includes(item.permission),
      ),
    [permissions],
  )

  const navigationMatches = useMemo(() => {
    const normalized =
      debouncedQuery.toLowerCase()

    if (normalized === '') {
      return availableNavigation.slice(0, 6)
    }

    return availableNavigation.filter(
      (item) =>
        item.title
          .toLowerCase()
          .includes(normalized) ||
        item.subtitle
          .toLowerCase()
          .includes(normalized) ||
        item.keywords.includes(normalized),
    )
  }, [availableNavigation, debouncedQuery])

  const results = useMemo(
    () => [
      ...navigationMatches,
      ...(remoteQuery.data?.results ?? []),
    ],
    [
      navigationMatches,
      remoteQuery.data?.results,
    ],
  )

  const close = () => {
    setOpen(false)
    setQuery('')
    setDebouncedQuery('')
    setSelectedIndex(0)
  }

  const selectResult = (
    result: WorkspaceSearchResult,
  ) => {
    close()
    navigate(result.url)
  }

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()

      setSelectedIndex((current) =>
        Math.min(
          current + 1,
          Math.max(results.length - 1, 0),
        ),
      )
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()

      setSelectedIndex((current) =>
        Math.max(current - 1, 0),
      )
    }

    if (
      event.key === 'Enter' &&
      results[selectedIndex]
    ) {
      event.preventDefault()
      selectResult(results[selectedIndex])
    }
  }

  if (!open) {
    return null
  }

  return (
    <div
      className="workspace-search-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          close()
        }
      }}
    >
      <section
        className="workspace-search-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Search the FlowOps workspace"
      >
        <div className="workspace-search-input-row">
          <Search size={20} />

          <input
            ref={inputRef}
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Search people, requests, workflows and pages..."
            aria-label="Workspace search query"
          />

          {remoteQuery.isFetching && (
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
          )}

          <button
            type="button"
            onClick={close}
            className="workspace-search-close"
            aria-label="Close workspace search"
          >
            <X size={18} />
          </button>
        </div>

        <div className="workspace-search-hint">
          <span>
            <Command size={13} />
            Use ↑ ↓ to navigate and Enter to open
          </span>

          <kbd>Esc</kbd>
        </div>

        <div className="workspace-search-results">
          {debouncedQuery.length === 1 && (
            <div className="workspace-search-message">
              Enter one more character to search records.
            </div>
          )}

          {remoteQuery.isError && (
            <div className="workspace-search-message workspace-search-message-error">
              Workspace records could not be searched.
              Navigation remains available.
            </div>
          )}

          {results.length === 0 &&
            debouncedQuery.length >= 2 &&
            !remoteQuery.isFetching && (
              <div className="workspace-search-empty">
                <Search size={24} />

                <strong>No matching results</strong>

                <span>
                  Try a name, employee number,
                  request reference or workflow code.
                </span>
              </div>
            )}

          {results.map((result, index) => {
            const Icon =
              kindIcons[result.kind] ??
              Search

            return (
              <button
                key={`${result.kind}-${result.id}`}
                type="button"
                className={`workspace-search-result ${
                  selectedIndex === index
                    ? 'workspace-search-result-active'
                    : ''
                }`}
                onMouseEnter={() =>
                  setSelectedIndex(index)
                }
                onClick={() =>
                  selectResult(result)
                }
              >
                <span className="workspace-search-result-icon">
                  <Icon size={17} />
                </span>

                <span className="workspace-search-result-copy">
                  <span className="workspace-search-result-heading">
                    <strong>{result.title}</strong>
                    <small>{result.group}</small>
                  </span>

                  <span className="workspace-search-result-subtitle">
                    {result.subtitle}
                  </span>
                </span>

                <span className="workspace-search-result-status">
                  {result.status}
                </span>

                <ArrowRight
                  size={16}
                  className="workspace-search-result-arrow"
                />
              </button>
            )
          })}
        </div>

        <footer className="workspace-search-footer">
          <span>
            <Users size={14} />
            Permission-aware
          </span>

          <span>
            <ShieldCheck size={14} />
            Tenant isolated
          </span>

          <span>
            <BarChart3 size={14} />
            Live workspace data
          </span>

          <span className="workspace-search-footer-notification">
            <Bell size={14} />
            FlowOps AI
          </span>
        </footer>
      </section>
    </div>
  )
}

export default WorkspaceSearch
