import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  Bell,
  Building2,
  ChevronRight,
  Clock3,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { authService } from '../services/authService'
import { dashboardService } from '../services/dashboardService'

interface NavigationItem {
  label: string
  icon: LucideIcon
  active: boolean
  path?: string
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
  },
  {
    label: 'Security',
    icon: ShieldCheck,
    active: false,
    path: '/security',
    permission: 'view security dashboard',
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

const statistics = [
  {
    title: 'Employees',
    value: summaryValue(
      dashboardSummary?.employees_total,
    ),
    description: 'Company employee records',
    icon: Users,
  },
  {
    title: 'Departments',
    value: summaryValue(
      dashboardSummary?.departments_total,
    ),
    description: 'Organization structure',
    icon: Building2,
  },
  {
    title: 'Failed Logins',
    value: summaryValue(
      dashboardSummary?.failed_logins_24h,
    ),
    description: 'During the last 24 hours',
    icon: Activity,
  },
  {
    title: 'Elevated Risk',
    value: summaryValue(
      dashboardSummary
        ?.elevated_risk_attempts_24h,
    ),
    description: 'Risk score 50 or higher',
    icon: ShieldCheck,
  },
]
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
        <aside className="hidden w-72 flex-col border-r border-slate-800/80 bg-slate-950/75 p-5 backdrop-blur-xl lg:flex">
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
  .filter(
    (item) =>
      !item.permission ||
      user?.permissions?.includes(item.permission),
  )
  .map((item) => {
              const Icon = item.icon

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
  if (item.path) {
    navigate(item.path)
  }
}}
disabled={!item.path}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                    item.active
                      ? 'border border-sky-400/15 bg-sky-500/10 text-sky-300'
                      : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>

                  {!item.path && (
  <span className="ml-auto text-[9px] uppercase tracking-wider text-slate-700">
    Soon
  </span>
)}
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
          <header className="flex h-20 items-center justify-between border-b border-slate-800/70 bg-slate-950/30 px-6 backdrop-blur-xl md:px-9">
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
                className="hidden h-10 min-w-64 items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 text-left text-xs text-slate-600 md:flex"
              >
                <Search size={16} />
                Search the workspace...
              </button>

              <button
                type="button"
                className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-800 bg-slate-950/60 text-slate-500 transition hover:text-sky-300"
              >
                <Bell size={17} />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-sky-400" />
              </button>
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
                  employee and workflow intelligence will appear here as your
                  organization begins using FlowOps AI.
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
              {statistics.map((statistic) => {
                const Icon = statistic.icon

                return (
                  <article
                    key={statistic.title}
                    className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-5 transition hover:-translate-y-0.5 hover:border-sky-400/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="grid h-10 w-10 place-items-center rounded-xl border border-sky-400/10 bg-sky-500/10 text-sky-300">
                        <Icon size={18} />
                      </div>

                      <ChevronRight size={16} className="text-slate-700" />
                    </div>

                    <p className="mt-6 text-2xl font-bold">
                      {statistic.value}
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-300">
                      {statistic.title}
                    </p>

                    <p className="mt-2 text-xs text-slate-600">
                      {statistic.description}
                    </p>
                  </article>
                )
              })}
            </section>

            <section className="mt-7 grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
              <article className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-6">
                <h3 className="font-semibold">Operational overview</h3>

                <p className="mt-2 text-xs text-slate-600">
                  Live activity and performance analytics will appear here.
                </p>

                <div className="mt-8 grid h-52 place-items-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40">
                  <div className="text-center">
                    <Activity
                      size={27}
                      className="mx-auto text-sky-400/60"
                    />

                    <p className="mt-3 text-sm text-slate-400">
                      Waiting for operational data
                    </p>
                  </div>
                </div>
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
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-3"
                    >
                      <ShieldCheck
                        size={16}
                        className="text-emerald-400"
                      />

                      <span className="text-xs text-slate-400">
                        {item}
                      </span>
                    </div>
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