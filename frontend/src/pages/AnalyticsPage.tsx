import { useState } from 'react'
import {
  Navigate,
  useNavigate,
} from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  AlarmClock,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  Gauge,
  LoaderCircle,
  RefreshCw,
  Timer,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { authService } from '../services/authService'
import { dashboardAnalyticsService } from '../services/dashboardAnalyticsService'
import type {
  DashboardActivityItem,
  DashboardAnalytics,
  DashboardPerformanceItem,
  DashboardTrendPoint,
} from '../types/dashboardAnalytics'

interface MetricCardProps {
  title: string
  value: string
  description: string
  icon: LucideIcon
  danger?: boolean
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  danger = false,
}: MetricCardProps) {
  return (
    <article
      className={`rounded-2xl border p-5 ${
        danger
          ? 'border-rose-400/20 bg-rose-500/[0.05]'
          : 'border-slate-800/80 bg-slate-950/55'
      }`}
    >
      <div
        className={`grid h-10 w-10 place-items-center rounded-xl ${
          danger
            ? 'bg-rose-500/10 text-rose-300'
            : 'bg-sky-500/10 text-sky-300'
        }`}
      >
        <Icon size={18} />
      </div>

      <p className="mt-5 text-2xl font-bold">
        {value}
      </p>

      <h3 className="mt-1 text-sm font-semibold text-slate-300">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-slate-600">
        {description}
      </p>
    </article>
  )
}

function formatHours(
  value: number | null,
): string {
  if (value === null) {
    return '-'
  }

  if (value < 1) {
    return `${Math.round(value * 60)}m`
  }

  return `${value.toFixed(1)}h`
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return 'Not set'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Not set'
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function TrendChart({
  points,
}: {
  points: DashboardTrendPoint[]
}) {
  const width = 760
  const height = 270
  const left = 42
  const top = 24
  const bottom = 44
  const chartWidth = width - left * 2
  const chartHeight = height - top - bottom

  const maxValue = Math.max(
    1,
    ...points.flatMap((point) => [
      point.created,
      point.completed,
    ]),
  )

  const position = (
    value: number,
    index: number,
  ) => {
    const divisor = Math.max(
      points.length - 1,
      1,
    )

    return {
      x:
        left +
        (index / divisor) * chartWidth,
      y:
        top +
        chartHeight -
        (value / maxValue) * chartHeight,
    }
  }

  const linePoints = (
    field: 'created' | 'completed',
  ) =>
    points
      .map((point, index) => {
        const current = position(
          point[field],
          index,
        )

        return `${current.x},${current.y}`
      })
      .join(' ')

  const labels = new Set([
    0,
    Math.floor(
      Math.max(points.length - 1, 0) / 2,
    ),
    Math.max(points.length - 1, 0),
  ])

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-5 text-xs text-slate-500">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
          Created
        </span>

        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          Completed
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[620px]"
          role="img"
          aria-label="Request creation and completion trend"
        >
          {[0, 0.25, 0.5, 0.75, 1].map(
            (ratio) => {
              const y =
                top +
                chartHeight -
                ratio * chartHeight

              return (
                <g key={ratio}>
                  <line
                    x1={left}
                    x2={width - left}
                    y1={y}
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-800"
                    strokeWidth="1"
                  />

                  <text
                    x={left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-600 text-[10px]"
                  >
                    {Math.round(
                      maxValue * ratio,
                    )}
                  </text>
                </g>
              )
            },
          )}

          {points.length > 0 && (
            <>
              <polyline
                points={linePoints('created')}
                fill="none"
                stroke="rgb(56 189 248)"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              <polyline
                points={linePoints('completed')}
                fill="none"
                stroke="rgb(52 211 153)"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </>
          )}

          {points.map((point, index) => {
            if (!labels.has(index)) {
              return null
            }

            const current = position(0, index)

            return (
              <text
                key={point.date}
                x={current.x}
                y={height - 12}
                textAnchor="middle"
                className="fill-slate-600 text-[10px]"
              >
                {new Intl.DateTimeFormat(
                  'en-GB',
                  {
                    day: '2-digit',
                    month: 'short',
                  },
                ).format(
                  new Date(
                    `${point.date}T00:00:00`,
                  ),
                )}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function PerformanceList({
  items,
  emptyLabel,
}: {
  items: DashboardPerformanceItem[]
  emptyLabel: string
}) {
  if (items.length === 0) {
    return (
      <div className="grid min-h-44 place-items-center rounded-xl border border-dashed border-slate-800 text-sm text-slate-600">
        {emptyLabel}
      </div>
    )
  }

  const maxTotal = Math.max(
    1,
    ...items.map((item) => item.total),
  )

  return (
    <div className="space-y-5">
      {items.map((item) => (
        <article key={item.id}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-300">
                {item.name}
              </p>

              <p className="mt-1 font-mono text-[10px] text-slate-700">
                {item.code}
              </p>
            </div>

            <p className="text-sm font-bold">
              {item.total}
            </p>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
              style={{
                width: `${Math.max(
                  4,
                  (item.total / maxTotal) * 100,
                )}%`,
              }}
            />
          </div>

          <div className="mt-2 flex flex-wrap gap-4 text-[10px] text-slate-600">
            <span>
              Approved {item.approved}
            </span>

            <span>
              Rejected {item.rejected}
            </span>

            <span>
              Pending {item.pending}
            </span>

            <span>
              Avg{' '}
              {formatHours(
                item.average_completion_hours,
              )}
            </span>
          </div>
        </article>
      ))}
    </div>
  )
}

function StatusDistribution({
  analytics,
}: {
  analytics: DashboardAnalytics
}) {
  const total =
    analytics.request_statuses.reduce(
      (sum, item) => sum + item.count,
      0,
    )

  const labels: Record<string, string> = {
    draft: 'Draft',
    in_review: 'In review',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
  }

  return (
    <div className="space-y-4">
      {analytics.request_statuses.map((item) => {
        const percentage =
          total === 0
            ? 0
            : (item.count / total) * 100

        return (
          <div key={item.status}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {labels[item.status] ??
                  item.status}
              </span>

              <span className="font-semibold text-slate-300">
                {item.count}
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-900">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                style={{
                  width: `${percentage}%`,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function activityIcon(
  activity: DashboardActivityItem,
): LucideIcon {
  if (
    activity.event_type.includes(
      'approved',
    )
  ) {
    return CheckCircle2
  }

  if (
    activity.event_type.includes(
      'overdue',
    ) ||
    activity.event_type.includes(
      'rejected',
    )
  ) {
    return AlarmClock
  }

  return Activity
}

function AnalyticsPage() {
  const navigate = useNavigate()

  const [days, setDays] = useState<
    7 | 30 | 90
  >(30)

  const userQuery = useQuery({
    queryKey: ['current-user'],
    queryFn: authService.getCurrentUser,
    retry: false,
  })

  const canView =
    userQuery.data?.permissions?.includes(
      'reports.view',
    ) ?? false

  const analyticsQuery = useQuery({
    queryKey: ['dashboard-analytics', days],
    queryFn: () =>
      dashboardAnalyticsService.getAnalytics(
        days,
      ),
    enabled: canView,
    retry: false,
  })

  if (userQuery.isError) {
    return <Navigate to="/login" replace />
  }

  if (userQuery.isPending) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950">
        <LoaderCircle
          size={34}
          className="animate-spin text-sky-400"
        />
      </main>
    )
  }

  if (!canView) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }

  const analytics = analyticsQuery.data

  return (
    <main className="min-h-screen bg-[#050b18] text-slate-100">
      <header className="border-b border-slate-800/80 bg-slate-950/90">
        <div className="mx-auto flex min-h-20 max-w-[1700px] items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() =>
                navigate('/dashboard')
              }
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 text-slate-400 hover:text-sky-300"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="grid h-11 w-11 place-items-center rounded-xl bg-sky-500/10 text-sky-300">
              <BarChart3 size={22} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Enterprise operations
              </p>

              <h1 className="font-semibold">
                Operational Analytics
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void analyticsQuery.refetch()
            }
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 text-slate-500 hover:text-sky-300"
          >
            <RefreshCw
              size={16}
              className={
                analyticsQuery.isFetching
                  ? 'animate-spin'
                  : ''
              }
            />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1700px] p-5 md:p-8">
        <section className="relative overflow-hidden rounded-3xl border border-sky-400/10 bg-gradient-to-br from-blue-950/65 via-slate-950 to-cyan-950/30 p-7">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">
                FlowOps Intelligence
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight">
                Measure request and approval performance
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                Review throughput, completion speed,
                approval outcomes, department activity
                and SLA risk for the current company.
              </p>

              {analytics && (
                <p className="mt-5 text-xs text-slate-600">
                  Updated{' '}
                  {formatDate(
                    analytics.generated_at,
                  )}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-2">
              <p className="px-2 pb-2 text-[10px] uppercase tracking-[0.14em] text-slate-600">
                Reporting period
              </p>

              <div className="flex gap-2">
                {([7, 30, 90] as const).map(
                  (value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setDays(value)
                      }
                      className={`h-9 rounded-xl px-4 text-xs font-semibold transition ${
                        days === value
                          ? 'bg-sky-500 text-slate-950'
                          : 'text-slate-500 hover:bg-slate-900 hover:text-sky-300'
                      }`}
                    >
                      {value} days
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        {analyticsQuery.isPending && (
          <div className="mt-6 grid min-h-72 place-items-center rounded-2xl border border-slate-800 bg-slate-950/55">
            <div className="text-center">
              <LoaderCircle
                size={32}
                className="mx-auto animate-spin text-sky-400"
              />

              <p className="mt-4 text-sm text-slate-500">
                Calculating operational metrics...
              </p>
            </div>
          </div>
        )}

        {analyticsQuery.isError && (
          <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-200">
            Operational analytics could not be
            loaded.
          </div>
        )}

        {analytics && (
          <>
            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard
                title="Requests created"
                value={analytics.metrics.requests_created.toLocaleString()}
                description={`Created during the last ${days} days`}
                icon={FileText}
              />

              <MetricCard
                title="Pending requests"
                value={analytics.metrics.pending_requests.toLocaleString()}
                description="Requests currently moving through approval workflows"
                icon={Clock3}
              />

              <MetricCard
                title="Approval rate"
                value={`${analytics.metrics.approval_rate.toFixed(
                  1,
                )}%`}
                description="Approved share of completed request decisions"
                icon={TrendingUp}
              />

              <MetricCard
                title="Average completion"
                value={formatHours(
                  analytics.metrics
                    .average_completion_hours,
                )}
                description="Average time from submission to completion"
                icon={Timer}
              />

              <MetricCard
                title="Overdue tasks"
                value={analytics.metrics.overdue_tasks.toLocaleString()}
                description="Pending approval tasks beyond their SLA deadline"
                icon={AlarmClock}
                danger={
                  analytics.metrics
                    .overdue_tasks > 0
                }
              />

              <MetricCard
                title="SLA compliance"
                value={`${analytics.metrics.sla_compliance_rate.toFixed(
                  1,
                )}%`}
                description="Completed tasks resolved before their deadline"
                icon={Gauge}
              />
            </section>

            <section className="mt-6 grid gap-5 2xl:grid-cols-[1.6fr_0.7fr]">
              <article className="rounded-2xl border border-slate-800/80 bg-slate-950/55 p-6">
                <div className="mb-6">
                  <h3 className="font-semibold">
                    Request flow
                  </h3>

                  <p className="mt-2 text-xs text-slate-600">
                    Daily request creation and completion.
                  </p>
                </div>

                <TrendChart
                  points={
                    analytics.request_trend
                  }
                />
              </article>

              <article className="rounded-2xl border border-slate-800/80 bg-slate-950/55 p-6">
                <h3 className="font-semibold">
                  Request status
                </h3>

                <p className="mt-2 text-xs text-slate-600">
                  Status distribution for requests
                  created in the selected period.
                </p>

                <div className="mt-7">
                  <StatusDistribution
                    analytics={analytics}
                  />
                </div>
              </article>
            </section>

            <section className="mt-6 grid gap-5 xl:grid-cols-2">
              <article className="rounded-2xl border border-slate-800/80 bg-slate-950/55 p-6">
                <h3 className="font-semibold">
                  Request type performance
                </h3>

                <p className="mt-2 text-xs text-slate-600">
                  Highest-volume request categories and
                  their outcomes.
                </p>

                <div className="mt-7">
                  <PerformanceList
                    items={
                      analytics.request_types
                    }
                    emptyLabel="No request type activity in this period."
                  />
                </div>
              </article>

              <article className="rounded-2xl border border-slate-800/80 bg-slate-950/55 p-6">
                <h3 className="font-semibold">
                  Department performance
                </h3>

                <p className="mt-2 text-xs text-slate-600">
                  Request volume grouped by requester
                  department.
                </p>

                <div className="mt-7">
                  <PerformanceList
                    items={
                      analytics.departments
                    }
                    emptyLabel="No department-linked activity in this period."
                  />
                </div>
              </article>
            </section>

            <section className="mt-6 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
              <article className="rounded-2xl border border-slate-800/80 bg-slate-950/55 p-6">
                <div className="flex items-center gap-3">
                  <Gauge
                    size={19}
                    className="text-sky-300"
                  />

                  <div>
                    <h3 className="font-semibold">
                      SLA health
                    </h3>

                    <p className="mt-1 text-xs text-slate-600">
                      Current workload and completed
                      deadline performance.
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3">
                  {[
                    [
                      'Pending',
                      analytics.sla.pending,
                    ],
                    [
                      'Due soon',
                      analytics.sla.due_soon,
                    ],
                    [
                      'Overdue',
                      analytics.sla.overdue,
                    ],
                    [
                      'On time',
                      analytics.sla
                        .completed_within_sla,
                    ],
                    [
                      'Completed late',
                      analytics.sla
                        .completed_late,
                    ],
                    [
                      'No deadline',
                      analytics.sla
                        .completed_without_deadline,
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                    >
                      <p className="text-xl font-bold">
                        {value}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-600">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-2xl border border-slate-800/80 bg-slate-950/55 p-6">
                <div className="flex items-center gap-3">
                  <Activity
                    size={19}
                    className="text-sky-300"
                  />

                  <div>
                    <h3 className="font-semibold">
                      Recent operational activity
                    </h3>

                    <p className="mt-1 text-xs text-slate-600">
                      Latest immutable request audit
                      events.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {analytics.recent_activity.length >
                  0 ? (
                    analytics.recent_activity.map(
                      (activity) => {
                        const Icon =
                          activityIcon(activity)

                        return (
                          <article
                            key={activity.id}
                            className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4"
                          >
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-300">
                              <Icon size={16} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-300">
                                {activity.summary}
                              </p>

                              <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-slate-600">
                                <span>
                                  {activity.actor_name ??
                                    'System'}
                                </span>

                                <span>
                                  {formatDate(
                                    activity.occurred_at,
                                  )}
                                </span>
                              </div>
                            </div>
                          </article>
                        )
                      },
                    )
                  ) : (
                    <div className="grid min-h-44 place-items-center rounded-xl border border-dashed border-slate-800 text-sm text-slate-600">
                      No audit activity in this period.
                    </div>
                  )}
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </main>
  )
}

export default AnalyticsPage