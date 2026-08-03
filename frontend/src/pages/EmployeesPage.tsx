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
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Filter,
  LoaderCircle,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import type { AxiosError } from 'axios'
import { SearchablePicker } from '../components/forms/SearchablePicker'
import { useToast } from '../components/feedback/toastContext'
import { authService } from '../services/authService'
import { departmentService } from '../services/departmentService'
import { employeeService } from '../services/employeeService'
import {
  employeeSchema,
  type EmployeeFormValues,
} from '../features/employees/employeeSchema'
import type { Department } from '../types/department'
import type {
  Employee,
  EmployeeFilters,
  EmployeePayload,
  EmployeeStatus,
  EmploymentType,
} from '../types/employee'

interface LaravelErrorResponse {
  message?: string
  errors?: Record<string, string[]>
}

interface EmployeeDialogProps {
  employee: Employee | null
  departments: Department[]
  managers: Employee[]
  isSubmitting: boolean
  serverError: string | null
  onClose: () => void
  onSubmit: (payload: EmployeePayload) => void
}

const initialFilters: EmployeeFilters = {
  page: 1,
  search: '',
  status: 'all',
  employment_type: 'all',
  department_id: null,
  sort: 'newest',
  per_page: 15,
}

const emptyForm: EmployeeFormValues = {
  department_id: '',
  manager_id: '',
  employee_number: '',
  first_name: '',
  last_name: '',
  job_title: '',
  work_email: '',
  phone: '',
  hire_date: '',
  employment_type: 'full_time',
  status: 'active',
  avatar: '',
  notes: '',
}

const employmentTypeLabels: Record<
  EmploymentType,
  string
> = {
  full_time: 'Full time',
  part_time: 'Part time',
  contract: 'Contract',
  intern: 'Intern',
}

const statusLabels: Record<EmployeeStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  on_leave: 'On leave',
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

function formatDate(value: string | null): string {
  if (!value) {
    return 'â€”'
  }

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
  }).format(date)
}

function nullableString(value: string): string | null {
  const normalized = value.trim()

  return normalized === '' ? null : normalized
}

function statusClasses(status: EmployeeStatus): string {
  if (status === 'active') {
    return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
  }

  if (status === 'on_leave') {
    return 'border-amber-400/20 bg-amber-500/10 text-amber-300'
  }

  return 'border-slate-600 bg-slate-800/70 text-slate-400'
}

function EmployeeDialog({
  employee,
  departments,
  managers,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
}: EmployeeDialogProps) {
  const [form, setForm] =
    useState<EmployeeFormValues>(() =>
      employee
        ? {
            department_id:
              employee.department_id?.toString() ?? '',
            manager_id:
              employee.manager_id?.toString() ?? '',
            employee_number: employee.employee_number,
            first_name: employee.first_name,
            last_name: employee.last_name,
            job_title: employee.job_title ?? '',
            work_email: employee.work_email ?? '',
            phone: employee.phone ?? '',
            hire_date: employee.hire_date ?? '',
            employment_type:
              employee.employment_type,
            status: employee.status,
            avatar: employee.avatar ?? '',
            notes: employee.notes ?? '',
          }
        : emptyForm,
    )

  const [errors, setErrors] = useState<
    Partial<Record<keyof EmployeeFormValues, string>>
  >({})

  const availableManagers = managers.filter(
    (manager) => manager.id !== employee?.id,
  )

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const result = employeeSchema.safeParse(form)

    if (!result.success) {
      const fieldErrors: Partial<
        Record<keyof EmployeeFormValues, string>
      > = {}

      for (const issue of result.error.issues) {
        const field = issue.path[0]

        if (
          typeof field === 'string' &&
          fieldErrors[
            field as keyof EmployeeFormValues
          ] === undefined
        ) {
          fieldErrors[
            field as keyof EmployeeFormValues
          ] = issue.message
        }
      }

      setErrors(fieldErrors)

      return
    }

    setErrors({})

    onSubmit({
      department_id:
        result.data.department_id === ''
          ? null
          : Number(result.data.department_id),

      manager_id:
        result.data.manager_id === ''
          ? null
          : Number(result.data.manager_id),

      employee_number:
        result.data.employee_number.toUpperCase(),

      first_name: result.data.first_name,
      last_name: result.data.last_name,
      job_title: nullableString(result.data.job_title),
      work_email: nullableString(
        result.data.work_email,
      ),
      phone: nullableString(result.data.phone),
      hire_date: nullableString(result.data.hire_date),
      employment_type: result.data.employment_type,
      status: result.data.status,
      avatar: nullableString(result.data.avatar),
      notes: nullableString(result.data.notes),
    })
  }

  const fieldClass =
    'h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-sky-400/40'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="mx-auto my-4 w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-700/80 bg-[#07101f] shadow-2xl shadow-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-sky-400">
              Workforce directory
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              {employee
                ? 'Edit employee'
                : 'Create employee'}
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
          className="space-y-6 p-6"
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

          <section>
            <h3 className="text-sm font-semibold">
              Identity
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label>
                <span className="mb-2 block text-xs text-slate-500">
                  Employee number
                </span>

                <input
                  value={form.employee_number}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      employee_number:
                        event.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="EMP-1001"
                  className={`${fieldClass} font-mono uppercase`}
                />

                {errors.employee_number && (
                  <p className="mt-2 text-xs text-rose-300">
                    {errors.employee_number}
                  </p>
                )}
              </label>

              <label>
                <span className="mb-2 block text-xs text-slate-500">
                  First name
                </span>

                <input
                  value={form.first_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      first_name: event.target.value,
                    }))
                  }
                  className={fieldClass}
                />

                {errors.first_name && (
                  <p className="mt-2 text-xs text-rose-300">
                    {errors.first_name}
                  </p>
                )}
              </label>

              <label>
                <span className="mb-2 block text-xs text-slate-500">
                  Last name
                </span>

                <input
                  value={form.last_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      last_name: event.target.value,
                    }))
                  }
                  className={fieldClass}
                />

                {errors.last_name && (
                  <p className="mt-2 text-xs text-rose-300">
                    {errors.last_name}
                  </p>
                )}
              </label>
            </div>
          </section>

          <section className="border-t border-slate-800 pt-6">
            <h3 className="text-sm font-semibold">
              Organization
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-xs text-slate-500">
                  Department
                </span>

                <select
                  value={form.department_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      department_id: event.target.value,
                    }))
                  }
                  className={fieldClass}
                >
                  <option value="">No department</option>

                  {departments.map((department) => (
                    <option
                      key={department.id}
                      value={department.id}
                    >
                      {department.name} ({department.code})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-xs text-slate-500">
                  Manager
                </span>

                <SearchablePicker
                  value={form.manager_id}
                  onChange={(value) => setForm((current) => ({ ...current, manager_id: value }))}
                  placeholder="No manager"
                  searchPlaceholder="Search manager by name or employee number..."
                  options={availableManagers.map((manager) => ({ value: manager.id.toString(), label: manager.full_name, description: manager.employee_number }))}
                />
              </label>

              <label>
                <span className="mb-2 block text-xs text-slate-500">
                  Job title
                </span>

                <input
                  value={form.job_title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      job_title: event.target.value,
                    }))
                  }
                  placeholder="Software Engineer"
                  className={fieldClass}
                />

                {errors.job_title && (
                  <p className="mt-2 text-xs text-rose-300">
                    {errors.job_title}
                  </p>
                )}
              </label>

              <label>
                <span className="mb-2 block text-xs text-slate-500">
                  Hire date
                </span>

                <input
                  type="date"
                  value={form.hire_date}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      hire_date: event.target.value,
                    }))
                  }
                  className={fieldClass}
                />

                {errors.hire_date && (
                  <p className="mt-2 text-xs text-rose-300">
                    {errors.hire_date}
                  </p>
                )}
              </label>

              <label>
                <span className="mb-2 block text-xs text-slate-500">
                  Employment type
                </span>

                <select
                  value={form.employment_type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      employment_type:
                        event.target
                          .value as EmploymentType,
                    }))
                  }
                  className={fieldClass}
                >
                  <option value="full_time">
                    Full time
                  </option>
                  <option value="part_time">
                    Part time
                  </option>
                  <option value="contract">
                    Contract
                  </option>
                  <option value="intern">Intern</option>
                </select>
              </label>

              <label>
                <span className="mb-2 block text-xs text-slate-500">
                  Status
                </span>

                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status:
                        event.target.value as EmployeeStatus,
                    }))
                  }
                  className={fieldClass}
                >
                  <option value="active">Active</option>
                  <option value="inactive">
                    Inactive
                  </option>
                  <option value="on_leave">
                    On leave
                  </option>
                </select>
              </label>
            </div>
          </section>

          <section className="border-t border-slate-800 pt-6">
            <h3 className="text-sm font-semibold">
              Contact details
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-xs text-slate-500">
                  Work email
                </span>

                <input
                  type="email"
                  value={form.work_email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      work_email: event.target.value,
                    }))
                  }
                  placeholder="employee@company.test"
                  className={fieldClass}
                />

                {errors.work_email && (
                  <p className="mt-2 text-xs text-rose-300">
                    {errors.work_email}
                  </p>
                )}
              </label>

              <label>
                <span className="mb-2 block text-xs text-slate-500">
                  Phone
                </span>

                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  className={fieldClass}
                />

                {errors.phone && (
                  <p className="mt-2 text-xs text-rose-300">
                    {errors.phone}
                  </p>
                )}
              </label>

              <label className="md:col-span-2">
                <span className="mb-2 block text-xs text-slate-500">
                  Avatar URL or path
                </span>

                <input
                  value={form.avatar}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      avatar: event.target.value,
                    }))
                  }
                  placeholder="Optional"
                  className={fieldClass}
                />

                {errors.avatar && (
                  <p className="mt-2 text-xs text-rose-300">
                    {errors.avatar}
                  </p>
                )}
              </label>

              <label className="md:col-span-2">
                <span className="mb-2 block text-xs text-slate-500">
                  Notes
                </span>

                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm leading-6 text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-sky-400/40"
                />

                {errors.notes && (
                  <p className="mt-2 text-xs text-rose-300">
                    {errors.notes}
                  </p>
                )}
              </label>
            </div>
          </section>

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

              {employee
                ? 'Save changes'
                : 'Create employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EmployeesPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [draftFilters, setDraftFilters] =
    useState<EmployeeFilters>(initialFilters)

  const [filters, setFilters] =
    useState<EmployeeFilters>(initialFilters)

  const [dialogOpen, setDialogOpen] = useState(false)

  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null)

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
    user?.permissions?.includes('employees.view') ??
    false

  const canCreate =
    user?.permissions?.includes('employees.create') ??
    false

  const canUpdate =
    user?.permissions?.includes('employees.update') ??
    false

  const canDelete =
    user?.permissions?.includes('employees.delete') ??
    false

  const canViewDepartments =
    user?.permissions?.includes('departments.view') ??
    false

  const employeesQuery = useQuery({
    queryKey: ['employees', filters],
    queryFn: () => employeeService.list(filters),
    enabled: canView,
  })

  const managerOptionsQuery = useQuery({
    queryKey: ['employees', 'manager-options'],
    queryFn: () =>
      employeeService.list({
        ...initialFilters,
        sort: 'name_asc',
        per_page: 100,
      }),
    enabled: canView && dialogOpen,
  })

  const departmentOptionsQuery = useQuery({
    queryKey: ['departments', 'employee-options'],
    queryFn: () =>
      departmentService.list({
        page: 1,
        search: '',
        status: 'all',
        sort: 'name_asc',
        per_page: 100,
      }),
    enabled: canViewDepartments && dialogOpen,
  })

  const closeDialogAfterSuccess = () => {
    setDialogOpen(false)
    setSelectedEmployee(null)
    setMutationError(null)
  }

  const refreshRelatedQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['employees'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['dashboard-summary'],
      }),
    ])
  }

  const createMutation = useMutation({
    mutationFn: employeeService.create,

    onSuccess: async () => {
      await refreshRelatedQueries()
      closeDialogAfterSuccess()
      toast.success('Employee created successfully')
    },

    onError: (error) => {
      const message = extractErrorMessage(error)
      setMutationError(message)
      toast.error('Employee operation failed', message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      employeeId,
      payload,
    }: {
      employeeId: number
      payload: EmployeePayload
    }) =>
      employeeService.update(employeeId, payload),

    onSuccess: async () => {
      await refreshRelatedQueries()
      closeDialogAfterSuccess()
      toast.success('Employee updated successfully')
    },

    onError: (error) => {
      const message = extractErrorMessage(error)
      setMutationError(message)
      toast.error('Employee operation failed', message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: employeeService.remove,

    onSuccess: async () => {
      await refreshRelatedQueries()
      toast.success('Employee deleted successfully')
    },

    onError: (error) => {
      toast.error('Employee deletion failed', extractErrorMessage(error))
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
    setSelectedEmployee(null)
    setMutationError(null)
  }

  const openCreateDialog = () => {
    setSelectedEmployee(null)
    setMutationError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee)
    setMutationError(null)
    setDialogOpen(true)
  }

  const handleSave = (payload: EmployeePayload) => {
    setMutationError(null)

    if (selectedEmployee) {
      updateMutation.mutate({
        employeeId: selectedEmployee.id,
        payload,
      })

      return
    }

    createMutation.mutate(payload)
  }

  const handleDelete = (employee: Employee) => {
    const confirmed = window.confirm(
      `Delete "${employee.full_name}"? This action cannot be undone.`,
    )

    if (!confirmed) {
      return
    }

    deleteMutation.mutate(employee.id)
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

  const result = employeesQuery.data
  const employees = result?.data ?? []

  const activeOnPage = employees.filter(
    (employee) => employee.status === 'active',
  ).length

  const onLeaveOnPage = employees.filter(
    (employee) => employee.status === 'on_leave',
  ).length

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

            <div className="grid h-11 w-11 place-items-center rounded-xl border border-sky-400/15 bg-sky-500/10 text-sky-300">
              <Users size={22} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Workforce
              </p>

              <h1 className="font-semibold">Employees</h1>
            </div>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={openCreateDialog}
              className="flex h-11 items-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              <Plus size={17} />
              New employee
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] p-5 md:p-8">
        <section className="relative overflow-hidden rounded-3xl border border-sky-400/10 bg-gradient-to-br from-blue-950/65 via-slate-950 to-cyan-950/30 p-7">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">
              Workforce directory
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight">
              Manage company employees
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Maintain employee identities, departments,
              reporting lines, employment details and contact
              information used by future workflow routing.
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: 'Total records',
              value: result?.meta.total ?? 0,
              icon: Users,
            },
            {
              label: 'Active on this page',
              value: activeOnPage,
              icon: BadgeCheck,
            },
            {
              label: 'On leave on this page',
              value: onLeaveOnPage,
              icon: CalendarDays,
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
            className="grid gap-4 xl:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]"
          >
            <label>
              <span className="mb-2 block text-xs text-slate-500">
                Search employees
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
                  placeholder="Name, number, title, email or phone"
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
                      .value as EmployeeFilters['status'],
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300 outline-none focus:border-sky-400/40"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">
                  Inactive
                </option>
                <option value="on_leave">
                  On leave
                </option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-xs text-slate-500">
                Employment
              </span>

              <select
                value={draftFilters.employment_type}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    employment_type:
                      event.target
                        .value as EmployeeFilters['employment_type'],
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300 outline-none focus:border-sky-400/40"
              >
                <option value="all">All types</option>
                <option value="full_time">
                  Full time
                </option>
                <option value="part_time">
                  Part time
                </option>
                <option value="contract">
                  Contract
                </option>
                <option value="intern">Intern</option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-xs text-slate-500">
                Department
              </span>

              <select
                value={
                  draftFilters.department_id?.toString() ??
                  ''
                }
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    department_id:
                      event.target.value === ''
                        ? null
                        : Number(event.target.value),
                  }))
                }
                disabled={!canViewDepartments}
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300 outline-none focus:border-sky-400/40 disabled:opacity-50"
              >
                <option value="">All departments</option>

                {departmentOptionsQuery.data?.data.map(
                  (department) => (
                    <option
                      key={department.id}
                      value={department.id}
                    >
                      {department.name}
                    </option>
                  ),
                )}
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
                      .value as EmployeeFilters['sort'],
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300 outline-none focus:border-sky-400/40"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name_asc">Name Aâ€“Z</option>
                <option value="name_desc">Name Zâ€“A</option>
                <option value="employee_number_asc">
                  Number Aâ€“Z
                </option>
                <option value="employee_number_desc">
                  Number Zâ€“A
                </option>
                <option value="hire_date_desc">
                  Newest hire date
                </option>
                <option value="hire_date_asc">
                  Oldest hire date
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
                Employee directory
              </h3>

              <p className="mt-1 text-xs text-slate-600">
                {result?.meta.total ?? 0} employees found
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
                  void employeesQuery.refetch()
                }
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 text-slate-500 transition hover:text-sky-300"
                aria-label="Refresh employees"
              >
                <RefreshCw
                  size={16}
                  className={
                    employeesQuery.isFetching
                      ? 'animate-spin'
                      : ''
                  }
                />
              </button>
            </div>
          </div>

          {employeesQuery.isError && (
            <div className="flex items-center gap-3 border-b border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-200">
              <AlertTriangle size={18} />
              Employees could not be loaded.
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800/80">
              <thead className="bg-slate-950/70">
                <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-slate-600">
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-5 py-4">Organization</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">Employment</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60">
                {employeesQuery.isPending ? (
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
                        Loading employees...
                      </p>
                    </td>
                  </tr>
                ) : employees.length > 0 ? (
                  employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="transition hover:bg-slate-900/40"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-sky-500/10 text-sky-300">
                            {employee.avatar ? (
                              <img
                                src={employee.avatar}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserRound size={18} />
                            )}
                          </div>

                          <div>
                            <p className="font-medium text-slate-200">
                              {employee.full_name}
                            </p>

                            <p className="mt-1 font-mono text-[11px] text-slate-600">
                              {employee.employee_number}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1.5 text-xs">
                          <p className="flex items-center gap-2 text-slate-400">
                            <BriefcaseBusiness size={13} />
                            {employee.job_title ??
                              'No job title'}
                          </p>

                          <p className="flex items-center gap-2 text-slate-600">
                            <Building2 size={13} />
                            {employee.department
                              ? `${employee.department.name} (${employee.department.code})`
                              : 'No department'}
                          </p>

                          {employee.manager && (
                            <p className="text-slate-700">
                              Reports to{' '}
                              {employee.manager.full_name}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1.5 text-xs text-slate-500">
                          <p className="flex items-center gap-2">
                            <Mail size={13} />
                            {employee.work_email ?? 'â€”'}
                          </p>

                          <p className="flex items-center gap-2">
                            <Phone size={13} />
                            {employee.phone ?? 'â€”'}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-xs text-slate-300">
                          {
                            employmentTypeLabels[
                              employee.employment_type
                            ]
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          Hired{' '}
                          {formatDate(employee.hire_date)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusClasses(
                            employee.status,
                          )}`}
                        >
                          {statusLabels[employee.status]}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {canUpdate && (
                            <button
                              type="button"
                              onClick={() =>
                                openEditDialog(employee)
                              }
                              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 text-slate-500 transition hover:border-sky-400/30 hover:text-sky-300"
                              aria-label={`Edit ${employee.full_name}`}
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
                                handleDelete(employee)
                              }
                              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 text-slate-500 transition hover:border-rose-400/30 hover:text-rose-300 disabled:opacity-40"
                              aria-label={`Delete ${employee.full_name}`}
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
                      <Users
                        size={28}
                        className="mx-auto text-slate-700"
                      />

                      <p className="mt-4 text-sm text-slate-500">
                        No employees match the filters.
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
        <EmployeeDialog
          key={selectedEmployee?.id ?? 'new'}
          employee={selectedEmployee}
          departments={
            departmentOptionsQuery.data?.data ?? []
          }
          managers={
            managerOptionsQuery.data?.data ?? []
          }
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

export default EmployeesPage

