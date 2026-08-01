import { type FormEvent, useState } from 'react'
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
  Check,
  Inbox,
  LoaderCircle,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import type { AxiosError } from 'axios'
import { authService } from '../services/authService'
import { approvalTaskService } from '../services/approvalTaskService'
import type { ApprovalTask } from '../types/approvalTask'

interface ErrorPayload {
  message?: string
  errors?: Record<string, string[]>
}

function errorMessage(error: unknown): string {
  const axiosError = error as AxiosError<ErrorPayload>
  const validation =
    axiosError.response?.data?.errors

  return (
    (validation
      ? Object.values(validation).flat()[0]
      : null) ??
    axiosError.response?.data?.message ??
    'The operation could not be completed.'
  )
}

function formatDate(value: string | null): string {
  if (!value) return 'Not set'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not set'

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function ApprovalsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] =
    useState('')
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] =
    useState<number | null>(null)
  const [note, setNote] = useState('')
  const [actionError, setActionError] =
    useState<string | null>(null)

  const userQuery = useQuery({
    queryKey: ['current-user'],
    queryFn: authService.getCurrentUser,
    retry: false,
  })

  const canView =
    userQuery.data?.permissions?.includes(
      'workflow-tasks.view',
    ) ?? false

  const tasksQuery = useQuery({
    queryKey: [
      'workflow-tasks',
      page,
      appliedSearch,
      status,
    ],
    queryFn: () =>
      approvalTaskService.list({
        page,
        search: appliedSearch,
        status,
        per_page: 15,
      }),
    enabled: canView,
  })

  const detailQuery = useQuery({
    queryKey: ['workflow-task', selectedId],
    queryFn: () =>
      approvalTaskService.show(
        selectedId as number,
      ),
    enabled: canView && selectedId !== null,
  })

  const refresh = async (id: number) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['workflow-tasks'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['workflow-task', id],
      }),
      queryClient.invalidateQueries({
        queryKey: ['internal-requests'],
      }),
    ])
  }

  const approveMutation = useMutation({
    mutationFn: (task: ApprovalTask) =>
      approvalTaskService.approve(
        task.id,
        note.trim() || null,
      ),
    onSuccess: async (task) => {
      setNote('')
      setActionError(null)
      await refresh(task.id)
    },
    onError: (error) =>
      setActionError(errorMessage(error)),
  })

  const rejectMutation = useMutation({
    mutationFn: (task: ApprovalTask) =>
      approvalTaskService.reject(
        task.id,
        note.trim(),
      ),
    onSuccess: async (task) => {
      setNote('')
      setActionError(null)
      await refresh(task.id)
    },
    onError: (error) =>
      setActionError(errorMessage(error)),
  })

  const applySearch = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setPage(1)
    setAppliedSearch(search.trim())
  }

  if (userQuery.isError) {
    return <Navigate to="/login" replace />
  }

  if (userQuery.isPending) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950">
        <LoaderCircle className="animate-spin text-sky-400" />
      </main>
    )
  }

  if (!canView) {
    return <Navigate to="/dashboard" replace />
  }

  const result = tasksQuery.data
  const tasks = result?.data ?? []
  const selected = detailQuery.data
  const acting =
    approveMutation.isPending ||
    rejectMutation.isPending

  return (
    <main className="min-h-screen bg-[#050b18] text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto flex min-h-20 max-w-[1600px] items-center gap-4 px-6">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 text-slate-400"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="grid h-11 w-11 place-items-center rounded-xl bg-sky-500/10 text-sky-300">
            <Inbox size={22} />
          </div>

          <div>
            <p className="text-xs text-slate-500">
              Workflow operations
            </p>
            <h1 className="font-semibold">
              Approvals Inbox
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] p-6">
        <section className="rounded-3xl border border-sky-400/10 bg-gradient-to-br from-blue-950/60 via-slate-950 to-cyan-950/30 p-7">
          <h2 className="text-3xl font-bold">
            Review approval tasks
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Open an assigned task and approve or reject it.
          </p>
        </section>

        <form
          onSubmit={applySearch}
          className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-5"
        >
          <div className="flex h-11 min-w-[280px] flex-1 items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-3">
            <Search size={16} className="text-slate-600" />
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Reference, title or step"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
            className="h-11 rounded-xl border border-slate-800 bg-slate-950 px-4 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            type="submit"
            className="h-11 rounded-xl bg-sky-500 px-5 text-sm font-semibold text-slate-950"
          >
            Apply
          </button>
        </form>

        <section className="mt-6 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
            <div className="flex items-center justify-between border-b border-slate-800 p-5">
              <div>
                <h3 className="font-semibold">
                  Approval tasks
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  {result?.meta.total ?? 0} found
                </p>
              </div>

              <button
                type="button"
                onClick={() => void tasksQuery.refetch()}
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 text-slate-500"
              >
                <RefreshCw
                  size={16}
                  className={
                    tasksQuery.isFetching
                      ? 'animate-spin'
                      : ''
                  }
                />
              </button>
            </div>

            <div className="max-h-[650px] space-y-2 overflow-y-auto p-3">
              {tasksQuery.isPending ? (
                <div className="grid min-h-52 place-items-center">
                  <LoaderCircle className="animate-spin text-sky-400" />
                </div>
              ) : tasksQuery.isError ? (
                <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                  Tasks could not be loaded.
                </div>
              ) : tasks.length === 0 ? (
                <div className="grid min-h-52 place-items-center text-sm text-slate-500">
                  No tasks match the filters.
                </div>
              ) : (
                tasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(task.id)
                      setNote('')
                      setActionError(null)
                    }}
                    className={`w-full rounded-2xl border p-4 text-left ${
                      selectedId === task.id
                        ? 'border-sky-400/30 bg-sky-500/10'
                        : 'border-slate-800 bg-slate-950'
                    }`}
                  >
                    <p className="font-medium">
                      {task.internal_request?.title ??
                        'Approval request'}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-slate-600">
                      {task.internal_request
                        ?.reference_number ??
                        `TASK-${task.id}`}
                    </p>
                    <p className="mt-4 text-xs text-slate-400">
                      {task.workflow_step?.name ??
                        'Workflow step'}
                    </p>
                    <p className="mt-2 text-[10px] uppercase text-amber-300">
                      {task.status}
                    </p>
                  </button>
                ))
              )}
            </div>

            {result && result.meta.last_page > 1 && (
              <div className="flex items-center justify-between border-t border-slate-800 p-4">
                <span className="text-xs text-slate-600">
                  Page {result.meta.current_page} of{' '}
                  {result.meta.last_page}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage((current) => current - 1)
                    }
                    className="rounded-lg border border-slate-800 px-3 py-2 text-xs disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={
                      page >= result.meta.last_page
                    }
                    onClick={() =>
                      setPage((current) => current + 1)
                    }
                    className="rounded-lg border border-slate-800 px-3 py-2 text-xs disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </aside>

          <article className="min-h-[600px] rounded-2xl border border-slate-800 bg-slate-950/60">
            {selectedId === null ? (
              <div className="grid min-h-[600px] place-items-center text-center">
                <div>
                  <Inbox
                    size={38}
                    className="mx-auto text-slate-700"
                  />
                  <h3 className="mt-5 text-lg font-semibold">
                    Select a task
                  </h3>
                </div>
              </div>
            ) : detailQuery.isPending ? (
              <div className="grid min-h-[600px] place-items-center">
                <LoaderCircle className="animate-spin text-sky-400" />
              </div>
            ) : detailQuery.isError || !selected ? (
              <div className="grid min-h-[600px] place-items-center text-rose-200">
                The task could not be loaded.
              </div>
            ) : (
              <div>
                <div className="border-b border-slate-800 p-6">
                  <h2 className="text-2xl font-bold">
                    {selected.internal_request?.title ??
                      'Approval request'}
                  </h2>
                  <p className="mt-2 font-mono text-xs text-slate-600">
                    {selected.internal_request
                      ?.reference_number}
                  </p>
                </div>

                <div className="space-y-5 p-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs text-slate-600">
                        Requester
                      </p>
                      <p className="mt-2 text-sm">
                        {selected.internal_request
                          ?.requester_employee
                          ?.full_name ?? 'Unknown'}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs text-slate-600">
                        Current step
                      </p>
                      <p className="mt-2 text-sm">
                        {selected.workflow_step?.name ??
                          'Unknown'}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs text-slate-600">
                        Due
                      </p>
                      <p className="mt-2 text-sm">
                        {formatDate(selected.due_at)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <h3 className="font-semibold">
                      Request description
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-400">
                      {selected.internal_request
                        ?.description ??
                        'No description was provided.'}
                    </p>
                  </div>

                  {selected.status === 'pending' &&
                    (selected.can_approve ||
                      selected.can_reject) && (
                      <div className="rounded-2xl border border-sky-400/15 bg-sky-500/5 p-5">
                        <h3 className="font-semibold">
                          Record decision
                        </h3>

                        {actionError && (
                          <div className="mt-4 flex gap-3 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                            <AlertTriangle size={17} />
                            <span>{actionError}</span>
                          </div>
                        )}

                        <textarea
                          rows={4}
                          value={note}
                          onChange={(event) =>
                            setNote(event.target.value)
                          }
                          placeholder="Optional approval note or required rejection reason"
                          className="mt-4 w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm outline-none"
                        />

                        <div className="mt-4 flex justify-end gap-3">
                          {selected.can_reject && (
                            <button
                              type="button"
                              disabled={acting}
                              onClick={() => {
                                if (note.trim().length < 3) {
                                  setActionError(
                                    'A rejection reason is required.',
                                  )
                                  return
                                }
                                rejectMutation.mutate(selected)
                              }}
                              className="flex h-11 items-center gap-2 rounded-xl border border-rose-400/30 px-5 text-sm text-rose-300 disabled:opacity-50"
                            >
                              <X size={16} />
                              Reject
                            </button>
                          )}

                          {selected.can_approve && (
                            <button
                              type="button"
                              disabled={acting}
                              onClick={() =>
                                approveMutation.mutate(
                                  selected,
                                )
                              }
                              className="flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-slate-950 disabled:opacity-50"
                            >
                              <Check size={16} />
                              Approve
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}
          </article>
        </section>
      </div>
    </main>
  )
}

export default ApprovalsPage