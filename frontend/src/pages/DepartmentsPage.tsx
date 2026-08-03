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
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CirclePower,
  Edit3,
  Filter,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import type { AxiosError } from 'axios'
import { useToast } from '../components/feedback/toastContext'
import { authService } from '../services/authService'
import { departmentService } from '../services/departmentService'
import {
  departmentSchema,
  type DepartmentFormValues,
} from '../features/departments/departmentSchema'
import type {
  Department,
  DepartmentFilters,
  DepartmentPayload,
} from '../types/department'

interface LaravelErrorResponse {
  message?: string
  errors?: Record<string, string[]>
}

interface DepartmentDialogProps {
  department: Department | null
  isSubmitting: boolean
  serverError: string | null
  onClose: () => void
  onSubmit: (payload: DepartmentPayload) => void
}

const initialFilters: DepartmentFilters = {
  page: 1,
  search: '',
  status: 'all',
  sort: 'newest',
  per_page: 15,
}

const emptyForm: DepartmentFormValues = {
  name: '',
  code: '',
  description: '',
  is_active: true,
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'â€”'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'â€”'
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
  }).format(date)
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

function DepartmentDialog({
  department,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
}: DepartmentDialogProps) {
  const [form, setForm] =
    useState<DepartmentFormValues>(() =>
      department
        ? {
            name: department.name,
            code: department.code,
            description:
              department.description ?? '',
            is_active: department.is_active,
          }
        : emptyForm,
    )

  const [errors, setErrors] = useState<
    Partial<Record<keyof DepartmentFormValues, string>>
  >({})

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const result = departmentSchema.safeParse(form)

    if (!result.success) {
      const fieldErrors: Partial<
        Record<keyof DepartmentFormValues, string>
      > = {}

      for (const issue of result.error.issues) {
        const field = issue.path[0]

        if (
          typeof field === 'string' &&
          fieldErrors[
            field as keyof DepartmentFormValues
          ] === undefined
        ) {
          fieldErrors[
            field as keyof DepartmentFormValues
          ] = issue.message
        }
      }

      setErrors(fieldErrors)

      return
    }

    setErrors({})

    onSubmit({
      name: result.data.name,
      code: result.data.code.toUpperCase(),
      description:
        result.data.description === ''
          ? null
          : result.data.description,
      is_active: result.data.is_active,
    })
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-700/80 bg-[#07101f] shadow-2xl shadow-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-sky-400">
              Organization structure
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              {department
                ? 'Edit department'
                : 'Create department'}
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

          <label className="block">
            <span className="mb-2 block text-xs font-medium text-slate-400">
              Department name
            </span>

            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Human Resources"
              className="h-12 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-sky-400/40"
            />

            {errors.name && (
              <p className="mt-2 text-xs text-rose-300">
                {errors.name}
              </p>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-medium text-slate-400">
              Department code
            </span>

            <input
              value={form.code}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  code: event.target.value.toUpperCase(),
                }))
              }
              placeholder="HR"
              className="h-12 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 font-mono text-sm uppercase text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-sky-400/40"
            />

            {errors.code && (
              <p className="mt-2 text-xs text-rose-300">
                {errors.code}
              </p>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-medium text-slate-400">
              Description
            </span>

            <textarea
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Describe this department's responsibilities."
              className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-sky-400/40"
            />

            {errors.description && (
              <p className="mt-2 text-xs text-rose-300">
                {errors.description}
              </p>
            )}
          </label>

          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div>
              <p className="text-sm font-medium">
                Active department
              </p>

              <p className="mt-1 text-xs text-slate-600">
                Inactive departments remain stored but are
                marked unavailable.
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
              className="flex h-11 items-center gap-2 rounded-xl bg-sky-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && (
                <LoaderCircle
                  size={16}
                  className="animate-spin"
                />
              )}

              {department
                ? 'Save changes'
                : 'Create department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DepartmentsPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [draftFilters, setDraftFilters] =
    useState<DepartmentFilters>(initialFilters)

  const [filters, setFilters] =
    useState<DepartmentFilters>(initialFilters)

  const [dialogOpen, setDialogOpen] = useState(false)

  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null)

  const [mutationError, setMutationError] = useState<
    string | null
  >(null)

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
    user?.permissions?.includes('departments.view') ??
    false

  const canCreate =
    user?.permissions?.includes('departments.create') ??
    false

  const canUpdate =
    user?.permissions?.includes('departments.update') ??
    false

  const canDelete =
    user?.permissions?.includes('departments.delete') ??
    false

  const departmentsQuery = useQuery({
    queryKey: ['departments', filters],
    queryFn: () => departmentService.list(filters),
    enabled: canView,
  })

  const closeDialogAfterSuccess = () => {
    setDialogOpen(false)
    setSelectedDepartment(null)
    setMutationError(null)
  }

  const refreshRelatedQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['departments'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['dashboard-summary'],
      }),
    ])
  }

  const createMutation = useMutation({
    mutationFn: departmentService.create,
    onSuccess: async () => {
      await refreshRelatedQueries()
      closeDialogAfterSuccess()
      toast.success('Department created successfully')
    },
    onError: (error) => {
      const message = extractErrorMessage(error)
      setMutationError(message)
      toast.error('Department creation failed', message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      departmentId,
      payload,
    }: {
      departmentId: number
      payload: DepartmentPayload
    }) =>
      departmentService.update(
        departmentId,
        payload,
      ),

    onSuccess: async () => {
      await refreshRelatedQueries()
      closeDialogAfterSuccess()
      toast.success('Department updated successfully')
    },

    onError: (error) => {
      const message = extractErrorMessage(error)
      setMutationError(message)
      toast.error('Department update failed', message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: departmentService.remove,

    onSuccess: async () => {
      await refreshRelatedQueries()
      toast.success('Department deleted successfully')
    },

    onError: (error) => {
      toast.error('Department deletion failed', extractErrorMessage(error))
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
    setSelectedDepartment(null)
    setMutationError(null)
  }

  const openCreateDialog = () => {
    setSelectedDepartment(null)
    setMutationError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (department: Department) => {
    setSelectedDepartment(department)
    setMutationError(null)
    setDialogOpen(true)
  }

  const handleSave = (payload: DepartmentPayload) => {
    setMutationError(null)

    if (selectedDepartment) {
      updateMutation.mutate({
        departmentId: selectedDepartment.id,
        payload,
      })

      return
    }

    createMutation.mutate(payload)
  }

  const handleDelete = (department: Department) => {
    const confirmed = window.confirm(
      `Delete "${department.name}"? This action cannot be undone.`,
    )

    if (!confirmed) {
      return
    }

    deleteMutation.mutate(department.id)
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

  const resetFilters = () => {
    setDraftFilters(initialFilters)
    setFilters(initialFilters)
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

  const result = departmentsQuery.data
  const departments = result?.data ?? []

  const activeCount = departments.filter(
    (department) => department.is_active,
  ).length

  const inactiveCount =
    departments.length - activeCount

  return (
    <main className="min-h-screen bg-[#050b18] text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-[1500px] items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 bg-slate-900/70 text-slate-400 transition hover:border-sky-400/30 hover:text-sky-300"
              aria-label="Return to dashboard"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="grid h-11 w-11 place-items-center rounded-xl border border-sky-400/15 bg-sky-500/10 text-sky-300">
              <Building2 size={22} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Organization
              </p>

              <h1 className="font-semibold">
                Departments
              </h1>
            </div>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={openCreateDialog}
              className="flex h-11 items-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              <Plus size={17} />
              New department
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] p-5 md:p-8">
        <section className="relative overflow-hidden rounded-3xl border border-sky-400/10 bg-gradient-to-br from-blue-950/65 via-slate-950 to-cyan-950/30 p-7">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">
              Company structure
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight">
              Manage operational departments
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Create and maintain the organization units used
              by employees, permissions and future workflow
              routing.
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: 'Total records',
              value: result?.meta.total ?? 0,
              icon: Building2,
            },
            {
              label: 'Active on this page',
              value: activeCount,
              icon: CheckCircle2,
            },
            {
              label: 'Inactive on this page',
              value: inactiveCount,
              icon: CirclePower,
            },
          ].map((item) => {
            const Icon = item.icon

            return (
              <article
                key={item.label}
                className="rounded-2xl border border-slate-800/80 bg-slate-950/55 p-5"
              >
                <Icon
                  size={18}
                  className="text-sky-300"
                />

                <p className="mt-5 text-2xl font-bold">
                  {item.value}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {item.label}
                </p>
              </article>
            )
          })}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-950/55 p-5">
          <form
            onSubmit={applyFilters}
            className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_auto]"
          >
            <label>
              <span className="mb-2 block text-xs text-slate-500">
                Search departments
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
                      .value as DepartmentFilters['status'],
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300 outline-none focus:border-sky-400/40"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
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
                      .value as DepartmentFilters['sort'],
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300 outline-none focus:border-sky-400/40"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name_asc">Name Aâ€“Z</option>
                <option value="name_desc">Name Zâ€“A</option>
                <option value="code_asc">Code Aâ€“Z</option>
                <option value="code_desc">Code Zâ€“A</option>
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
                onClick={resetFilters}
                className="h-11 rounded-xl border border-slate-800 px-4 text-sm text-slate-400 transition hover:text-slate-200"
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
                Department directory
              </h3>

              <p className="mt-1 text-xs text-slate-600">
                {result?.meta.total ?? 0} departments found
              </p>
            </div>

            <div className="flex items-center gap-3">
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

                  setFilters((current) => ({
                    ...current,
                    page: 1,
                    per_page: perPage,
                  }))
                }}
                className="h-10 rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-300 outline-none"
              >
                <option value={15}>15 per page</option>
                <option value={30}>30 per page</option>
                <option value={50}>50 per page</option>
              </select>

              <button
                type="button"
                onClick={() =>
                  void departmentsQuery.refetch()
                }
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 text-slate-500 transition hover:text-sky-300"
                aria-label="Refresh departments"
              >
                <RefreshCw
                  size={16}
                  className={
                    departmentsQuery.isFetching
                      ? 'animate-spin'
                      : ''
                  }
                />
              </button>
            </div>
          </div>

          {departmentsQuery.isError && (
            <div className="flex items-center gap-3 border-b border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-200">
              <AlertTriangle size={18} />
              Departments could not be loaded.
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800/80">
              <thead className="bg-slate-950/70">
                <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-slate-600">
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4">Code</th>
                  <th className="px-5 py-4">Description</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Created</th>
                  <th className="px-5 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60">
                {departmentsQuery.isPending ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center"
                    >
                      <LoaderCircle
                        size={28}
                        className="mx-auto animate-spin text-sky-400"
                      />

                      <p className="mt-4 text-sm text-slate-600">
                        Loading departments...
                      </p>
                    </td>
                  </tr>
                ) : departments.length > 0 ? (
                  departments.map((department) => (
                    <tr
                      key={department.id}
                      className="transition hover:bg-slate-900/40"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/10 text-sky-300">
                            <Building2 size={17} />
                          </div>

                          <p className="font-medium text-slate-200">
                            {department.name}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 font-mono text-xs text-slate-300">
                          {department.code}
                        </span>
                      </td>

                      <td className="max-w-sm px-5 py-4 text-xs leading-6 text-slate-500">
                        {department.description ??
                          'No description'}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                            department.is_active
                              ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
                              : 'border-slate-600 bg-slate-800/70 text-slate-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              department.is_active
                                ? 'bg-emerald-400'
                                : 'bg-slate-500'
                            }`}
                          />

                          {department.is_active
                            ? 'Active'
                            : 'Inactive'}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        {formatDate(
                          department.created_at,
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {canUpdate && (
                            <button
                              type="button"
                              onClick={() =>
                                openEditDialog(department)
                              }
                              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 text-slate-500 transition hover:border-sky-400/30 hover:text-sky-300"
                              aria-label={`Edit ${department.name}`}
                            >
                              <Edit3 size={15} />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              disabled={
                                deleteMutation.isPending
                              }
                              onClick={() =>
                                handleDelete(department)
                              }
                              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 text-slate-500 transition hover:border-rose-400/30 hover:text-rose-300 disabled:opacity-40"
                              aria-label={`Delete ${department.name}`}
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
                      colSpan={6}
                      className="px-5 py-16 text-center"
                    >
                      <Building2
                        size={28}
                        className="mx-auto text-slate-700"
                      />

                      <p className="mt-4 text-sm text-slate-500">
                        No departments match the filters.
                      </p>
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
                  aria-label="Previous page"
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
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {dialogOpen && (
        <DepartmentDialog
          key={selectedDepartment?.id ?? 'new'}
          department={selectedDepartment}
          isSubmitting={
            createMutation.isPending ||
            updateMutation.isPending
          }
          serverError={mutationError}
          onClose={closeDialog}
          onSubmit={handleSave}
        />
      )}
    </main>
  )
}

export default DepartmentsPage

