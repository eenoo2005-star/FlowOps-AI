import {
  type FormEvent,
  useState,
} from 'react'
import {
  Navigate,
  useNavigate,
} from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Globe2,
  KeyRound,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react'
import { authService } from '../services/authService'
import { securityService } from '../services/securityService'
import type {
  LoginAttempt,
  SecurityAttemptFilters,
} from '../types/security'

const initialFilters: SecurityAttemptFilters = {
  page: 1,
  status: 'all',
  search: '',
  country_code: '',
  risk_min: '',
  risk_max: '',
  sort: 'newest',
  per_page: 20,
}

function formatDate(value: string | null): string {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatFailureReason(
  failureReason: string | null,
): string {
  if (!failureReason) {
    return 'None'
  }

  return failureReason
    .split('_')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ')
}

function riskClasses(riskScore: number): string {
  if (riskScore >= 75) {
    return 'border-rose-400/20 bg-rose-500/10 text-rose-300'
  }

  if (riskScore >= 50) {
    return 'border-amber-400/20 bg-amber-500/10 text-amber-300'
  }

  if (riskScore >= 25) {
    return 'border-sky-400/20 bg-sky-500/10 text-sky-300'
  }

  return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
}

function locationLabel(attempt: LoginAttempt): string {
  const values = [
    attempt.location.city,
    attempt.location.region,
    attempt.location.country,
  ].filter(Boolean)

  return values.length > 0
    ? values.join(', ')
    : 'Unknown location'
}

function SecurityPage() {
  const navigate = useNavigate()

  const [days, setDays] = useState(30)

  const [draftFilters, setDraftFilters] =
    useState<SecurityAttemptFilters>(initialFilters)

  const [appliedFilters, setAppliedFilters] =
    useState<SecurityAttemptFilters>(initialFilters)

  const {
    data: user,
    isPending: isUserPending,
    isError: isUserError,
  } = useQuery({
    queryKey: ['current-user'],
    queryFn: authService.getCurrentUser,
    retry: false,
  })

  const canViewSecurity =
    user?.permissions?.includes(
      'view security dashboard',
    ) ?? false

  const overviewQuery = useQuery({
    queryKey: ['security', 'overview', days],
    queryFn: () =>
      securityService.getOverview(days),
    enabled: canViewSecurity,
  })

  const attemptsQuery = useQuery({
    queryKey: [
      'security',
      'login-attempts',
      appliedFilters,
    ],
    queryFn: () =>
      securityService.getLoginAttempts(
        appliedFilters,
      ),
    enabled: canViewSecurity,
  })

  const handleApplyFilters = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setAppliedFilters({
      ...draftFilters,
      page: 1,
    })
  }

  const handleResetFilters = () => {
    setDraftFilters(initialFilters)
    setAppliedFilters(initialFilters)
  }

  const changePage = (page: number) => {
    setAppliedFilters((currentFilters) => ({
      ...currentFilters,
      page,
    }))
  }

  const handleRefresh = () => {
    void overviewQuery.refetch()
    void attemptsQuery.refetch()
  }

  if (isUserError) {
    return <Navigate to="/login" replace />
  }

  if (isUserPending) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-sky-400/20 border-t-sky-400" />

          <p className="mt-4 text-sm text-slate-500">
            Verifying security permissions...
          </p>
        </div>
      </main>
    )
  }

  if (!canViewSecurity) {
    return <Navigate to="/dashboard" replace />
  }

  const overview = overviewQuery.data
  const attempts = attemptsQuery.data

  const isRefreshing =
    overviewQuery.isFetching ||
    attemptsQuery.isFetching

  const maximumCountryAttempts = Math.max(
    ...(overview?.top_countries.map(
      (country) => country.attempts,
    ) ?? [1]),
    1,
  )

  const maximumFailureAttempts = Math.max(
    ...(overview?.top_failure_reasons.map(
      (reason) => reason.attempts,
    ) ?? [1]),
    1,
  )

  const metricCards = [
    {
      label: 'Total attempts',
      value:
        overview?.metrics.total_attempts ?? '—',
      icon: Activity,
      description: `During the last ${days} days`,
    },
    {
      label: 'Successful',
      value:
        overview?.metrics.successful_attempts ??
        '—',
      icon: CheckCircle2,
      description: 'Authenticated sessions',
    },
    {
      label: 'Failed',
      value:
        overview?.metrics.failed_attempts ?? '—',
      icon: XCircle,
      description: 'Rejected sign-in attempts',
    },
    {
      label: 'Elevated risk',
      value:
        overview?.metrics
          .elevated_risk_attempts ?? '—',
      icon: AlertTriangle,
      description: 'Risk score 50 or higher',
    },
    {
      label: 'Unique IP addresses',
      value:
        overview?.metrics.unique_ip_addresses ??
        '—',
      icon: Globe2,
      description: 'Distinct network sources',
    },
    {
      label: 'Success rate',
      value:
        overview === undefined
          ? '—'
          : `${overview.metrics.success_rate}%`,
      icon: ShieldCheck,
      description: 'Successful authentication ratio',
    },
  ]

  return (
    <main className="min-h-screen bg-[#050b18] text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-[1600px] items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 bg-slate-900/70 text-slate-400 transition hover:border-sky-400/30 hover:text-sky-300"
              aria-label="Return to dashboard"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="grid h-11 w-11 place-items-center rounded-xl border border-rose-400/15 bg-rose-500/10 text-rose-300">
              <ShieldAlert size={22} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                FlowOps AI
              </p>

              <h1 className="font-semibold">
                Security Monitoring
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={days}
              onChange={(event) =>
                setDays(Number(event.target.value))
              }
              className="h-10 rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-300 outline-none transition focus:border-sky-400/40"
              aria-label="Security overview period"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>

            <button
              type="button"
              onClick={handleRefresh}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 bg-slate-950 text-slate-400 transition hover:border-sky-400/30 hover:text-sky-300"
              aria-label="Refresh security data"
            >
              <RefreshCw
                size={17}
                className={
                  isRefreshing ? 'animate-spin' : ''
                }
              />
            </button>

            <div className="hidden text-right md:block">
              <p className="text-sm font-medium">
                {user?.name}
              </p>

              <p className="text-xs text-slate-600">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] p-5 md:p-8">
        <section className="relative overflow-hidden rounded-3xl border border-rose-400/10 bg-gradient-to-br from-rose-950/35 via-slate-950 to-blue-950/30 p-7">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-rose-500/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/15 bg-rose-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-rose-300">
              <KeyRound size={13} />
              Authentication intelligence
            </div>

            <h2 className="mt-5 text-3xl font-bold tracking-tight">
              Login security and risk visibility
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Review authentication activity, elevated-risk
              attempts, approximate network locations and
              tenant-scoped security indicators.
            </p>
          </div>
        </section>

        {(overviewQuery.isError ||
          attemptsQuery.isError) && (
          <section className="mt-6 flex items-center justify-between rounded-2xl border border-rose-400/20 bg-rose-500/10 p-5">
            <div className="flex items-center gap-3">
              <AlertTriangle
                size={20}
                className="text-rose-300"
              />

              <div>
                <p className="text-sm font-medium text-rose-200">
                  Security data could not be loaded
                </p>

                <p className="mt-1 text-xs text-rose-300/60">
                  Verify that the Laravel API is running and
                  that your account has security permission.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-xl border border-rose-400/20 px-4 py-2 text-xs text-rose-200"
            >
              Retry
            </button>
          </section>
        )}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {metricCards.map((metric) => {
            const Icon = metric.icon

            return (
              <article
                key={metric.label}
                className="rounded-2xl border border-slate-800/80 bg-slate-950/55 p-5"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-sky-400/10 bg-sky-500/10 text-sky-300">
                  <Icon size={18} />
                </div>

                <p className="mt-5 text-2xl font-bold">
                  {metric.value}
                </p>

                <p className="mt-1 text-sm font-medium text-slate-300">
                  {metric.label}
                </p>

                <p className="mt-2 text-xs text-slate-600">
                  {metric.description}
                </p>
              </article>
            )
          })}
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-2">
          <article className="rounded-2xl border border-slate-800/80 bg-slate-950/55 p-6">
            <div className="flex items-center gap-3">
              <Globe2
                size={19}
                className="text-sky-300"
              />

              <div>
                <h3 className="font-semibold">
                  Top network countries
                </h3>

                <p className="mt-1 text-xs text-slate-600">
                  Approximate IP geolocation
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {overview?.top_countries.length ? (
                overview.top_countries.map((country) => (
                  <div key={country.country_code}>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-slate-300">
                        {country.country ?? 'Unknown'}{' '}
                        <span className="text-slate-600">
                          ({country.country_code})
                        </span>
                      </span>

                      <span className="text-slate-500">
                        {country.attempts}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-900">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{
                          width: `${
                            (country.attempts /
                              maximumCountryAttempts) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-slate-600">
                  No location data available
                </p>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-800/80 bg-slate-950/55 p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle
                size={19}
                className="text-amber-300"
              />

              <div>
                <h3 className="font-semibold">
                  Failure reasons
                </h3>

                <p className="mt-1 text-xs text-slate-600">
                  Most frequent rejected conditions
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {overview?.top_failure_reasons.length ? (
                overview.top_failure_reasons.map(
                  (reason) => (
                    <div key={reason.failure_reason}>
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-slate-300">
                          {formatFailureReason(
                            reason.failure_reason,
                          )}
                        </span>

                        <span className="text-slate-500">
                          {reason.attempts}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-900">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{
                            width: `${
                              (reason.attempts /
                                maximumFailureAttempts) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ),
                )
              ) : (
                <p className="py-8 text-center text-sm text-slate-600">
                  No failed attempts in this period
                </p>
              )}
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-950/55 p-5">
          <form
            onSubmit={handleApplyFilters}
            className="grid gap-4 lg:grid-cols-2 xl:grid-cols-7"
          >
            <label className="xl:col-span-2">
              <span className="mb-2 block text-xs text-slate-500">
                Search
              </span>

              <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-3 focus-within:border-sky-400/40">
                <Search
                  size={16}
                  className="text-slate-600"
                />

                <input
                  value={draftFilters.search}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      search: event.target.value,
                    }))
                  }
                  placeholder="Email, IP, country or city"
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-700"
                />
              </div>
            </label>

            <label>
              <span className="mb-2 block text-xs text-slate-500">
                Status
              </span>

              <select
                value={draftFilters.status}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    status: event.target
                      .value as SecurityAttemptFilters['status'],
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300 outline-none focus:border-sky-400/40"
              >
                <option value="all">All attempts</option>
                <option value="successful">
                  Successful
                </option>
                <option value="failed">Failed</option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-xs text-slate-500">
                Country
              </span>

              <input
                value={draftFilters.country_code}
                maxLength={2}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    country_code:
                      event.target.value.toUpperCase(),
                  }))
                }
                placeholder="LY"
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm uppercase text-slate-300 outline-none placeholder:text-slate-700 focus:border-sky-400/40"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs text-slate-500">
                Minimum risk
              </span>

              <input
                type="number"
                min={0}
                max={100}
                value={draftFilters.risk_min}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    risk_min: event.target.value,
                  }))
                }
                placeholder="0"
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300 outline-none placeholder:text-slate-700 focus:border-sky-400/40"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs text-slate-500">
                Maximum risk
              </span>

              <input
                type="number"
                min={0}
                max={100}
                value={draftFilters.risk_max}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    risk_max: event.target.value,
                  }))
                }
                placeholder="100"
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300 outline-none placeholder:text-slate-700 focus:border-sky-400/40"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs text-slate-500">
                Sort
              </span>

              <select
                value={draftFilters.sort}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    sort: event.target
                      .value as SecurityAttemptFilters['sort'],
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300 outline-none focus:border-sky-400/40"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="risk_high">
                  Highest risk
                </option>
                <option value="risk_low">
                  Lowest risk
                </option>
              </select>
            </label>

            <div className="flex items-end gap-3 xl:col-span-7">
              <button
                type="submit"
                className="flex h-11 items-center gap-2 rounded-xl bg-sky-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
              >
                <Filter size={16} />
                Apply filters
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="h-11 rounded-xl border border-slate-800 px-5 text-sm text-slate-400 transition hover:border-slate-700 hover:text-slate-200"
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/55">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 p-5">
            <div>
              <h3 className="font-semibold">
                Login attempts
              </h3>

              <p className="mt-1 text-xs text-slate-600">
                {attempts?.meta.total ?? 0} records found
              </p>
            </div>

            <select
              value={draftFilters.per_page}
              onChange={(event) => {
                const perPage = Number(
                  event.target.value,
                )

                setDraftFilters((current) => ({
                  ...current,
                  per_page: perPage,
                }))

                setAppliedFilters((current) => ({
                  ...current,
                  page: 1,
                  per_page: perPage,
                }))
              }}
              className="h-10 rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-300 outline-none"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800/80">
              <thead className="bg-slate-950/70">
                <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-slate-600">
                  <th className="px-5 py-4">Identity</th>
                  <th className="px-5 py-4">Network</th>
                  <th className="px-5 py-4">Location</th>
                  <th className="px-5 py-4">Result</th>
                  <th className="px-5 py-4">Risk</th>
                  <th className="px-5 py-4">Time</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60">
                {attemptsQuery.isPending ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center"
                    >
                      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-sky-400/20 border-t-sky-400" />

                      <p className="mt-4 text-sm text-slate-600">
                        Loading login attempts...
                      </p>
                    </td>
                  </tr>
                ) : attempts?.data.length ? (
                  attempts.data.map((attempt) => (
                    <tr
                      key={attempt.id}
                      className="transition hover:bg-slate-900/40"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-slate-500">
                            <UserRound size={16} />
                          </div>

                          <div>
                            <p className="text-sm text-slate-300">
                              {attempt.email_masked}
                            </p>

                            <p className="mt-1 text-xs text-slate-600">
                              {attempt.user?.name ??
                                'Unknown account'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-mono text-xs text-slate-300">
                          {attempt.ip_address}
                        </p>

                        <p
                          className="mt-1 max-w-48 truncate text-xs text-slate-700"
                          title={
                            attempt.user_agent ?? undefined
                          }
                        >
                          {attempt.user_agent ??
                            'Unknown client'}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2">
                          <MapPin
                            size={14}
                            className="mt-0.5 text-slate-600"
                          />

                          <div>
                            <p className="max-w-52 text-xs text-slate-400">
                              {locationLabel(attempt)}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-700">
                              Approximate IP location
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                            attempt.was_successful
                              ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
                              : 'border-rose-400/20 bg-rose-500/10 text-rose-300'
                          }`}
                        >
                          {attempt.was_successful ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <XCircle size={12} />
                          )}

                          {attempt.was_successful
                            ? 'Successful'
                            : formatFailureReason(
                                attempt.failure_reason,
                              )}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${riskClasses(
                            attempt.risk_score,
                          )}`}
                        >
                          {attempt.risk_score}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        {formatDate(
                          attempt.attempted_at,
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center"
                    >
                      <ShieldCheck
                        size={27}
                        className="mx-auto text-slate-700"
                      />

                      <p className="mt-4 text-sm text-slate-500">
                        No login attempts match the filters
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {attempts && attempts.meta.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800/80 p-5">
              <p className="text-xs text-slate-600">
                Page {attempts.meta.current_page} of{' '}
                {attempts.meta.last_page}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    attempts.meta.current_page <= 1
                  }
                  onClick={() =>
                    changePage(
                      attempts.meta.current_page - 1,
                    )
                  }
                  className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 text-slate-400 transition hover:border-sky-400/30 hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  disabled={
                    attempts.meta.current_page >=
                    attempts.meta.last_page
                  }
                  onClick={() =>
                    changePage(
                      attempts.meta.current_page + 1,
                    )
                  }
                  className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 text-slate-400 transition hover:border-sky-400/30 hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default SecurityPage