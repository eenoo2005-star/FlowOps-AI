import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CheckSquare2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Users,
  Workflow,
  X,
  type LucideIcon,
} from 'lucide-react'
import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import NotificationBell from '../NotificationBell'
import { authService } from '../../services/authService'
import FlowBackground from './FlowBackground'
import WorkspaceSearch, {
  openWorkspaceSearch,
} from '../search/WorkspaceSearch'
import ThemeModeControl from './ThemeModeControl'

interface NavigationItem {
  label: string
  path: string
  icon: LucideIcon
  permission?: string
}

const navigation: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Analytics',
    path: '/analytics',
    icon: BarChart3,
    permission: 'reports.view',
  },
  {
    label: 'Notifications',
    path: '/notifications',
    icon: Bell,
    permission: 'notifications.view',
  },
  {
    label: 'Departments',
    path: '/departments',
    icon: Building2,
    permission: 'departments.view',
  },
  {
    label: 'Employees',
    path: '/employees',
    icon: Users,
    permission: 'employees.view',
  },
  {
    label: 'Workflows',
    path: '/workflows',
    icon: Workflow,
    permission: 'workflows.view',
  },
  {
    label: 'Request Types',
    path: '/request-types',
    icon: Boxes,
    permission: 'request-types.view',
  },
  {
    label: 'Requests',
    path: '/requests',
    icon: FileText,
    permission: 'requests.view',
  },
  {
    label: 'Approvals',
    path: '/approvals',
    icon: CheckSquare2,
    permission: 'workflow-tasks.view',
  },
  {
    label: 'Security',
    path: '/security',
    icon: ShieldCheck,
    permission: 'view security dashboard',
  },
]

const pageTitles: Record<string, string> = {
  '/dashboard': 'Operations Dashboard',
  '/analytics': 'Operational Analytics',
  '/notifications': 'Notifications',
  '/departments': 'Departments',
  '/employees': 'Employees',
  '/workflows': 'Workflows',
  '/request-types': 'Request Types',
  '/requests': 'Requests',
  '/approvals': 'Approvals',
  '/security': 'Security',
}

function WorkspaceExperience() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [mobileNavigationOpen, setMobileNavigationOpen] =
    useState(false)
  const [isLoggingOut, setIsLoggingOut] =
    useState(false)

  const userQuery = useQuery({
    queryKey: ['current-user'],
    queryFn: authService.getCurrentUser,
    retry: false,
  })

  useEffect(() => {
    setMobileNavigationOpen(false)
  }, [location.pathname])

  const availableNavigation = useMemo(() => {
    const permissions =
      userQuery.data?.permissions ?? []

    return navigation.filter(
      (item) =>
        !item.permission ||
        permissions.includes(item.permission),
    )
  }, [userQuery.data?.permissions])

  const currentTitle = useMemo(() => {
    if (
      location.pathname.startsWith(
        '/requests/',
      )
    ) {
      return 'Request Workspace'
    }

    return (
      pageTitles[location.pathname] ??
      'FlowOps Workspace'
    )
  }, [location.pathname])

  const isActive = (path: string) =>
    location.pathname === path ||
    (
      path !== '/dashboard' &&
      location.pathname.startsWith(
        `${path}/`,
      )
    )

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await authService.logout()
    } catch {
      // Local authentication state must still be cleared.
    } finally {
      localStorage.removeItem('flowops_token')
      localStorage.removeItem('flowops_user')
      sessionStorage.removeItem('flowops_token')
      sessionStorage.removeItem('flowops_user')

      queryClient.clear()

      navigate('/login', {
        replace: true,
      })
    }
  }

  if (userQuery.isError) {
    return <Navigate to="/login" replace />
  }

  if (userQuery.isPending) {
    return (
      <main className="workspace-bootstrap">
        <FlowBackground />

        <div className="workspace-bootstrap-card">
          <div className="workspace-bootstrap-spinner" />
          <p>Preparing your workspace...</p>
        </div>
      </main>
    )
  }

  const user = userQuery.data

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div
      className="workspace-experience"
      data-flowops-workspace
    >
      <FlowBackground />

      <WorkspaceSearch user={user} />

      <div className="workspace-shell">
        <aside className="workspace-sidebar">
          <div className="workspace-brand">
            <div className="workspace-brand-symbol">
              <Workflow size={22} />
            </div>

            <div>
              <strong>FlowOps AI</strong>
              <span>Enterprise Operations</span>
            </div>
          </div>

          <button
            type="button"
            className="workspace-sidebar-search"
            onClick={openWorkspaceSearch}
          >
            <Search size={17} />

            <span>Search workspace</span>

            <kbd>Ctrl K</kbd>
          </button>

          <nav className="workspace-navigation">
            <span className="workspace-navigation-label">
              Workspace
            </span>

            {availableNavigation.map(
              (item) => {
                const Icon = item.icon
                const active = isActive(
                  item.path,
                )

                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() =>
                      navigate(item.path)
                    }
                    className={`workspace-navigation-item ${
                      active
                        ? 'workspace-navigation-item-active'
                        : ''
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                )
              },
            )}
          </nav>

          <div className="workspace-sidebar-footer">
            <ThemeModeControl />

            <div className="workspace-user-card">
              <span className="workspace-user-avatar">
                {user.name
                  .charAt(0)
                  .toUpperCase()}
              </span>

              <span className="workspace-user-copy">
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="workspace-logout"
            >
              <LogOut size={16} />
              {isLoggingOut
                ? 'Signing out...'
                : 'Sign out'}
            </button>
          </div>
        </aside>

        <section className="workspace-content">
          <header className="workspace-topbar">
            <div className="workspace-mobile-brand">
              <button
                type="button"
                onClick={() =>
                  setMobileNavigationOpen(
                    true,
                  )
                }
                className="workspace-icon-button"
                aria-label="Open navigation"
              >
                <Menu size={19} />
              </button>

              <div className="workspace-brand-symbol">
                <Workflow size={19} />
              </div>
            </div>

            <div className="workspace-page-title">
              <span>Enterprise workspace</span>
              <strong>{currentTitle}</strong>
            </div>

            <div className="workspace-topbar-actions">
              <button
                type="button"
                onClick={openWorkspaceSearch}
                className="workspace-topbar-search"
              >
                <Search size={17} />
                <span>Search the workspace...</span>
                <kbd>Ctrl K</kbd>
              </button>

              <NotificationBell
                enabled={
                  user.permissions?.includes(
                    'notifications.view',
                  ) ?? false
                }
              />
            </div>
          </header>

          <div
            key={location.key}
            className="workspace-route-transition"
          >
            <Outlet />
          </div>
        </section>
      </div>

      {mobileNavigationOpen && (
        <div
          className="workspace-mobile-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.currentTarget ===
              event.target
            ) {
              setMobileNavigationOpen(false)
            }
          }}
        >
          <aside className="workspace-mobile-drawer">
            <div className="workspace-mobile-drawer-header">
              <div className="workspace-brand">
                <div className="workspace-brand-symbol">
                  <Workflow size={21} />
                </div>

                <div>
                  <strong>FlowOps AI</strong>
                  <span>Enterprise Operations</span>
                </div>
              </div>

              <button
                type="button"
                className="workspace-icon-button"
                onClick={() =>
                  setMobileNavigationOpen(
                    false,
                  )
                }
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>

            <button
              type="button"
              className="workspace-sidebar-search"
              onClick={() => {
                setMobileNavigationOpen(false)
                openWorkspaceSearch()
              }}
            >
              <Search size={17} />
              <span>Search workspace</span>
            </button>

            <nav className="workspace-navigation">
              {availableNavigation.map(
                (item) => {
                  const Icon = item.icon

                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() =>
                        navigate(item.path)
                      }
                      className={`workspace-navigation-item ${
                        isActive(item.path)
                          ? 'workspace-navigation-item-active'
                          : ''
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  )
                },
              )}
            </nav>

            <div className="workspace-sidebar-footer">
              <ThemeModeControl />

              <div className="workspace-user-card">
                <span className="workspace-user-avatar">
                  {user.name
                    .charAt(0)
                    .toUpperCase()}
                </span>

                <span className="workspace-user-copy">
                  <strong>{user.name}</strong>
                  <small>{user.email}</small>
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="workspace-logout"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default WorkspaceExperience
