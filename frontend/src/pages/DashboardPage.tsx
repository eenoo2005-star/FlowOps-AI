import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileText,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  Settings2,
  Sparkles,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import NotificationBell from '../components/NotificationBell'
import { openWorkspaceSearch } from '../components/search/workspaceSearchEvents'
import { authService } from '../services/authService'
import { dashboardService } from '../services/dashboardService'

interface NavigationItem {
  label: string
  icon: LucideIcon
  active: boolean
  path: string
  permission?: string
}

interface DashboardCard {
  title: string
  value?: string
  description: string
  icon: LucideIcon
  path: string
  permission?: string
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    active: true,
    path: '/dashboard',
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    active: false,
    path: '/analytics',
    permission: 'reports.view',
  },
  {
    label: 'Notifications',
    icon: Bell,
    active: false,
    path: '/notifications',
    permission: 'notifications.view',
  },
  {
    label: 'Departments',
    icon: Building2,
    active: false,
    path: '/departments',
    permission: 'departments.view',
  },
  {
    label: 'Employees',
    icon: Users,
    active: false,
    path: '/employees',
    permission: 'employees.view',
  },
  {
    label: 'Workflows',
    icon: Workflow,
    active: false,
    path: '/workflows',
    permission: 'workflows.view',
  },
  {
    label: 'Request Types',
    icon: Boxes,
    active: false,
    path: '/request-types',
    permission: 'request-types.view',
  },
  {
    label: 'Requests',
    icon: FileText,
    active: false,
    path: '/requests',
    permission: 'requests.view',
  },
  {
    label: 'Approvals',
    icon: ClipboardCheck,
    active: false,
    path: '/approvals',
    permission: 'workflow-tasks.view',
  },
  {
    label: 'Security',
    icon: ShieldCheck,
    active: false,
    path: '/security',
    permission: 'view security dashboard',
  },
  {
    label: 'Administration',
    icon: Settings2,
    active: false,
    path: '/administration',
    permission: 'administration.view',
  },
]

function DashboardPage() {
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const {
    data: user,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['current-user'],
    queryFn: authService.getCurrentUser,
    retry: false,
  })

  const {
    data: dashboardSummary,
    isPending: isSummaryPending,
    isError: isSummaryError,
  } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardService.getSummary,
    retry: false,
  })

  const canAccess = (permission?: string): boolean =>
    !permission ||
    (user?.permissions?.includes(permission) ?? false)

  const summaryValue = (
    value: number | undefined,
  ): string => {
    if (isSummaryPending) {
      return '...'
    }

    if (isSummaryError || value === undefined) {
      return '—'
    }

    return value.toLocaleString()
  }

  const statisticCards: DashboardCard[] = [
    {
      title: 'Employees',
      value: summaryValue(
        dashboardSummary?.employees_total,
      ),
      description: 'Company employee records',
      icon: Users,
      path: '/employees',
      permission: 'employees.view',
    },
    {
      title: 'Departments',
      value: summaryValue(
        dashboardSummary?.departments_total,
      ),
      description: 'Organization structure',
      icon: Building2,
      path: '/departments',
      permission: 'departments.view',
    },
    {
      title: 'Failed Logins',
      value: summaryValue(
        dashboardSummary?.failed_logins_24h,
      ),
      description: 'During the last 24 hours',
      icon: Activity,
      path: '/security',
      permission: 'view security dashboard',
    },
    {
      title: 'Elevated Risk',
      value: summaryValue(
        dashboardSummary?.elevated_risk_attempts_24h,
      ),
      description: 'Risk score 50 or higher',
      icon: ShieldCheck,
      path: '/security',
      permission: 'view security dashboard',
    },
  ]

  const workspaceCards: DashboardCard[] = [
    {
      title: 'Requests',
      description: 'Create, submit and track internal requests',
      icon: FileText,
      path: '/requests',
      permission: 'requests.view',
    },
    {
      title: 'Approvals',
      description: 'Review pending workflow tasks',
      icon: ClipboardCheck,
      path: '/approvals',
      permission: 'workflow-tasks.view',
    },
    {
      title: 'Workflows',
      description: 'Design enterprise approval processes',
      icon: Workflow,
      path: '/workflows',
      permission: 'workflows.view',
    },
    {
      title: 'Request Types',
      description: 'Manage the request catalog',
      icon: Boxes,
      path: '/request-types',
      permission: 'request-types.view',
    },
    {
      title: 'Analytics',
      description: 'Inspect SLA, approval and department KPIs',
      icon: BarChart3,
      path: '/analytics',
      permission: 'reports.view',
    },
    {
      title: 'Notifications',
      description: 'Open assignments, SLA alerts and escalations',
      icon: Bell,
      path: '/notifications',
      permission: 'notifications.view',
    },
    {
      title: 'Security',
      description: 'Review authentication and risk signals',
      icon: ShieldCheck,
      path: '/security',
      permission: 'view security dashboard',
    },
    {
      title: 'Administration',
      description: 'Manage roles, permissions, audit logs and settings',
      icon: Settings2,
      path: '/administration',
      permission: 'administration.view',
    },
  ]

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await authService.logout()
    } catch {
      // The local session must still be cleared if the API is unavailable.
    } finally {
      localStorage.removeItem('flowops_token')
      localStorage.removeItem('flowops_user')
      sessionStorage.removeItem('flowops_token')
      sessionStorage.removeItem('flowops_user')

      navigate('/login', { replace: true })
    }
  }

  const renderCard = (card: DashboardCard) => {
    const Icon = card.icon
    const canOpen = canAccess(card.permission)

    return (
      <button
        key={card.title}
        type="button"
        disabled={!canOpen}
        onClick={() => navigate(card.path)}
        aria-label={`Open ${card.title}`}
        className="group rounded-2xl border border-slate-800/80 bg-slate-950/50 p-5 text-left transition hover:-translate-y-0.5 hover:border-sky-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
      >
        <div className="flex items-start justify-between">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-sky-400/10 bg-sky-500/10 text-sky-300">
            <Icon size={18} />
          </div>

          <ChevronRight
            size={16}
            className="text-slate-700 transition group-hover:translate-x-0.5 group-hover:text-sky-300"
          />
        </div>

        {card.value && (
          <p className="mt-6 text-2xl font-bold">
            {card.value}
          </p>
        )}

        <p className={card.value ? 'mt-1 text-sm font-medium text-slate-300' : 'mt-6 text-sm font-medium text-slate-300'}>
          {card.title}
        </p>

        <p className="mt-2 text-xs leading-5 text-slate-600">
          {card.description}
        </p>
      </button>
    )
  }

  if (isError) {
    return <Navigate to="/login" replace />
  }

  if (isPending) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-sky-400/30 border-t-sky-400" />

          <p className="text-sm text-slate-400">
            Loading your secure workspace...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050b18] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="legacy-dashboard-sidebar hidden w-72 flex-col border-r border-slate-800/80 bg-slate-950/75 p-5 backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-3 border-b border-slate-800/70 px-2 pb-6">
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-sky-400/20 bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-950">
              <Workflow size={23} />
            </div>

            <div>
              <p className="font-bold tracking-tight">FlowOps AI</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
                Enterprise Operations
              </p>
            </div>
          </div>

          <nav className="mt-7 space-y-2">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Workspace
            </p>

            {navigationItems
              .filter((item) => canAccess(item.permission))
              .map((item) => {
                const Icon = item.icon

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                      item.active
                        ? 'border border-sky-400/15 bg-sky-500/10 text-sky-300'
                        : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
          </nav>

          <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-sky-500/25 to-blue-600/25 text-sm font-bold text-sky-300">
                {user?.name?.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {user?.name}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {user?.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/80 px-3 py-2.5 text-xs text-slate-400 transition hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-300"
            >
              <LogOut size={15} />

              {isLoggingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="legacy-dashboard-header flex h-20 items-center justify-between border-b border-slate-800/70 bg-slate-950/30 px-6 backdrop-blur-xl md:px-9">
            <div>
              <p className="text-xs text-slate-500">
                Enterprise workspace
              </p>

              <h1 className="mt-1 text-lg font-semibold">
                Operations Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openWorkspaceSearch}
                className="hidden h-10 min-w-64 items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 text-left text-xs text-slate-600 md:flex"
              >
                <Search size={16} />
                Search the workspace...
              </button>

              <NotificationBell
                enabled={
                  user?.permissions?.includes(
                    'notifications.view',
                  ) ?? false
                }
              />
            </div>
          </header>

          <div className="p-6 md:p-9">
            <section className="relative overflow-hidden rounded-3xl border border-sky-400/10 bg-gradient-to-br from-blue-950/70 via-slate-900/70 to-cyan-950/40 p-7 shadow-2xl shadow-slate-950 md:p-9">
              <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />

              <div className="relative max-w-3xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-400/15 bg-sky-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-sky-300">
                  <Sparkles size={13} />
                  FlowOps Intelligence
                </div>

                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Welcome back, {user?.name}.
                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
                  Your secure operations workspace is active. Department,
                  employee, request and workflow intelligence is organized into
                  clickable enterprise modules below.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-300">
                    <ShieldCheck size={15} />
                    Tenant isolation active
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-950/40 px-4 py-2 text-xs text-slate-400">
                    <Clock3 size={15} />
                    Workspace synchronized
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statisticCards.map(renderCard)}
            </section>

            <section className="mt-7">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                    Enterprise modules
                  </p>

                  <h3 className="mt-2 text-lg font-semibold">
                    Jump into the workspace
                  </h3>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {workspaceCards.map(renderCard)}
              </div>
            </section>

            <section className="mt-7 grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
              <article className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-6">
                <h3 className="font-semibold">Operational overview</h3>

                <p className="mt-2 text-xs text-slate-600">
                  Live activity and performance analytics are available through
                  the Analytics module.
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/analytics')}
                  disabled={!canAccess('reports.view')}
                  className="mt-8 grid h-52 w-full place-items-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 text-left transition hover:border-sky-400/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="text-center">
                    <Activity
                      size={27}
                      className="mx-auto text-sky-400/60"
                    />

                    <p className="mt-3 text-sm text-slate-400">
                      Open operational analytics
                    </p>
                  </div>
                </button>
              </article>

              <article className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-6">
                <h3 className="font-semibold">Security status</h3>

                <div className="mt-6 space-y-4">
                  {[
                    'Authentication secured',
                    'Tenant isolation enabled',
                    'Role permissions active',
                    'API services operational',
                  ].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => navigate('/security')}
                      disabled={!canAccess('view security dashboard')}
                      className="flex w-full items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-3 text-left transition hover:border-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ShieldCheck
                        size={16}
                        className="text-emerald-400"
                      />

                      <span className="text-xs text-slate-400">
                        {item}
                      </span>
                    </button>
                  ))}
                </div>
              </article>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}

export default DashboardPage
