import { useState } from 'react'
import {
  Navigate,
  useNavigate,
} from 'react-router-dom'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  BellRing,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react'
import { authService } from '../services/authService'
import { notificationService } from '../services/notificationService'
import type {
  AppNotification,
  NotificationStatusFilter,
} from '../types/notification'

function formatDate(value: string | null): string {
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

function notificationIcon(type: string) {
  if (type.includes('overdue')) {
    return ShieldAlert
  }

  if (
    type.includes('assigned') ||
    type.includes('due_soon')
  ) {
    return BellRing
  }

  return Bell
}

function NotificationsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [status, setStatus] =
    useState<NotificationStatusFilter>('all')

  const [page, setPage] = useState(1)

  const userQuery = useQuery({
    queryKey: ['current-user'],
    queryFn: authService.getCurrentUser,
    retry: false,
  })

  const canView =
    userQuery.data?.permissions?.includes(
      'notifications.view',
    ) ?? false

  const notificationsQuery = useQuery({
    queryKey: [
      'notifications',
      status,
      page,
    ],
    queryFn: () =>
      notificationService.list({
        page,
        status,
        per_page: 20,
      }),
    enabled: canView,
    refetchInterval: 30_000,
  })

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['notifications'],
      }),
      queryClient.invalidateQueries({
        queryKey: [
          'notifications-unread-count',
        ],
      }),
    ])
  }

  const markReadMutation = useMutation({
    mutationFn: notificationService.markRead,
    onSuccess: refresh,
  })

  const markAllReadMutation = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: refresh,
  })

  const openNotification = async (
    notification: AppNotification,
  ) => {
    if (!notification.is_read) {
      await markReadMutation.mutateAsync(
        notification.id,
      )
    }

    if (notification.action_url) {
      navigate(notification.action_url)
    }
  }

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
    return <Navigate to="/dashboard" replace />
  }

  const result = notificationsQuery.data
  const notifications = result?.data ?? []
  const unreadOnPage = notifications.filter(
    (notification) => !notification.is_read,
  ).length

  return (
    <main className="min-h-screen bg-[#050b18] text-slate-100">
      <header className="border-b border-slate-800/80 bg-slate-950/90">
        <div className="mx-auto flex min-h-20 max-w-[1500px] items-center justify-between gap-4 px-5 md:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 text-slate-400 hover:text-sky-300"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="grid h-11 w-11 place-items-center rounded-xl bg-sky-500/10 text-sky-300">
              <BellRing size={22} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Workflow operations
              </p>

              <h1 className="font-semibold">
                Notifications
              </h1>
            </div>
          </div>

          <button
            type="button"
            disabled={
              markAllReadMutation.isPending ||
              unreadOnPage === 0
            }
            onClick={() =>
              markAllReadMutation.mutate()
            }
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-700 px-4 text-xs text-slate-300 transition hover:border-sky-400/30 hover:text-sky-300 disabled:opacity-40"
          >
            <CheckCheck size={16} />
            Mark all read
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] p-5 md:p-8">
        <section className="rounded-3xl border border-sky-400/10 bg-gradient-to-br from-blue-950/60 via-slate-950 to-cyan-950/30 p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">
            Operational alerts
          </p>

          <h2 className="mt-4 text-3xl font-bold">
            Deadlines, assignments and decisions
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
            Follow new approval assignments, upcoming SLA
            deadlines, overdue escalations and request
            decisions.
          </p>
        </section>

        <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/55 p-5">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['all', 'All'],
                ['unread', 'Unread'],
                ['read', 'Read'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setStatus(value)
                  setPage(1)
                }}
                className={`h-10 rounded-xl px-4 text-xs font-semibold transition ${
                  status === value
                    ? 'bg-sky-500 text-slate-950'
                    : 'border border-slate-800 text-slate-400 hover:text-sky-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              void notificationsQuery.refetch()
            }
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 text-slate-500 hover:text-sky-300"
          >
            <RefreshCw
              size={16}
              className={
                notificationsQuery.isFetching
                  ? 'animate-spin'
                  : ''
              }
            />
          </button>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/55">
          <div className="border-b border-slate-800 p-5">
            <h3 className="font-semibold">
              Notification feed
            </h3>

            <p className="mt-1 text-xs text-slate-600">
              {result?.meta.total ?? 0} notifications found
            </p>
          </div>

          <div className="divide-y divide-slate-800/70">
            {notificationsQuery.isPending ? (
              <div className="grid min-h-60 place-items-center">
                <LoaderCircle
                  size={30}
                  className="animate-spin text-sky-400"
                />
              </div>
            ) : notificationsQuery.isError ? (
              <div className="flex min-h-60 items-center justify-center gap-3 text-rose-200">
                <AlertTriangle size={20} />
                Notifications could not be loaded.
              </div>
            ) : notifications.length === 0 ? (
              <div className="grid min-h-60 place-items-center text-center">
                <div>
                  <Bell
                    size={34}
                    className="mx-auto text-slate-700"
                  />

                  <p className="mt-4 text-sm text-slate-500">
                    No notifications match this filter.
                  </p>
                </div>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = notificationIcon(
                  notification.type,
                )

                return (
                  <article
                    key={notification.id}
                    className={`flex flex-col gap-4 p-5 transition md:flex-row md:items-center ${
                      notification.is_read
                        ? 'bg-transparent'
                        : 'bg-sky-500/[0.04]'
                    }`}
                  >
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-300">
                      <Icon size={19} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="font-semibold">
                          {notification.title}
                        </h4>

                        {!notification.is_read && (
                          <span className="rounded-full bg-sky-400 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-950">
                            New
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {notification.message}
                      </p>

                      <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-600">
                        <Clock3 size={13} />
                        {formatDate(
                          notification.created_at,
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      {!notification.is_read && (
                        <button
                          type="button"
                          disabled={
                            markReadMutation.isPending
                          }
                          onClick={() =>
                            markReadMutation.mutate(
                              notification.id,
                            )
                          }
                          className="h-10 rounded-xl border border-slate-800 px-3 text-xs text-slate-400 hover:text-sky-300"
                        >
                          Mark read
                        </button>
                      )}

                      {notification.action_url && (
                        <button
                          type="button"
                          onClick={() =>
                            void openNotification(
                              notification,
                            )
                          }
                          className="flex h-10 items-center gap-2 rounded-xl bg-sky-500 px-3 text-xs font-semibold text-slate-950 hover:bg-sky-400"
                        >
                          Open
                          <ExternalLink size={14} />
                        </button>
                      )}
                    </div>
                  </article>
                )
              })
            )}
          </div>

          {result && result.meta.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800 p-5">
              <p className="text-xs text-slate-600">
                Page {result.meta.current_page} of{' '}
                {result.meta.last_page}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((current) => current - 1)
                  }
                  className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 text-slate-500 disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  disabled={
                    page >= result.meta.last_page
                  }
                  onClick={() =>
                    setPage((current) => current + 1)
                  }
                  className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 text-slate-500 disabled:opacity-30"
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

export default NotificationsPage