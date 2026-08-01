import {
  type FormEvent,
  useEffect,
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
  AlertTriangle,
  ArrowLeft,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Filter,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Workflow,
  X,
} from 'lucide-react'
import type { AxiosError } from 'axios'
import { authService } from '../services/authService'
import { requestTypeService } from '../services/requestTypeService'
import { workflowService } from '../services/workflowService'
import {
  requestTypeSchema,
  type RequestTypeFormValues,
} from '../features/requests/requestSchemas'
import type {
  RequestType,
  RequestTypeFilters,
  RequestTypePayload,
} from '../types/internalRequest'

interface LaravelErrorResponse {
  message?: string
  errors?: Record<string, string[]>
}

interface RequestTypeDialogProps {
  requestType: RequestType | null
  workflows: {
    id: number
    name: string
    code: string
    version: number
    is_active: boolean
  }[]
  isSubmitting: boolean
  serverError: string | null
  onClose: () => void
  onSubmit: (payload: RequestTypePayload) => void
}

const initialFilters: RequestTypeFilters = {
  page: 1,
  search: '',
  status: 'all',
  per_page: 15,
}

const emptyForm: RequestTypeFormValues = {
  workflow_definition_id: '',
  name: '',
  code: '',
  description: '',
  instructions: '',
  is_active: true,
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

function RequestTypeDialog({
  requestType,
  workflows,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
}: RequestTypeDialogProps) {
  const [form, setForm] =
    useState<RequestTypeFormValues>(emptyForm)

  const [errors, setErrors] = useState<
    Partial<Record<keyof RequestTypeFormValues, string>>
  >({})

  useEffect(() => {
    if (requestType) {
      setForm({
        workflow_definition_id:
          requestType.workflow_definition_id.toString(),
        name: requestType.name,
        code: requestType.code,
        description: requestType.description ?? '',
        instructions: requestType.instructions ?? '',
        is_active: requestType.is_active,
      })
    } else {
      setForm(emptyForm)
    }

    setErrors({})
  }, [requestType])

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const result = requestTypeSchema.safeParse(form)

    if (!result.success) {
      const nextErrors: Partial<
        Record<keyof RequestTypeFormValues, string>
      > = {}

      for (const issue of result.error.issues) {
        const field = issue.path[0]

        if (
          typeof field === 'string' &&
          nextErrors[
            field as keyof RequestTypeFormValues
          ] === undefined
        ) {
          nextErrors[
            field as keyof RequestTypeFormValues
          ] = issue.message
        }
      }

      setErrors(nextErrors)

      return
    }

    setErrors({})

    onSubmit({
      workflow_definition_id: Number(
        result.data.workflow_definition_id,
      ),
      name: result.data.name,
      code: result.data.code.toUpperCase(),
      description: nullableString(
        result.data.description,
      ),
      instructions: nullableString(
        result.data.instructions,
      ),
      is_active: result.data.is_active,
    })
  }

  const fieldClass =
    'h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-sky-400/40'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="mx-auto my-4 w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-700/80 bg-[#07101f] shadow-2xl shadow-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-sky-400">
              Request catalog
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              {requestType
                ? 'Edit request type'
                : 'Create request type'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 text-slate-500 transition hover:text-slate-200 disabled:opacity-40"
            aria-label="Close dialog"
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
              Workflow
            </span>

            <select
              value={form.workflow_definition_id}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  workflow_definition_id:
                    event.target.value,
                }))
              }
              className={fieldClass}
            >
              <option value="">Select workflow</option>

              {workflows.map((workflow) => (
                <option
                  key={workflow.id}
                  value={workflow.id}
                >
                  {workflow.name} ({workflow.code} v
                  {workflow.version})
                </option>
              ))}
            </select>

            {errors.workflow_definition_id && (
              <p className="mt-2 text-xs text-rose-300">
                {errors.workflow_definition_id}
              </p>
            )}
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-xs text-slate-500">
                Name
              </span>

              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Leave Request"
                className={fieldClass}
              />

              {errors.name && (
                <p className="mt-2 text-xs text-rose-300">
                  {errors.name}
                </p>
              )}
            </label>

            <label>
              <span className="mb-2 block text-xs text-slate-500">
                Code
              </span>

              <input
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    code: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="LEAVE"
                className={`${fieldClass} font-mono uppercase`}
              />

              {errors.code && (
                <p className="mt-2 text-xs text-rose-300">
                  {errors.code}
                </p>
              )}
            </label>
          </div>

          <label>
            <span className="mb-2 block text-xs text-slate-500">
              Description
            </span>

            <textarea
              rows={3}
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
              Instructions shown to requesters
            </span>

            <textarea
              rows={4}
              value={form.instructions}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  instructions: event.target.value,
                }))
              }
              className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm leading-6 text-slate-200 outline-none transition focus:border-sky-400/40"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
            <div>
              <p className="text-sm">
                Active request type
              </p>

              <p className="mt-1 text-xs text-slate-600">
                Available when creating new requests
              </p>
            </div>

            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  is_active: event.target.checked,
                }))
              }
              className="h-5 w-5 accent-sky-500"
            />
          </label>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 rounded-xl border border-slate-700 px-5 text-sm text-slate-400 transition hover:text-slate-200 disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-11 items-center gap-2 rounded-xl bg-sky-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
            >
              {isSubmitting && (
                <LoaderCircle
                  size={16}
                  className="animate-spin"
                />
              )}

              {requestType
                ? 'Save request type'
                : 'Create request type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RequestTypesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [draftFilters, setDraftFilters] =
    useState<RequestTypeFilters>(
      initialFilters,
    )

  const [filters, setFilters] =
    useState<RequestTypeFilters>(
      initialFilters,
    )

  const [dialogOpen, setDialogOpen] =
    useState(false)

  const [editingRequestType, setEditingRequestType] =
    useState<RequestType | null>(null)

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
      'request-types.view',
    ) ?? false

  const canCreate =
    user?.permissions?.includes(
      'request-types.create',
    ) ?? false

  const canUpdate =
    user?.permissions?.includes(
      'request-types.update',
    ) ?? false

  const canDelete =
    user?.permissions?.includes(
      'request-types.delete',
    ) ?? false

  const requestTypesQuery = useQuery({
    queryKey: ['request-types', filters],
    queryFn: () =>
      requestTypeService.list(filters),
    enabled: canView,
  })

  const workflowsQuery = useQuery({
    queryKey: ['workflow-definitions', 'request-type-options'],
    queryFn: () =>
      workflowService.list({
        page: 1,
        search: '',
        status: 'active',
        sort: 'name_asc',
        per_page: 100,
      }),
    enabled: canView && dialogOpen,
  })

  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['request-types'],
    })
  }

  const createMutation = useMutation({
    mutationFn: requestTypeService.create,

    onSuccess: async () => {
      await refresh()
      closeDialog()
    },

    onError: (error) => {
      setMutationError(
        extractErrorMessage(error),
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      requestTypeId,
      payload,
    }: {
      requestTypeId: number
      payload: RequestTypePayload
    }) =>
      requestTypeService.update(
        requestTypeId,
        payload,
      ),

    onSuccess: async () => {
      await refresh()
      closeDialog()
    },

    onError: (error) => {
      setMutationError(
        extractErrorMessage(error),
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: requestTypeService.remove,

    onSuccess: refresh,

    onError: (error) => {
      window.alert(extractErrorMessage(error))
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
    setEditingRequestType(null)
    setMutationError(null)
  }

  const openCreate = () => {
    setEditingRequestType(null)
    setMutationError(null)
    setDialogOpen(true)
  }

  const openEdit = (requestType: RequestType) => {
    setEditingRequestType(requestType)
    setMutationError(null)
    setDialogOpen(true)
  }

  const saveRequestType = (
    payload: RequestTypePayload,
  ) => {
    if (editingRequestType) {
      updateMutation.mutate({
        requestTypeId: editingRequestType.id,
        payload,
      })

      return
    }

    createMutation.mutate(payload)
  }

  const removeRequestType = (
    requestType: RequestType,
  ) => {
    const confirmed = window.confirm(
      `Delete request type "${requestType.name}"?`,
    )

    if (!confirmed) {
      return
    }

    deleteMutation.mutate(requestType.id)
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

  const result = requestTypesQuery.data
  const requestTypes = result?.data ?? []

  return (
    <main className="min-h-screen bg-[#050b18] text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-[1500px] items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 bg-slate-900/70 text-slate-400 transition hover:text-sky-300"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="grid h-11 w-11 place-items-center rounded-xl border border-sky-400/15 bg-sky-500/10 text-sky-300">
              <Boxes size={22} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Request administration
              </p>

              <h1 className="font-semibold">
                Request Types
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
              New request type
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] p-5 md:p-8">
        <section className="relative overflow-hidden rounded-3xl border border-sky-400/10 bg-gradient-to-br from-blue-950/65 via-slate-950 to-cyan-950/30 p-7">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">
              Service catalog
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight">
              Connect request forms to workflows
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Each request type selects the workflow that
              starts when an employee submits that request.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-950/55 p-5">
          <form
            onSubmit={applyFilters}
            className="grid gap-4 lg:grid-cols-[2fr_1fr_auto]"
          >
            <label>
              <span className="mb-2 block text-xs text-slate-500">
                Search request types
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
                  placeholder="Name, code or description"
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
                      .value as RequestTypeFilters['status'],
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300 outline-none"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">
                  Inactive
                </option>
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

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/55">
          <div className="flex items-center justify-between border-b border-slate-800/80 p-5">
            <div>
              <h3 className="font-semibold">
                Request type catalog
              </h3>

              <p className="mt-1 text-xs text-slate-600">
                {result?.meta.total ?? 0} types found
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void requestTypesQuery.refetch()
              }
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 text-slate-500 hover:text-sky-300"
            >
              <RefreshCw
                size={16}
                className={
                  requestTypesQuery.isFetching
                    ? 'animate-spin'
                    : ''
                }
              />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800/80">
              <thead className="bg-slate-950/70">
                <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-slate-600">
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Workflow</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60">
                {requestTypesQuery.isPending ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-16 text-center"
                    >
                      <LoaderCircle
                        size={28}
                        className="mx-auto animate-spin text-sky-400"
                      />
                    </td>
                  </tr>
                ) : requestTypes.length > 0 ? (
                  requestTypes.map((requestType) => (
                    <tr key={requestType.id}>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-200">
                          {requestType.name}
                        </p>

                        <p className="mt-1 font-mono text-[11px] text-slate-600">
                          {requestType.code}
                        </p>

                        <p className="mt-2 max-w-xl text-xs leading-6 text-slate-600">
                          {requestType.description ??
                            'No description'}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Workflow size={14} />

                          {requestType.workflow_definition
                            ? `${requestType.workflow_definition.name} (${requestType.workflow_definition.code} v${requestType.workflow_definition.version})`
                            : 'Unknown workflow'}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                            requestType.is_active
                              ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
                              : 'border-slate-700 bg-slate-900 text-slate-500'
                          }`}
                        >
                          {requestType.is_active
                            ? 'Active'
                            : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {canUpdate && (
                            <button
                              type="button"
                              onClick={() =>
                                openEdit(requestType)
                              }
                              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 text-slate-500 hover:text-sky-300"
                            >
                              <Edit3 size={15} />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() =>
                                removeRequestType(
                                  requestType,
                                )
                              }
                              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 text-slate-500 hover:text-rose-300"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-16 text-center text-sm text-slate-500"
                    >
                      No request types found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {result && result.meta.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800/80 p-5">
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
        </section>
      </div>

      {dialogOpen && (
        <RequestTypeDialog
          requestType={editingRequestType}
          workflows={
            workflowsQuery.data?.data ?? []
          }
          isSubmitting={
            createMutation.isPending ||
            updateMutation.isPending
          }
          serverError={mutationError}
          onClose={closeDialog}
          onSubmit={saveRequestType}
        />
      )}
    </main>
  )
}

export default RequestTypesPage