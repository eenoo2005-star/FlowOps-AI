import {
  type FormEvent,
  useState,
} from 'react'
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
  MessageSquare,
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock3,
  Edit3,
  FileText,
  Filter,
  GitBranch,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import type { AxiosError } from 'axios'
import { SearchablePicker } from '../components/forms/SearchablePicker'
import { useToast } from '../components/feedback/toastContext'
import { authService } from '../services/authService'
import { employeeService } from '../services/employeeService'
import { internalRequestService } from '../services/internalRequestService'
import { requestTypeService } from '../services/requestTypeService'
import {
  internalRequestSchema,
  type InternalRequestFormValues,
} from '../features/requests/requestSchemas'
import type { Employee } from '../types/employee'
import type {
  CreateInternalRequestPayload,
  InternalRequest,
  InternalRequestFilters,
  InternalRequestStatus,
  RequestPriority,
  RequestType,
  UpdateInternalRequestPayload,
} from '../types/internalRequest'

interface LaravelErrorResponse {
  message?: string
  errors?: Record<string, string[]>
}

interface RequestDialogProps {
  request: InternalRequest | null
  requestTypes: RequestType[]
  requestTypesLoading: boolean
  requestTypesError: boolean
  employees: Employee[]
  canCreateForOthers: boolean
  isSubmitting: boolean
  serverError: string | null
  onClose: () => void
  onSubmit: (
    payload:
      | CreateInternalRequestPayload
      | UpdateInternalRequestPayload,
  ) => void
}

const initialFilters: InternalRequestFilters = {
  page: 1,
  search: '',
  status: 'all',
  priority: 'all',
  request_type_id: null,
  per_page: 15,
}

const emptyForm: InternalRequestFormValues = {
  request_type_id: '',
  requester_employee_id: '',
  on_behalf_of_reason: '',
  title: '',
  description: '',
  priority: 'normal',
}

const statusLabels: Record<
  InternalRequestStatus,
  string
> = {
  draft: 'Draft',
  in_review: 'In review',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

function extractErrorMessage(error: unknown): string {
  const axiosError =
    error as AxiosError<LaravelErrorResponse>

  const validationErrors =
    axiosError.response?.data?.errors

  if (validationErrors) {
    const firstMessage = Object.values(
      validationErrors,
    ).flat()[0]

    if (firstMessage) {
      return firstMessage
    }
  }

  return (
    axiosError.response?.data?.message ??
    'The operation could not be completed.'
  )
}

function nullableString(value: string): string | null {
  const normalized = value.trim()

  return normalized === '' ? null : normalized
}

function formatDateTime(value: string | null): string {
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

function statusClasses(
  status: InternalRequestStatus,
): string {
  if (status === 'approved') {
    return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
  }

  if (status === 'rejected') {
    return 'border-rose-400/20 bg-rose-500/10 text-rose-300'
  }

  if (status === 'in_review') {
    return 'border-sky-400/20 bg-sky-500/10 text-sky-300'
  }

  if (status === 'cancelled') {
    return 'border-slate-700 bg-slate-900 text-slate-500'
  }

  return 'border-amber-400/20 bg-amber-500/10 text-amber-300'
}

function RequestDialog({
  request,
  requestTypes,
  requestTypesLoading,
  requestTypesError,
  employees,
  canCreateForOthers,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
}: RequestDialogProps) {
  const [form, setForm] =
    useState<InternalRequestFormValues>(() =>
      request
        ? {
            request_type_id:
              request.request_type_id.toString(),
            requester_employee_id:
              request.requester_employee_id.toString(),
            on_behalf_of_reason:
              request.on_behalf_of_reason ?? '',
            title: request.title,
            description:
              request.description ?? '',
            priority: request.priority,
          }
        : emptyForm,
    )

  const [errors, setErrors] = useState<
    Partial<
      Record<
        keyof InternalRequestFormValues,
        string
      >
    >
  >({})

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const result =
      internalRequestSchema.safeParse(form)

    if (!result.success) {
      const nextErrors: Partial<
        Record<
          keyof InternalRequestFormValues,
          string
        >
      > = {}

      for (const issue of result.error.issues) {
        const field = issue.path[0]

        if (
          typeof field === 'string' &&
          nextErrors[
            field as keyof InternalRequestFormValues
          ] === undefined
        ) {
          nextErrors[
            field as keyof InternalRequestFormValues
          ] = issue.message
        }
      }

      setErrors(nextErrors)

      return
    }

    setErrors({})

    if (request) {
      onSubmit({
        title: result.data.title,
        description: nullableString(
          result.data.description,
        ),
        payload: request.payload,
        priority: result.data.priority,
      })

      return
    }

    onSubmit({
      request_type_id: Number(
        result.data.request_type_id,
      ),

      on_behalf_of_reason: nullableString(result.data.on_behalf_of_reason),

      requester_employee_id:
        result.data.requester_employee_id === ''
          ? null
          : Number(
              result.data.requester_employee_id,
            ),

      title: result.data.title,

      description: nullableString(
        result.data.description,
      ),

      payload: null,
      priority: result.data.priority,
    })
  }

  const fieldClass =
    'h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-sky-400/40 disabled:opacity-50'

  const requestTypeEmptyMessage = requestTypesLoading
    ? 'Loading active request types...'
    : requestTypesError
      ? 'Request types could not be loaded. Check permissions or refresh the page.'
      : 'No active request types. Create and activate a request type linked to an active workflow first.'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="mx-auto my-4 w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-700/80 bg-[#07101f] shadow-2xl shadow-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-sky-400">
              Internal request
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              {request
                ? 'Edit draft'
                : 'Create request draft'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 text-slate-500 hover:text-slate-200 disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          {serverError && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
              <AlertTriangle
                size={18}
                className="mt-0.5 shrink-0"
              />
              <span>{serverError}</span>
            </div>
          )}

          <label>
            <span className="mb-2 block text-xs text-slate-500">
              Request type
            </span>

            <SearchablePicker
              value={form.request_type_id}
              onChange={(value) => setForm((current) => ({ ...current, request_type_id: value }))}
              disabled={request !== null}
              placeholder="Select request type"
              searchPlaceholder="Search request types..."
              emptyMessage={requestTypeEmptyMessage}
              options={requestTypes.map((requestType) => ({ value: requestType.id.toString(), label: requestType.name, description: requestType.code }))}
            />

            {errors.request_type_id && (
              <p className="mt-2 text-xs text-rose-300">
                {errors.request_type_id}
              </p>
            )}
          </label>

          {canCreateForOthers && (
            <label>
              <span className="mb-2 block text-xs text-slate-500">
                Requester employee
              </span>

              <SearchablePicker
                value={form.requester_employee_id}
                onChange={(value) => setForm((current) => ({ ...current, requester_employee_id: value, on_behalf_of_reason: value === '' ? '' : current.on_behalf_of_reason }))}
                disabled={request !== null}
                placeholder="Use my linked employee record"
                searchPlaceholder="Search by name or employee number..."
                options={employees.map((employee) => ({ value: employee.id.toString(), label: employee.full_name, description: employee.employee_number }))}
              />

              {form.requester_employee_id !== '' && (
                <div className="mt-4">
                  <span className="mb-2 block text-xs text-slate-500">Reason for creating on behalf</span>
                  <textarea rows={3} value={form.on_behalf_of_reason} onChange={(event) => setForm((current) => ({ ...current, on_behalf_of_reason: event.target.value }))} placeholder="Explain why this request is being created for another employee." className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-200 outline-none focus:border-sky-400/40" />
                </div>
              )}
            </label>
          )}

          <label>
            <span className="mb-2 block text-xs text-slate-500">
              Title
            </span>

            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Annual leave for three days"
              className={fieldClass}
            />

            {errors.title && (
              <p className="mt-2 text-xs text-rose-300">
                {errors.title}
              </p>
            )}
          </label>

          <label>
            <span className="mb-2 block text-xs text-slate-500">
              Description
            </span>

            <textarea
              rows={5}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm leading-6 text-slate-200 outline-none transition focus:border-sky-400/40"
            />
          </label>

          <label>
            <span className="mb-2 block text-xs text-slate-500">
              Priority
            </span>

            <select
              value={form.priority}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  priority:
                    event.target.value as RequestPriority,
                }))
              }
              className={fieldClass}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 rounded-xl border border-slate-700 px-5 text-sm text-slate-400 disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-11 items-center gap-2 rounded-xl bg-sky-500 px-5 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-60"
            >
              {isSubmitting && (
                <LoaderCircle
                  size={16}
                  className="animate-spin"
                />
              )}

              {request
                ? 'Save draft'
                : 'Create draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function InternalRequestsPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [draftFilters, setDraftFilters] =
    useState<InternalRequestFilters>(
      initialFilters,
    )

  const [filters, setFilters] =
    useState<InternalRequestFilters>(
      initialFilters,
    )

  const [selectedRequestId, setSelectedRequestId] =
    useState<number | null>(null)

  const [dialogOpen, setDialogOpen] =
    useState(false)

  const [editingRequest, setEditingRequest] =
    useState<InternalRequest | null>(null)

  const [mutationError, setMutationError] =
    useState<string | null>(null)

  const {
    data: user,
    isPending: isUserPending,
    isError: isUserError,
  } = useQuery({
    queryKey: ['current-user'],
    queryFn: authService.getCurrentUser,
    retry: false,
  })

  const canView =
    user?.permissions?.includes(
      'requests.view',
    ) ?? false

  const canCreate =
    user?.permissions?.includes(
      'requests.create',
    ) ?? false

  const canCreateForOthers =
    user?.permissions?.includes(
      'requests.create_for_others',
    ) ?? false

  const canUpdate =
    user?.permissions?.includes(
      'requests.update',
    ) ?? false

  const canSubmit =
    user?.permissions?.includes(
      'requests.submit',
    ) ?? false

  const canDelete =
    user?.permissions?.includes(
      'requests.delete',
    ) ?? false

  const requestsQuery = useQuery({
    queryKey: ['internal-requests', filters],
    queryFn: () =>
      internalRequestService.list(filters),
    enabled: canView,
  })

  const selectedRequestQuery = useQuery({
    queryKey: [
      'internal-request',
      selectedRequestId,
    ],
    queryFn: () =>
      internalRequestService.show(
        selectedRequestId as number,
      ),
    enabled:
      canView && selectedRequestId !== null,
  })

  const activeRequestTypesQuery = useQuery({
    queryKey: ['request-types', 'active-options'],
    queryFn: requestTypeService.activeOptions,
    enabled: canView,
    retry: false,
  })

  const employeeOptionsQuery = useQuery({
    queryKey: ['employees', 'requester-options'],
    queryFn: () =>
      employeeService.list({
        page: 1,
        search: '',
        status: 'active',
        employment_type: 'all',
        department_id: null,
        sort: 'name_asc',
        per_page: 100,
      }),
    enabled:
      canCreateForOthers && dialogOpen,
  })

  const closeDialogAfterSuccess = () => {
    setDialogOpen(false)
    setEditingRequest(null)
    setMutationError(null)
  }

  const refreshRequests = async (
    requestId?: number,
  ) => {
    const operations = [
      queryClient.invalidateQueries({
        queryKey: ['internal-requests'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['workflow-tasks'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['dashboard-summary'],
      }),
    ]

    if (requestId !== undefined) {
      operations.push(
        queryClient.invalidateQueries({
          queryKey: [
            'internal-request',
            requestId,
          ],
        }),
      )
    }

    await Promise.all(operations)
  }

  const createMutation = useMutation({
    mutationFn: (
      payload:
        | CreateInternalRequestPayload
        | UpdateInternalRequestPayload,
    ) =>
      internalRequestService.create(
        payload as CreateInternalRequestPayload,
      ),

    onSuccess: async (request) => {
      setSelectedRequestId(request.id)
      await refreshRequests(request.id)
      closeDialogAfterSuccess()
      toast.success('Request draft created', `${request.reference_number} is ready for review.`)
    },

    onError: (error) => {
      setMutationError(
        extractErrorMessage(error),
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      requestId,
      payload,
    }: {
      requestId: number
      payload:
        | CreateInternalRequestPayload
        | UpdateInternalRequestPayload
    }) =>
      internalRequestService.update(
        requestId,
        payload as UpdateInternalRequestPayload,
      ),

    onSuccess: async (request) => {
      await refreshRequests(request.id)
      closeDialogAfterSuccess()
      toast.success('Request updated successfully', request.reference_number)
    },

    onError: (error) => {
      setMutationError(
        extractErrorMessage(error),
      )
    },
  })

  const submitMutation = useMutation({
    mutationFn: internalRequestService.submit,

    onSuccess: async (request) => {
      await refreshRequests(request.id)
      toast.success('Request submitted successfully', `${request.reference_number} entered the approval workflow.`)
    },

    onError: (error) => {
      toast.error('Request submission failed', extractErrorMessage(error))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: internalRequestService.remove,

    onSuccess: async (_, requestId) => {
      if (selectedRequestId === requestId) {
        setSelectedRequestId(null)
      }

      await refreshRequests()
      toast.success('Request deleted successfully')
    },

    onError: (error) => {
      toast.error('Request deletion failed', extractErrorMessage(error))
    },
  })

  const closeDialog = () => {
    if (
      createMutation.isPending ||
      updateMutation.isPending
    ) {
      return
    }

    setDialogOpen(false)
    setEditingRequest(null)
    setMutationError(null)
  }

  const openCreate = () => {
    setEditingRequest(null)
    setMutationError(null)
    setDialogOpen(true)
  }

  const openEdit = (request: InternalRequest) => {
    setEditingRequest(request)
    setMutationError(null)
    setDialogOpen(true)
  }

  const saveRequest = (
    payload:
      | CreateInternalRequestPayload
      | UpdateInternalRequestPayload,
  ) => {
    if (editingRequest) {
      updateMutation.mutate({
        requestId: editingRequest.id,
        payload,
      })

      return
    }

    createMutation.mutate(payload)
  }

  const submitRequest = (
    request: InternalRequest,
  ) => {
    const confirmed = window.confirm(
      `Submit ${request.reference_number}? The draft will enter its approval workflow.`,
    )

    if (!confirmed) {
      return
    }

    submitMutation.mutate(request.id)
  }

  const removeRequest = (
    request: InternalRequest,
  ) => {
    const confirmed = window.confirm(
      `Delete draft "${request.title}"?`,
    )

    if (!confirmed) {
      return
    }

    deleteMutation.mutate(request.id)
  }

  const applyFilters = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setFilters({
      ...draftFilters,
      page: 1,
    })
  }

  if (isUserError) {
    return <Navigate to="/login" replace />
  }

  if (isUserPending) {
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

  const result = requestsQuery.data
  const requests = result?.data ?? []
  const selectedRequest =
    selectedRequestQuery.data

  return (
    <main className="min-h-screen bg-[#050b18] text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-[1700px] items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 bg-slate-900/70 text-slate-400 hover:text-sky-300"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="grid h-11 w-11 place-items-center rounded-xl border border-sky-400/15 bg-sky-500/10 text-sky-300">
              <FileText size={22} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Workflow operations
              </p>

              <h1 className="font-semibold">
                Internal Requests
              </h1>
            </div>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={openCreate}
              className="flex h-11 items-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-semibold text-slate-950 hover:bg-sky-400"
            >
              <Plus size={17} />
              New request
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-[1700px] p-5 md:p-8">
        <section className="relative overflow-hidden rounded-3xl border border-sky-400/10 bg-gradient-to-br from-blue-950/65 via-slate-950 to-cyan-950/30 p-7">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">
              Request lifecycle
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight">
              Create, submit and track requests
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Draft a request, submit it into the selected
              workflow and follow its current step and task
              history.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-950/55 p-5">
          <form
            onSubmit={applyFilters}
            className="grid gap-4 xl:grid-cols-[2fr_1fr_1fr_1fr_auto]"
          >
            <label>
              <span className="mb-2 block text-xs text-slate-500">
                Search requests
              </span>

              <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-3">
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
                  placeholder="Reference, title or description"
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
                      .value as InternalRequestFilters['status'],
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="in_review">
                  In review
                </option>
                <option value="approved">
                  Approved
                </option>
                <option value="rejected">
                  Rejected
                </option>
                <option value="cancelled">
                  Cancelled
                </option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-xs text-slate-500">
                Priority
              </span>

              <select
                value={draftFilters.priority}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    priority: event.target
                      .value as InternalRequestFilters['priority'],
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300"
              >
                <option value="all">
                  All priorities
                </option>
                <option value="low">Low</option>
                <option value="normal">
                  Normal
                </option>
                <option value="high">High</option>
                <option value="urgent">
                  Urgent
                </option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-xs text-slate-500">
                Request type
              </span>

              <select
                value={
                  draftFilters.request_type_id?.toString() ??
                  ''
                }
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    request_type_id:
                      event.target.value === ''
                        ? null
                        : Number(event.target.value),
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300"
              >
                <option value="">All types</option>

                {activeRequestTypesQuery.data?.map(
                  (requestType) => (
                    <option
                      key={requestType.id}
                      value={requestType.id}
                    >
                      {requestType.name}
                    </option>
                  ),
                )}
              </select>
            </label>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex h-11 items-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-semibold text-slate-950 hover:bg-sky-400"
              >
                <Filter size={16} />
                Apply
              </button>

              <button
                type="button"
                onClick={() => {
                  setDraftFilters(initialFilters)
                  setFilters(initialFilters)
                }}
                className="h-11 rounded-xl border border-slate-800 px-4 text-sm text-slate-400"
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/55">
            <div className="flex items-center justify-between border-b border-slate-800/80 p-5">
              <div>
                <h3 className="font-semibold">
                  Requests
                </h3>

                <p className="mt-1 text-xs text-slate-600">
                  {result?.meta.total ?? 0} requests found
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void requestsQuery.refetch()
                }
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 text-slate-500 hover:text-sky-300"
              >
                <RefreshCw
                  size={16}
                  className={
                    requestsQuery.isFetching
                      ? 'animate-spin'
                      : ''
                  }
                />
              </button>
            </div>

            <div className="max-h-[760px] space-y-2 overflow-y-auto p-3">
              {requestsQuery.isPending ? (
                <div className="grid min-h-52 place-items-center">
                  <LoaderCircle
                    size={28}
                    className="animate-spin text-sky-400"
                  />
                </div>
              ) : requestsQuery.isError ? (
                <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                  Requests could not be loaded.
                </div>
              ) : requests.length > 0 ? (
                requests.map((request) => (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() =>
                      setSelectedRequestId(request.id)
                    }
                    className={`w-full rounded-2xl border p-4 text-left ${
                      selectedRequestId === request.id
                        ? 'border-sky-400/30 bg-sky-500/10'
                        : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-200">
                          {request.title}
                        </p>

                        <p className="mt-1 font-mono text-[11px] text-slate-600">
                          {request.reference_number}
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-2 py-1 text-[9px] font-semibold uppercase ${statusClasses(
                          request.status,
                        )}`}
                      >
                        {statusLabels[request.status]}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[11px] text-slate-600">
                      <span>
                        {request.request_type?.name ??
                          'Unknown type'}
                      </span>

                      <span className="capitalize">
                        {request.priority}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="grid min-h-52 place-items-center text-center">
                  <div>
                    <FileText
                      size={28}
                      className="mx-auto text-slate-700"
                    />

                    <p className="mt-4 text-sm text-slate-500">
                      No requests match the filters.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {result &&
              result.meta.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-slate-800/80 p-4">
                  <p className="text-xs text-slate-600">
                    Page {result.meta.current_page} of{' '}
                    {result.meta.last_page}
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={
                        result.meta.current_page <= 1
                      }
                      onClick={() =>
                        setFilters((current) => ({
                          ...current,
                          page:
                            result.meta.current_page - 1,
                        }))
                      }
                      className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 text-slate-500 disabled:opacity-30"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <button
                      type="button"
                      disabled={
                        result.meta.current_page >=
                        result.meta.last_page
                      }
                      onClick={() =>
                        setFilters((current) => ({
                          ...current,
                          page:
                            result.meta.current_page + 1,
                        }))
                      }
                      className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 text-slate-500 disabled:opacity-30"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
          </aside>

          <article className="min-h-[660px] overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/55">
            {selectedRequestId === null ? (
              <div className="grid min-h-[660px] place-items-center p-8 text-center">
                <div>
                  <FileText
                    size={38}
                    className="mx-auto text-slate-700"
                  />

                  <h3 className="mt-5 text-lg font-semibold">
                    Select a request
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                    Select a request to inspect its workflow
                    status and approval task timeline.
                  </p>
                </div>
              </div>
            ) : selectedRequestQuery.isPending ? (
              <div className="grid min-h-[660px] place-items-center">
                <LoaderCircle
                  size={30}
                  className="animate-spin text-sky-400"
                />
              </div>
            ) : selectedRequestQuery.isError ||
              !selectedRequest ? (
              <div className="grid min-h-[660px] place-items-center p-8 text-center text-rose-200">
                The selected request could not be loaded.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/80 p-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold">
                        {selectedRequest.title}
                      </h2>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${statusClasses(
                          selectedRequest.status,
                        )}`}
                      >
                        {
                          statusLabels[
                            selectedRequest.status
                          ]
                        }
                      </span>
                    </div>

                    <p className="mt-2 font-mono text-xs text-slate-600">
                      {selectedRequest.reference_number}
                    </p>
                  </div>

                  {selectedRequest.status ===
                    'draft' && (
                    <div className="flex gap-2">
                      {canUpdate && (
                        <button
                          type="button"
                          onClick={() =>
                            openEdit(
                              selectedRequest,
                            )
                          }
                          className="flex h-10 items-center gap-2 rounded-xl border border-slate-700 px-3 text-xs text-slate-400 hover:text-sky-300"
                        >
                          <Edit3 size={15} />
                          Edit
                        </button>
                      )}

                      {canSubmit && (
                        <button
                          type="button"
                          disabled={
                            submitMutation.isPending
                          }
                          onClick={() =>
                            submitRequest(
                              selectedRequest,
                            )
                          }
                          className="flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-3 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                        >
                          <Send size={15} />
                          Submit
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() =>
                            removeRequest(
                              selectedRequest,
                            )
                          }
                          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-700 text-slate-500 hover:text-rose-300"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-6 p-6">
                  <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <UserRound
                        size={17}
                        className="text-sky-300"
                      />

                      <p className="mt-4 text-sm font-semibold">
                        {selectedRequest
                          .requester_employee
                          ?.full_name ??
                          'Unknown'}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Requester
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <FileText
                        size={17}
                        className="text-sky-300"
                      />

                      <p className="mt-4 text-sm font-semibold">
                        {selectedRequest.request_type
                          ?.name ??
                          'Unknown'}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Request type
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <CircleDot
                        size={17}
                        className="text-sky-300"
                      />

                      <p className="mt-4 text-sm font-semibold">
                        {selectedRequest
                          .current_workflow_step
                          ?.name ??
                          'Not started'}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Current step
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <Clock3
                        size={17}
                        className="text-sky-300"
                      />

                      <p className="mt-4 text-sm font-semibold">
                        {formatDateTime(
                          selectedRequest.submitted_at,
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Submitted
                      </p>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-800 bg-slate-950/55 p-5">
                    <h3 className="font-semibold">
                      Request description
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-400">
                      {selectedRequest.description ??
                        'No description was provided.'}
                    </p>
                  </section>

                  <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sky-400/15 bg-sky-500/5 p-5">
                    <div>
                      <h3 className="font-semibold">
                        Collaboration and Audit
                      </h3>

                      <p className="mt-1 text-xs text-slate-600">
                        Comments, private attachments and the immutable request history.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/requests/${selectedRequest.id}/collaboration`,
                        )
                      }
                      className="flex h-10 items-center gap-2 rounded-xl bg-sky-500 px-4 text-xs font-semibold text-slate-950 hover:bg-sky-400"
                    >
                      <MessageSquare size={15} />
                      Open workspace
                    </button>
                  </section>
                  <section className="rounded-2xl border border-slate-800 bg-slate-950/55 p-5">
                    <div className="flex items-center gap-3">
                      <GitBranch
                        size={18}
                        className="text-sky-300"
                      />

                      <div>
                        <h3 className="font-semibold">
                          Workflow timeline
                        </h3>

                        <p className="mt-1 text-xs text-slate-600">
                          Runtime tasks created by the
                          workflow engine.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {selectedRequest.workflow_instance
                        ?.tasks?.length ? (
                        selectedRequest.workflow_instance.tasks.map(
                          (task) => (
                            <div
                              key={task.id}
                              className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                  <p className="font-medium text-slate-300">
                                    {task.workflow_step
                                      ?.name ??
                                      'Workflow task'}
                                  </p>

                                  <p className="mt-1 font-mono text-[11px] text-slate-700">
                                    {task.workflow_step
                                      ?.code}
                                  </p>
                                </div>

                                <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase text-slate-400">
                                  {task.status}
                                </span>
                              </div>

                              <div className="mt-4 grid gap-3 text-xs text-slate-600 sm:grid-cols-3">
                                <span>
                                  Assigned:{' '}
                                  {task.assigned_employee
                                    ?.full_name ??
                                    task.assigned_role ??
                                    'Unassigned'}
                                </span>

                                <span>
                                  Due:{' '}
                                  {formatDateTime(
                                    task.due_at,
                                  )}
                                </span>

                                <span>
                                  Acted:{' '}
                                  {formatDateTime(
                                    task.acted_at,
                                  )}
                                </span>
                              </div>
                            </div>
                          ),
                        )
                      ) : (
                        <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-slate-800 text-sm text-slate-600">
                          {selectedRequest.status ===
                          'draft'
                            ? 'Submit the draft to start its workflow.'
                            : 'No runtime tasks are available.'}
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </>
            )}
          </article>
        </section>
      </div>

      {dialogOpen && (
        <RequestDialog
          key={editingRequest?.id ?? 'new'}
          request={editingRequest}
          requestTypes={
            activeRequestTypesQuery.data ?? []
          }
          requestTypesLoading={
            activeRequestTypesQuery.isPending ||
            activeRequestTypesQuery.isFetching
          }
          requestTypesError={
            activeRequestTypesQuery.isError
          }
          employees={
            employeeOptionsQuery.data?.data ?? []
          }
          canCreateForOthers={canCreateForOthers}
          isSubmitting={
            createMutation.isPending ||
            updateMutation.isPending
          }
          serverError={mutationError}
          onClose={closeDialog}
          onSubmit={saveRequest}
        />
      )}
    </main>
  )
}

export default InternalRequestsPage

