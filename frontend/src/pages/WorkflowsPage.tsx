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
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Filter,
  GitBranch,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
  Workflow,
  X,
} from 'lucide-react'
import type { AxiosError } from 'axios'
import { useToast } from '../components/feedback/toastContext'
import { authService } from '../services/authService'
import { employeeService } from '../services/employeeService'
import { workflowService } from '../services/workflowService'
import {
  workflowDefinitionSchema,
  workflowStepSchema,
  type WorkflowDefinitionFormValues,
  type WorkflowStepFormValues,
} from '../features/workflows/workflowSchemas'
import type { Employee } from '../types/employee'
import type {
  ApproverType,
  WorkflowDefinition,
  WorkflowDefinitionPayload,
  WorkflowFilters,
  WorkflowStep,
  WorkflowStepPayload,
} from '../types/workflow'

interface LaravelErrorResponse {
  message?: string
  errors?: Record<string, string[]>
}

interface DefinitionDialogProps {
  definition: WorkflowDefinition | null
  isSubmitting: boolean
  serverError: string | null
  onClose: () => void
  onSubmit: (
    payload: WorkflowDefinitionPayload,
  ) => void
}

interface StepDialogProps {
  definitionId: number
  step: WorkflowStep | null
  employees: Employee[]
  isSubmitting: boolean
  serverError: string | null
  onClose: () => void
  onSubmit: (
    payload: WorkflowStepPayload,
  ) => void
}

const initialFilters: WorkflowFilters = {
  page: 1,
  search: '',
  status: 'all',
  sort: 'newest',
  per_page: 15,
}

const emptyDefinitionForm:
WorkflowDefinitionFormValues = {
  name: '',
  code: '',
  description: '',
  version: '1',
  is_active: true,
}

const emptyStepForm: WorkflowStepFormValues = {
  name: '',
  code: '',
  description: '',
  step_order: '1',
  approver_type: 'requester_manager',
  approver_role: '',
  approver_employee_id: '',
  approval_mode: 'any',
  required_approvals: '1',
  sla_hours: '',
  can_reject: true,
  is_final: false,
}

const approverLabels: Record<
  ApproverType,
  string
> = {
  role: 'Role',
  employee: 'Specific employee',
  requester_manager: 'Requester manager',
  department_manager: 'Department manager',
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

function DefinitionDialog({
  definition,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
}: DefinitionDialogProps) {
  const [form, setForm] =
    useState<WorkflowDefinitionFormValues>(() =>
      definition
        ? {
            name: definition.name,
            code: definition.code,
            description:
              definition.description ?? '',
            version: definition.version.toString(),
            is_active: definition.is_active,
          }
        : emptyDefinitionForm,
    )

  const [errors, setErrors] = useState<
    Partial<
      Record<
        keyof WorkflowDefinitionFormValues,
        string
      >
    >
  >({})

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const result =
      workflowDefinitionSchema.safeParse(form)

    if (!result.success) {
      const nextErrors: Partial<
        Record<
          keyof WorkflowDefinitionFormValues,
          string
        >
      > = {}

      for (const issue of result.error.issues) {
        const field = issue.path[0]

        if (
          typeof field === 'string' &&
          nextErrors[
            field as keyof WorkflowDefinitionFormValues
          ] === undefined
        ) {
          nextErrors[
            field as keyof WorkflowDefinitionFormValues
          ] = issue.message
        }
      }

      setErrors(nextErrors)

      return
    }

    setErrors({})

    onSubmit({
      name: result.data.name,
      code: result.data.code.toUpperCase(),
      description: nullableString(
        result.data.description,
      ),
      version: Number(result.data.version),
      is_active: result.data.is_active,
    })
  }

  const fieldClass =
    'h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-sky-400/40'

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-700/80 bg-[#07101f] shadow-2xl shadow-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-sky-400">
              Workflow definition
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              {definition
                ? 'Edit workflow'
                : 'Create workflow'}
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

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-xs text-slate-500">
                Workflow name
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

            <label>
              <span className="mb-2 block text-xs text-slate-500">
                Version
              </span>

              <input
                type="number"
                min={1}
                max={9999}
                value={form.version}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    version: event.target.value,
                  }))
                }
                className={fieldClass}
              />

              {errors.version && (
                <p className="mt-2 text-xs text-rose-300">
                  {errors.version}
                </p>
              )}
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4">
              <div>
                <p className="text-sm">Active workflow</p>
                <p className="mt-1 text-xs text-slate-600">
                  Available for future requests
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
          </div>

          <label>
            <span className="mb-2 block text-xs text-slate-500">
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
              className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm leading-6 text-slate-200 outline-none transition focus:border-sky-400/40"
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

              {definition
                ? 'Save workflow'
                : 'Create workflow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StepDialog({
  step,
  employees,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
}: StepDialogProps) {
  const [form, setForm] =
    useState<WorkflowStepFormValues>(() =>
      step
        ? {
            name: step.name,
            code: step.code,
            description:
              step.description ?? '',
            step_order:
              step.step_order.toString(),
            approver_type: step.approver_type,
            approver_role:
              step.approver_role ?? '',
            approver_employee_id:
              step.approver_employee_id?.toString() ?? '',
            approval_mode: step.approval_mode,
            required_approvals:
              step.required_approvals.toString(),
            sla_hours:
              step.sla_hours?.toString() ?? '',
            can_reject: step.can_reject,
            is_final: step.is_final,
          }
        : emptyStepForm,
    )

  const [errors, setErrors] = useState<
    Partial<
      Record<
        keyof WorkflowStepFormValues,
        string
      >
    >
  >({})

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const result = workflowStepSchema.safeParse(form)

    if (!result.success) {
      const nextErrors: Partial<
        Record<
          keyof WorkflowStepFormValues,
          string
        >
      > = {}

      for (const issue of result.error.issues) {
        const field = issue.path[0]

        if (
          typeof field === 'string' &&
          nextErrors[
            field as keyof WorkflowStepFormValues
          ] === undefined
        ) {
          nextErrors[
            field as keyof WorkflowStepFormValues
          ] = issue.message
        }
      }

      setErrors(nextErrors)

      return
    }

    setErrors({})

    onSubmit({
      name: result.data.name,
      code: result.data.code.toUpperCase(),
      description: nullableString(
        result.data.description,
      ),
      step_order: Number(result.data.step_order),
      approver_type: result.data.approver_type,
      approver_role:
        result.data.approver_type === 'role'
          ? nullableString(
              result.data.approver_role,
            )
          : null,
      approver_employee_id:
        result.data.approver_type === 'employee'
          ? Number(
              result.data.approver_employee_id,
            )
          : null,
      approval_mode: result.data.approval_mode,
      required_approvals: Number(
        result.data.required_approvals,
      ),
      sla_hours:
        result.data.sla_hours === ''
          ? null
          : Number(result.data.sla_hours),
      can_reject: result.data.can_reject,
      is_final: result.data.is_final,
    })
  }

  const fieldClass =
    'h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-sky-400/40'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="mx-auto my-4 w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-700/80 bg-[#07101f] shadow-2xl shadow-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-sky-400">
              Approval step
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              {step ? 'Edit step' : 'Add step'}
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

          <div className="grid gap-4 md:grid-cols-3">
            <label className="md:col-span-2">
              <span className="mb-2 block text-xs text-slate-500">
                Step name
              </span>

              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Manager Approval"
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
                Order
              </span>

              <input
                type="number"
                min={1}
                max={1000}
                value={form.step_order}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    step_order: event.target.value,
                  }))
                }
                className={fieldClass}
              />

              {errors.step_order && (
                <p className="mt-2 text-xs text-rose-300">
                  {errors.step_order}
                </p>
              )}
            </label>

            <label className="md:col-span-2">
              <span className="mb-2 block text-xs text-slate-500">
                Step code
              </span>

              <input
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    code: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="MANAGER_APPROVAL"
                className={`${fieldClass} font-mono uppercase`}
              />

              {errors.code && (
                <p className="mt-2 text-xs text-rose-300">
                  {errors.code}
                </p>
              )}
            </label>

            <label>
              <span className="mb-2 block text-xs text-slate-500">
                SLA hours
              </span>

              <input
                type="number"
                min={1}
                max={8760}
                value={form.sla_hours}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sla_hours: event.target.value,
                  }))
                }
                placeholder="24"
                className={fieldClass}
              />

              {errors.sla_hours && (
                <p className="mt-2 text-xs text-rose-300">
                  {errors.sla_hours}
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

          <section className="border-t border-slate-800 pt-6">
            <h3 className="text-sm font-semibold">
              Approver assignment
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-xs text-slate-500">
                  Approver type
                </span>

                <select
                  value={form.approver_type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      approver_type:
                        event.target.value as ApproverType,
                      approver_role: '',
                      approver_employee_id: '',
                    }))
                  }
                  className={fieldClass}
                >
                  <option value="requester_manager">
                    Requester manager
                  </option>
                  <option value="department_manager">
                    Department manager
                  </option>
                  <option value="role">
                    Role
                  </option>
                  <option value="employee">
                    Specific employee
                  </option>
                </select>
              </label>

              {form.approver_type === 'role' && (
                <label>
                  <span className="mb-2 block text-xs text-slate-500">
                    Role name
                  </span>

                  <input
                    value={form.approver_role}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        approver_role:
                          event.target.value,
                      }))
                    }
                    placeholder="manager"
                    className={fieldClass}
                  />

                  {errors.approver_role && (
                    <p className="mt-2 text-xs text-rose-300">
                      {errors.approver_role}
                    </p>
                  )}
                </label>
              )}

              {form.approver_type === 'employee' && (
                <label>
                  <span className="mb-2 block text-xs text-slate-500">
                    Approver employee
                  </span>

                  <select
                    value={form.approver_employee_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        approver_employee_id:
                          event.target.value,
                      }))
                    }
                    className={fieldClass}
                  >
                    <option value="">
                      Select employee
                    </option>

                    {employees.map((employee) => (
                      <option
                        key={employee.id}
                        value={employee.id}
                      >
                        {employee.full_name} -{' '}
                        {employee.employee_number}
                      </option>
                    ))}
                  </select>

                  {errors.approver_employee_id && (
                    <p className="mt-2 text-xs text-rose-300">
                      {errors.approver_employee_id}
                    </p>
                  )}
                </label>
              )}

              <label>
                <span className="mb-2 block text-xs text-slate-500">
                  Approval mode
                </span>

                <select
                  value={form.approval_mode}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      approval_mode:
                        event.target.value as 'any' | 'all',
                    }))
                  }
                  className={fieldClass}
                >
                  <option value="any">
                    Any assigned approver
                  </option>
                  <option value="all">
                    All assigned approvers
                  </option>
                </select>
              </label>

              <label>
                <span className="mb-2 block text-xs text-slate-500">
                  Required approvals
                </span>

                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.required_approvals}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      required_approvals:
                        event.target.value,
                    }))
                  }
                  className={fieldClass}
                />

                {errors.required_approvals && (
                  <p className="mt-2 text-xs text-rose-300">
                    {errors.required_approvals}
                  </p>
                )}
              </label>
            </div>
          </section>

          <div className="grid gap-4 border-t border-slate-800 pt-6 md:grid-cols-2">
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <div>
                <p className="text-sm">Allow rejection</p>
                <p className="mt-1 text-xs text-slate-600">
                  Approver may reject the request
                </p>
              </div>

              <input
                type="checkbox"
                checked={form.can_reject}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    can_reject: event.target.checked,
                  }))
                }
                className="h-5 w-5 accent-sky-500"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <div>
                <p className="text-sm">Final step</p>
                <p className="mt-1 text-xs text-slate-600">
                  Completes the workflow on approval
                </p>
              </div>

              <input
                type="checkbox"
                checked={form.is_final}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    is_final: event.target.checked,
                  }))
                }
                className="h-5 w-5 accent-sky-500"
              />
            </label>
          </div>

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

              {step ? 'Save step' : 'Add step'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function WorkflowsPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [draftFilters, setDraftFilters] =
    useState<WorkflowFilters>(initialFilters)

  const [filters, setFilters] =
    useState<WorkflowFilters>(initialFilters)

  const [
    selectedDefinitionId,
    setSelectedDefinitionId,
  ] = useState<number | null>(null)

  const [
    definitionDialogOpen,
    setDefinitionDialogOpen,
  ] = useState(false)

  const [editingDefinition, setEditingDefinition] =
    useState<WorkflowDefinition | null>(null)

  const [stepDialogOpen, setStepDialogOpen] =
    useState(false)

  const [editingStep, setEditingStep] =
    useState<WorkflowStep | null>(null)

  const [
    definitionMutationError,
    setDefinitionMutationError,
  ] = useState<string | null>(null)

  const [stepMutationError, setStepMutationError] =
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
    user?.permissions?.includes('workflows.view') ??
    false

  const canCreate =
    user?.permissions?.includes('workflows.create') ??
    false

  const canUpdate =
    user?.permissions?.includes('workflows.update') ??
    false

  const canDelete =
    user?.permissions?.includes('workflows.delete') ??
    false

  const canViewEmployees =
    user?.permissions?.includes('employees.view') ??
    false

  const definitionsQuery = useQuery({
    queryKey: ['workflow-definitions', filters],
    queryFn: () => workflowService.list(filters),
    enabled: canView,
  })

  const definitionQuery = useQuery({
    queryKey: [
      'workflow-definition',
      selectedDefinitionId,
    ],
    queryFn: () =>
      workflowService.show(
        selectedDefinitionId as number,
      ),
    enabled:
      canView && selectedDefinitionId !== null,
  })

  const employeeOptionsQuery = useQuery({
    queryKey: ['employees', 'workflow-approvers'],
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
      canViewEmployees && stepDialogOpen,
  })

  const closeDefinitionDialog = () => {
    setDefinitionDialogOpen(false)
    setEditingDefinition(null)
    setDefinitionMutationError(null)
  }

  const closeStepDialog = () => {
    setStepDialogOpen(false)
    setEditingStep(null)
    setStepMutationError(null)
  }

  const refreshDefinitions = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['workflow-definitions'],
    })
  }

  const refreshSelectedDefinition = async (
    definitionId: number,
  ) => {
    await Promise.all([
      refreshDefinitions(),
      queryClient.invalidateQueries({
        queryKey: [
          'workflow-definition',
          definitionId,
        ],
      }),
    ])
  }

  const createDefinitionMutation = useMutation({
    mutationFn: workflowService.create,

    onSuccess: async (definition) => {
      setSelectedDefinitionId(definition.id)
      await refreshSelectedDefinition(definition.id)
      closeDefinitionDialog()
      toast.success('Workflow created successfully')
    },

    onError: (error) => {
      setDefinitionMutationError(
        extractErrorMessage(error),
      )
    },
  })

  const updateDefinitionMutation = useMutation({
    mutationFn: ({
      definitionId,
      payload,
    }: {
      definitionId: number
      payload: WorkflowDefinitionPayload
    }) =>
      workflowService.update(
        definitionId,
        payload,
      ),

    onSuccess: async (definition) => {
      await refreshSelectedDefinition(definition.id)
      closeDefinitionDialog()
      toast.success('Workflow updated successfully')
    },

    onError: (error) => {
      setDefinitionMutationError(
        extractErrorMessage(error),
      )
    },
  })

  const deleteDefinitionMutation = useMutation({
    mutationFn: workflowService.remove,

    onSuccess: async (_, definitionId) => {
      if (selectedDefinitionId === definitionId) {
        setSelectedDefinitionId(null)
      }

      await refreshDefinitions()
      toast.success('Workflow deleted successfully')
    },

    onError: (error) => {
      toast.error('Workflow deletion failed', extractErrorMessage(error))
    },
  })

  const createStepMutation = useMutation({
    mutationFn: ({
      definitionId,
      payload,
    }: {
      definitionId: number
      payload: WorkflowStepPayload
    }) =>
      workflowService.createStep(
        definitionId,
        payload,
      ),

    onSuccess: async (_, variables) => {
      await refreshSelectedDefinition(
        variables.definitionId,
      )
      closeStepDialog()
      toast.success('Workflow step created successfully')
    },

    onError: (error) => {
      setStepMutationError(
        extractErrorMessage(error),
      )
    },
  })

  const updateStepMutation = useMutation({
    mutationFn: ({
      definitionId,
      stepId,
      payload,
    }: {
      definitionId: number
      stepId: number
      payload: WorkflowStepPayload
    }) =>
      workflowService.updateStep(
        definitionId,
        stepId,
        payload,
      ),

    onSuccess: async (_, variables) => {
      await refreshSelectedDefinition(
        variables.definitionId,
      )
      closeStepDialog()
      toast.success('Workflow step updated successfully')
    },

    onError: (error) => {
      setStepMutationError(
        extractErrorMessage(error),
      )
    },
  })

  const deleteStepMutation = useMutation({
    mutationFn: ({
      definitionId,
      stepId,
    }: {
      definitionId: number
      stepId: number
    }) =>
      workflowService.removeStep(
        definitionId,
        stepId,
      ),

    onSuccess: async (_, variables) => {
      await refreshSelectedDefinition(
        variables.definitionId,
      )
      toast.success('Workflow step deleted successfully')
    },

    onError: (error) => {
      toast.error('Workflow step deletion failed', extractErrorMessage(error))
    },
  })

  const openCreateDefinition = () => {
    setEditingDefinition(null)
    setDefinitionMutationError(null)
    setDefinitionDialogOpen(true)
  }

  const openEditDefinition = (
    definition: WorkflowDefinition,
  ) => {
    setEditingDefinition(definition)
    setDefinitionMutationError(null)
    setDefinitionDialogOpen(true)
  }

  const saveDefinition = (
    payload: WorkflowDefinitionPayload,
  ) => {
    if (editingDefinition) {
      updateDefinitionMutation.mutate({
        definitionId: editingDefinition.id,
        payload,
      })

      return
    }

    createDefinitionMutation.mutate(payload)
  }

  const deleteDefinition = (
    definition: WorkflowDefinition,
  ) => {
    const confirmed = window.confirm(
      `Delete workflow "${definition.name}" and all of its steps?`,
    )

    if (!confirmed) {
      return
    }

    deleteDefinitionMutation.mutate(
      definition.id,
    )
  }

  const openCreateStep = () => {
    setEditingStep(null)
    setStepMutationError(null)
    setStepDialogOpen(true)
  }

  const openEditStep = (step: WorkflowStep) => {
    setEditingStep(step)
    setStepMutationError(null)
    setStepDialogOpen(true)
  }

  const saveStep = (
    payload: WorkflowStepPayload,
  ) => {
    if (selectedDefinitionId === null) {
      return
    }

    if (editingStep) {
      updateStepMutation.mutate({
        definitionId: selectedDefinitionId,
        stepId: editingStep.id,
        payload,
      })

      return
    }

    createStepMutation.mutate({
      definitionId: selectedDefinitionId,
      payload,
    })
  }

  const deleteStep = (step: WorkflowStep) => {
    if (selectedDefinitionId === null) {
      return
    }

    const confirmed = window.confirm(
      `Delete step "${step.name}"?`,
    )

    if (!confirmed) {
      return
    }

    deleteStepMutation.mutate({
      definitionId: selectedDefinitionId,
      stepId: step.id,
    })
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

  const listResult = definitionsQuery.data
  const definitions = listResult?.data ?? []
  const selectedDefinition = definitionQuery.data

  return (
    <main className="min-h-screen bg-[#050b18] text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-[1700px] items-center justify-between gap-4 px-5 py-4 md:px-8">
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
              <Workflow size={22} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Process automation
              </p>

              <h1 className="font-semibold">
                Workflow Designer
              </h1>
            </div>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={openCreateDefinition}
              className="flex h-11 items-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              <Plus size={17} />
              New workflow
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-[1700px] p-5 md:p-8">
        <section className="relative overflow-hidden rounded-3xl border border-sky-400/10 bg-gradient-to-br from-blue-950/65 via-slate-950 to-cyan-950/30 p-7">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">
              Approval architecture
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight">
              Build reusable approval workflows
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Define a process, add ordered approval steps,
              select approvers and configure rejection, SLA
              and completion behavior.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-950/55 p-5">
          <form
            onSubmit={applyFilters}
            className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_auto]"
          >
            <label>
              <span className="mb-2 block text-xs text-slate-500">
                Search workflows
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
                      .value as WorkflowFilters['status'],
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300 outline-none focus:border-sky-400/40"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">
                  Inactive
                </option>
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
                      .value as WorkflowFilters['sort'],
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300 outline-none focus:border-sky-400/40"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
                <option value="code_asc">Code A-Z</option>
                <option value="code_desc">Code Z-A</option>
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

        <section className="mt-6 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/55">
            <div className="flex items-center justify-between border-b border-slate-800/80 p-5">
              <div>
                <h3 className="font-semibold">
                  Workflows
                </h3>

                <p className="mt-1 text-xs text-slate-600">
                  {listResult?.meta.total ?? 0} definitions
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void definitionsQuery.refetch()
                }
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 text-slate-500 transition hover:text-sky-300"
                aria-label="Refresh workflows"
              >
                <RefreshCw
                  size={16}
                  className={
                    definitionsQuery.isFetching
                      ? 'animate-spin'
                      : ''
                  }
                />
              </button>
            </div>

            <div className="max-h-[720px] space-y-2 overflow-y-auto p-3">
              {definitionsQuery.isPending ? (
                <div className="grid min-h-52 place-items-center">
                  <LoaderCircle
                    size={28}
                    className="animate-spin text-sky-400"
                  />
                </div>
              ) : definitionsQuery.isError ? (
                <div className="flex items-center gap-3 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                  <AlertTriangle size={17} />
                  Workflows could not be loaded.
                </div>
              ) : definitions.length > 0 ? (
                definitions.map((definition) => (
                  <button
                    key={definition.id}
                    type="button"
                    onClick={() =>
                      setSelectedDefinitionId(
                        definition.id,
                      )
                    }
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedDefinitionId ===
                      definition.id
                        ? 'border-sky-400/30 bg-sky-500/10'
                        : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-200">
                          {definition.name}
                        </p>

                        <p className="mt-1 font-mono text-[11px] text-slate-600">
                          {definition.code} v
                          {definition.version}
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-2 py-1 text-[9px] font-semibold uppercase ${
                          definition.is_active
                            ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
                            : 'border-slate-700 bg-slate-900 text-slate-500'
                        }`}
                      >
                        {definition.is_active
                          ? 'Active'
                          : 'Inactive'}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
                      <GitBranch size={14} />
                      {definition.steps_count ?? 0}{' '}
                      approval steps
                    </div>
                  </button>
                ))
              ) : (
                <div className="grid min-h-52 place-items-center text-center">
                  <div>
                    <Workflow
                      size={27}
                      className="mx-auto text-slate-700"
                    />

                    <p className="mt-4 text-sm text-slate-500">
                      No workflows found.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {listResult &&
              listResult.meta.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-slate-800/80 p-4">
                  <p className="text-xs text-slate-600">
                    Page {listResult.meta.current_page} of{' '}
                    {listResult.meta.last_page}
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={
                        listResult.meta.current_page <= 1
                      }
                      onClick={() =>
                        setFilters((current) => ({
                          ...current,
                          page:
                            listResult.meta
                              .current_page - 1,
                        }))
                      }
                      className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 text-slate-500 disabled:opacity-30"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <button
                      type="button"
                      disabled={
                        listResult.meta.current_page >=
                        listResult.meta.last_page
                      }
                      onClick={() =>
                        setFilters((current) => ({
                          ...current,
                          page:
                            listResult.meta
                              .current_page + 1,
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

          <article className="min-h-[620px] overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/55">
            {selectedDefinitionId === null ? (
              <div className="grid min-h-[620px] place-items-center p-8 text-center">
                <div>
                  <Workflow
                    size={38}
                    className="mx-auto text-slate-700"
                  />

                  <h3 className="mt-5 text-lg font-semibold">
                    Select a workflow
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                    Choose an existing workflow from the list
                    or create a new definition.
                  </p>
                </div>
              </div>
            ) : definitionQuery.isPending ? (
              <div className="grid min-h-[620px] place-items-center">
                <LoaderCircle
                  size={30}
                  className="animate-spin text-sky-400"
                />
              </div>
            ) : definitionQuery.isError ||
              !selectedDefinition ? (
              <div className="grid min-h-[620px] place-items-center p-8 text-center">
                <div>
                  <AlertTriangle
                    size={34}
                    className="mx-auto text-rose-300"
                  />

                  <p className="mt-4 text-sm text-rose-200">
                    The selected workflow could not be loaded.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/80 p-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold">
                        {selectedDefinition.name}
                      </h2>

                      <span className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 font-mono text-[11px] text-slate-400">
                        {selectedDefinition.code} v
                        {selectedDefinition.version}
                      </span>
                    </div>

                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                      {selectedDefinition.description ??
                        'No workflow description.'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() =>
                          openEditDefinition(
                            selectedDefinition,
                          )
                        }
                        className="flex h-10 items-center gap-2 rounded-xl border border-slate-700 px-3 text-xs text-slate-400 transition hover:border-sky-400/30 hover:text-sky-300"
                      >
                        <Edit3 size={15} />
                        Edit
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() =>
                          deleteDefinition(
                            selectedDefinition,
                          )
                        }
                        className="flex h-10 items-center gap-2 rounded-xl border border-slate-700 px-3 text-xs text-slate-400 transition hover:border-rose-400/30 hover:text-rose-300"
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <BadgeCheck
                        size={17}
                        className="text-sky-300"
                      />

                      <p className="mt-4 text-xl font-bold">
                        {selectedDefinition.is_active
                          ? 'Active'
                          : 'Inactive'}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Workflow status
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <GitBranch
                        size={17}
                        className="text-sky-300"
                      />

                      <p className="mt-4 text-xl font-bold">
                        {selectedDefinition.steps?.length ??
                          0}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Approval steps
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <ShieldCheck
                        size={17}
                        className="text-sky-300"
                      />

                      <p className="mt-4 text-xl font-bold">
                        v{selectedDefinition.version}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Definition version
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">
                        Approval steps
                      </h3>

                      <p className="mt-1 text-xs text-slate-600">
                        Steps execute in ascending order.
                      </p>
                    </div>

                    {canUpdate && (
                      <button
                        type="button"
                        onClick={openCreateStep}
                        className="flex h-10 items-center gap-2 rounded-xl bg-sky-500 px-3 text-xs font-semibold text-slate-950 hover:bg-sky-400"
                      >
                        <Plus size={15} />
                        Add step
                      </button>
                    )}
                  </div>

                  <div className="mt-5 space-y-4">
                    {selectedDefinition.steps &&
                    selectedDefinition.steps.length > 0 ? (
                      selectedDefinition.steps.map(
                        (step) => (
                          <div
                            key={step.id}
                            className="relative rounded-2xl border border-slate-800 bg-slate-950/65 p-5"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div className="flex min-w-0 gap-4">
                                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-sky-400/15 bg-sky-500/10 font-bold text-sky-300">
                                  {step.step_order}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <h4 className="font-semibold text-slate-200">
                                      {step.name}
                                    </h4>

                                    {step.is_final && (
                                      <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-semibold uppercase text-emerald-300">
                                        Final
                                      </span>
                                    )}
                                  </div>

                                  <p className="mt-1 font-mono text-[11px] text-slate-700">
                                    {step.code}
                                  </p>

                                  {step.description && (
                                    <p className="mt-3 max-w-3xl text-xs leading-6 text-slate-500">
                                      {step.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {canUpdate && (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEditStep(step)
                                    }
                                    className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 text-slate-500 transition hover:border-sky-400/30 hover:text-sky-300"
                                  >
                                    <Edit3 size={15} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteStep(step)
                                    }
                                    className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 text-slate-500 transition hover:border-rose-400/30 hover:text-rose-300"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                                <p className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-700">
                                  <UserRoundCheck size={13} />
                                  Approver
                                </p>

                                <p className="mt-2 text-xs text-slate-400">
                                  {step.approver_type ===
                                  'employee'
                                    ? step
                                        .approver_employee
                                        ?.full_name ??
                                      'Specific employee'
                                    : step.approver_type ===
                                        'role'
                                      ? step.approver_role ??
                                        'Role'
                                      : approverLabels[
                                          step
                                            .approver_type
                                        ]}
                                </p>
                              </div>

                              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                                <p className="text-[10px] uppercase tracking-wider text-slate-700">
                                  Approval mode
                                </p>

                                <p className="mt-2 text-xs text-slate-400">
                                  {step.approval_mode ===
                                  'all'
                                    ? 'All approvers'
                                    : 'Any approver'}
                                  {' - '}
                                  {
                                    step.required_approvals
                                  }{' '}
                                  required
                                </p>
                              </div>

                              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                                <p className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-700">
                                  <Clock3 size={13} />
                                  SLA
                                </p>

                                <p className="mt-2 text-xs text-slate-400">
                                  {step.sla_hours
                                    ? `${step.sla_hours} hours`
                                    : 'No SLA'}
                                </p>
                              </div>

                              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                                <p className="text-[10px] uppercase tracking-wider text-slate-700">
                                  Rejection
                                </p>

                                <p className="mt-2 text-xs text-slate-400">
                                  {step.can_reject
                                    ? 'Allowed'
                                    : 'Not allowed'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ),
                      )
                    ) : (
                      <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 text-center">
                        <div>
                          <GitBranch
                            size={27}
                            className="mx-auto text-slate-700"
                          />

                          <p className="mt-4 text-sm text-slate-500">
                            No approval steps yet.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </article>
        </section>
      </div>

      {definitionDialogOpen && (
        <DefinitionDialog
          key={editingDefinition?.id ?? 'new'}
          definition={editingDefinition}
          isSubmitting={
            createDefinitionMutation.isPending ||
            updateDefinitionMutation.isPending
          }
          serverError={definitionMutationError}
          onClose={closeDefinitionDialog}
          onSubmit={saveDefinition}
        />
      )}

      {stepDialogOpen &&
        selectedDefinitionId !== null && (
          <StepDialog
            key={`${selectedDefinitionId}:${editingStep?.id ?? 'new'}`}
            definitionId={selectedDefinitionId}
            step={editingStep}
            employees={
              employeeOptionsQuery.data?.data ?? []
            }
            isSubmitting={
              createStepMutation.isPending ||
              updateStepMutation.isPending
            }
            serverError={stepMutationError}
            onClose={closeStepDialog}
            onSubmit={saveStep}
          />
        )}
    </main>
  )
}

export default WorkflowsPage

