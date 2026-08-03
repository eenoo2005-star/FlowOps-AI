/* eslint-disable react-hooks/set-state-in-effect */
import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Navigate } from 'react-router-dom'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  Filter,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
} from 'lucide-react'
import { useToast } from '../components/feedback/toastContext'
import { administrationService } from '../services/administrationService'
import { authService } from '../services/authService'
import type {
  AdministrationAuditFilters,
  AdministrationPermission,
  AdministrationRole,
} from '../types/administration'

interface LaravelErrorResponse {
  message?: string
  errors?: Record<string, string[]>
}

type AdministrationTab =
  | 'overview'
  | 'roles'
  | 'audit'
  | 'settings'

const initialAuditFilters: AdministrationAuditFilters = {
  page: 1,
  search: '',
  event_type: '',
  sort: 'newest',
  per_page: 15,
}

const tabs: Array<{
  key: AdministrationTab
  label: string
  permission?: string
}> = [
  {
    key: 'overview',
    label: 'Overview',
  },
  {
    key: 'roles',
    label: 'Roles & Permissions',
    permission: 'roles.view',
  },
  {
    key: 'audit',
    label: 'Audit Logs',
    permission: 'audit.view',
  },
  {
    key: 'settings',
    label: 'Settings',
    permission: 'settings.view',
  },
]

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
    timeStyle: 'short',
  }).format(date)
}

function humanize(value: string): string {
  return value
    .replace(/[._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function extractErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<LaravelErrorResponse>
  const validationErrors = axiosError.response?.data?.errors

  if (validationErrors) {
    const firstMessage = Object.values(validationErrors).flat()[0]

    if (firstMessage) {
      return firstMessage
    }
  }

  return (
    axiosError.response?.data?.message ??
    'The administration action could not be completed.'
  )
}

function groupPermissions(
  permissions: AdministrationPermission[],
): Array<{
  group: string
  permissions: AdministrationPermission[]
}> {
  const groups = new Map<string, AdministrationPermission[]>()

  for (const permission of permissions) {
    const current = groups.get(permission.group) ?? []
    current.push(permission)
    groups.set(permission.group, current)
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([group, groupPermissions]) => ({
      group,
      permissions: groupPermissions.sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    }))
}

function AdministrationPage() {
  const toast = useToast()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] =
    useState<AdministrationTab>('overview')
  const [selectedRoleId, setSelectedRoleId] =
    useState<number | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<
    string[]
  >([])
  const [draftAuditFilters, setDraftAuditFilters] =
    useState<AdministrationAuditFilters>(initialAuditFilters)
  const [appliedAuditFilters, setAppliedAuditFilters] =
    useState<AdministrationAuditFilters>(initialAuditFilters)

  const userQuery = useQuery({
    queryKey: ['current-user'],
    queryFn: authService.getCurrentUser,
    retry: false,
  })

  const permissions = userQuery.data?.permissions ?? []

  const hasPermission = (permission: string): boolean =>
    permissions.includes(permission)

  const canViewAdministration =
    hasPermission('administration.view') ||
    hasPermission('roles.view') ||
    hasPermission('roles.manage') ||
    hasPermission('audit.view') ||
    hasPermission('settings.view')

  const canManageRoles = hasPermission('roles.manage')

  const overviewQuery = useQuery({
    queryKey: ['administration', 'overview'],
    queryFn: administrationService.getOverview,
    enabled: canViewAdministration,
  })

  const rolesQuery = useQuery({
    queryKey: ['administration', 'roles'],
    queryFn: administrationService.getRoles,
    enabled:
      canViewAdministration &&
      (hasPermission('roles.view') || canManageRoles),
  })

  const permissionsQuery = useQuery({
    queryKey: ['administration', 'permissions'],
    queryFn: administrationService.getPermissions,
    enabled:
      canViewAdministration &&
      (hasPermission('permissions.view') ||
        hasPermission('roles.view') ||
        canManageRoles),
  })

  const auditQuery = useQuery({
    queryKey: [
      'administration',
      'audit-events',
      appliedAuditFilters,
    ],
    queryFn: () =>
      administrationService.getAuditEvents(appliedAuditFilters),
    enabled: canViewAdministration && hasPermission('audit.view'),
  })

  const roles = rolesQuery.data ?? []
  const permissionCatalog = permissionsQuery.data ?? []

  const selectedRole = useMemo(
    () =>
      roles.find((role) => role.id === selectedRoleId) ??
      roles[0] ??
      null,
    [roles, selectedRoleId],
  )

  const permissionGroups = useMemo(
    () => groupPermissions(permissionCatalog),
    [permissionCatalog],
  )

  const hasPermissionChanges = useMemo(() => {
    if (!selectedRole) {
      return false
    }

    const original = [...selectedRole.permissions].sort().join('|')
    const current = [...selectedPermissions].sort().join('|')

    return original !== current
  }, [selectedPermissions, selectedRole])

  const updateRoleMutation = useMutation({
    mutationFn: () => {
      if (!selectedRole) {
        throw new Error('No role selected.')
      }

      return administrationService.updateRolePermissions(
        selectedRole.id,
        selectedPermissions,
      )
    },
    onSuccess: (role) => {
      queryClient.setQueryData<AdministrationRole[]>(
        ['administration', 'roles'],
        (current) =>
          current?.map((item) =>
            item.id === role.id ? role : item,
          ) ?? [role],
      )

      toast.success(
        'Role permissions updated',
        `${humanize(role.name)} now has ${role.permissions.length} permissions.`,
      )
    },
    onError: (error) => {
      toast.error('Role update failed', extractErrorMessage(error))
    },
  })

  useEffect(() => {
    if (roles.length === 0) {
      return
    }

    if (
      selectedRoleId === null ||
      !roles.some((role) => role.id === selectedRoleId)
    ) {
      const firstEditableRole =
        roles.find((role) => role.editable) ?? roles[0]

      setSelectedRoleId(firstEditableRole.id)
    }
  }, [roles, selectedRoleId])

  useEffect(() => {
    setSelectedPermissions(selectedRole?.permissions ?? [])
  }, [selectedRole])

  const togglePermission = (permissionName: string) => {
    setSelectedPermissions((current) =>
      current.includes(permissionName)
        ? current.filter((permission) => permission !== permissionName)
        : [...current, permissionName],
    )
  }

  const handleApplyAuditFilters = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setAppliedAuditFilters({
      ...draftAuditFilters,
      page: 1,
    })
  }

  const changeAuditPage = (page: number) => {
    setAppliedAuditFilters((current) => ({
      ...current,
      page,
    }))
  }

  const visibleTabs = tabs.filter(
    (tab) => !tab.permission || hasPermission(tab.permission),
  )

  if (userQuery.isError) {
    return <Navigate to="/login" replace />
  }

  if (userQuery.isPending) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-sky-400/20 border-t-sky-400" />
          <p className="mt-4 text-sm text-slate-500">
            Preparing administration controls...
          </p>
        </div>
      </main>
    )
  }

  if (!canViewAdministration) {
    return <Navigate to="/dashboard" replace />
  }

  const overview = overviewQuery.data
  const auditEvents = auditQuery.data?.data ?? []
  const auditMeta = auditQuery.data?.meta
  const auditEventTypes = auditQuery.data?.event_types ?? []

  return (
    <main className="space-y-7">
      <section className="relative overflow-hidden rounded-3xl border border-sky-400/10 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/60 p-7 shadow-2xl shadow-slate-950/30">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-400/15 bg-sky-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">
              <ShieldCheck size={14} />
              Enterprise Administration
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-100">
              Control roles, permissions and audit visibility.
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
              This is the first administration layer: role governance,
              permission cataloging and immutable audit review. It must stay
              strict because weak administration destroys enterprise trust.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void overviewQuery.refetch()
              void rolesQuery.refetch()
              void permissionsQuery.refetch()
              void auditQuery.refetch()
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-700/80 px-4 text-sm text-slate-300 transition hover:border-sky-400/30 hover:bg-sky-500/10 hover:text-sky-200"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </section>

      <nav className="flex flex-wrap gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-2">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-xl px-4 py-2.5 text-sm transition ${
              activeTab === tab.key
                ? 'bg-sky-500/10 text-sky-300 ring-1 ring-sky-400/20'
                : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' && (
        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Roles',
                value: overview?.role_count,
                icon: UsersRound,
                description: 'Governed access profiles',
              },
              {
                label: 'Permissions',
                value: overview?.permission_count,
                icon: KeyRound,
                description: 'Action-level controls',
              },
              {
                label: 'Users',
                value: overview?.user_count,
                icon: ShieldCheck,
                description: 'Users in administration scope',
              },
              {
                label: 'Audit events',
                value: overview?.audit_events_7d,
                icon: Activity,
                description: 'Recorded during the last 7 days',
              },
            ].map((card) => {
              const Icon = card.icon

              return (
                <article
                  key={card.label}
                  className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-xl border border-sky-400/10 bg-sky-500/10 text-sky-300">
                      <Icon size={18} />
                    </div>

                    {overviewQuery.isFetching && (
                      <LoaderCircle
                        size={16}
                        className="animate-spin text-slate-600"
                      />
                    )}
                  </div>

                  <p className="mt-6 text-3xl font-bold text-slate-100">
                    {overviewQuery.isPending
                      ? '...'
                      : (card.value ?? 0).toLocaleString()}
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-300">
                    {card.label}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    {card.description}
                  </p>
                </article>
              )
            })}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <article className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-6">
              <h2 className="text-lg font-semibold text-slate-100">
                Administration readiness
              </h2>

              <div className="mt-5 space-y-3">
                {(overview?.readiness ?? []).map((item) => (
                  <div
                    key={item.key}
                    className="flex items-start gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/35 p-4"
                  >
                    {item.status === 'active' ? (
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0 text-emerald-400"
                      />
                    ) : (
                      <Clock3
                        size={18}
                        className="mt-0.5 shrink-0 text-amber-300"
                      />
                    )}

                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        {item.label}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-6">
              <h2 className="text-lg font-semibold text-slate-100">
                Recent audit activity
              </h2>

              <div className="mt-5 space-y-3">
                {(overview?.recent_audit_events ?? []).length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-600">
                    No audit events recorded yet.
                  </div>
                )}

                {(overview?.recent_audit_events ?? []).map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-slate-800/70 bg-slate-900/35 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="rounded-full border border-sky-400/15 bg-sky-500/10 px-2.5 py-1 text-[11px] text-sky-300">
                        {humanize(event.event_type)}
                      </span>

                      <span className="text-xs text-slate-600">
                        {formatDate(event.occurred_at)}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-300">
                      {event.summary}
                    </p>

                    <p className="mt-2 text-xs text-slate-600">
                      {event.actor_name ?? 'System'}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      )}

      {activeTab === 'roles' && (
        <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <article className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  Roles
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Select a role to review its permission set.
                </p>
              </div>

              {rolesQuery.isFetching && (
                <LoaderCircle
                  size={18}
                  className="animate-spin text-slate-600"
                />
              )}
            </div>

            <div className="mt-5 space-y-2">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedRole?.id === role.id
                      ? 'border-sky-400/30 bg-sky-500/10'
                      : 'border-slate-800/70 bg-slate-900/35 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        {humanize(role.name)}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {role.users_count} users آ· {role.permissions.length}{' '}
                        permissions
                      </p>
                    </div>

                    {role.is_system_role && (
                      <LockKeyhole
                        size={16}
                        className="text-amber-300"
                      />
                    )}
                  </div>
                </button>
              ))}

              {roles.length === 0 && !rolesQuery.isPending && (
                <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-600">
                  No roles were found.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-5">
            <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  {selectedRole ? humanize(selectedRole.name) : 'Role'}
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Permission changes apply immediately after saving. Protected
                  administrator roles are intentionally locked to prevent
                  accidental lockout.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  !selectedRole?.editable ||
                  !canManageRoles ||
                  !hasPermissionChanges ||
                  updateRoleMutation.isPending
                }
                onClick={() => updateRoleMutation.mutate()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateRoleMutation.isPending ? (
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={16} />
                )}
                Save permissions
              </button>
            </div>

            {!selectedRole?.editable && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0"
                />
                <span>
                  This role is protected. Clone or create narrower operational
                  roles in the next administration phase instead of editing the
                  root administrator profile.
                </span>
              </div>
            )}

            <div className="mt-5 space-y-5">
              {permissionGroups.map((group) => (
                <section
                  key={group.group}
                  className="rounded-2xl border border-slate-800/70 bg-slate-900/25 p-4"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-300">
                      {group.group}
                    </h3>
                    <span className="text-xs text-slate-600">
                      {group.permissions.length} permissions
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {group.permissions.map((permission) => {
                      const checked = selectedPermissions.includes(
                        permission.name,
                      )

                      return (
                        <label
                          key={permission.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                            checked
                              ? 'border-sky-400/20 bg-sky-500/10'
                              : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={
                              !selectedRole?.editable || !canManageRoles
                            }
                            onChange={() =>
                              togglePermission(permission.name)
                            }
                            className="mt-1 h-4 w-4 accent-sky-500 disabled:opacity-40"
                          />

                          <span>
                            <span className="block text-xs font-medium text-slate-300">
                              {permission.description}
                            </span>
                            <code className="mt-1 block text-[11px] text-slate-600">
                              {permission.name}
                            </code>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          </article>
        </section>
      )}

      {activeTab === 'audit' && (
        <section className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-5">
          <form
            onSubmit={handleApplyAuditFilters}
            className="grid gap-3 border-b border-slate-800 pb-5 lg:grid-cols-[1fr_220px_150px_auto]"
          >
            <label className="relative block">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
              />
              <input
                value={draftAuditFilters.search}
                onChange={(event) =>
                  setDraftAuditFilters((current) => ({
                    ...current,
                    search: event.target.value,
                  }))
                }
                placeholder="Search audit events..."
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-sky-400/40"
              />
            </label>

            <select
              value={draftAuditFilters.event_type}
              onChange={(event) =>
                setDraftAuditFilters((current) => ({
                  ...current,
                  event_type: event.target.value,
                }))
              }
              className="h-11 rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300 outline-none transition focus:border-sky-400/40"
            >
              <option value="">All event types</option>
              {auditEventTypes.map((eventType) => (
                <option key={eventType} value={eventType}>
                  {humanize(eventType)}
                </option>
              ))}
            </select>

            <select
              value={draftAuditFilters.sort}
              onChange={(event) =>
                setDraftAuditFilters((current) => ({
                  ...current,
                  sort: event.target.value as 'newest' | 'oldest',
                }))
              }
              className="h-11 rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300 outline-none transition focus:border-sky-400/40"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-700/80 px-4 text-sm text-slate-300 transition hover:border-sky-400/30 hover:bg-sky-500/10 hover:text-sky-200"
            >
              <Filter size={16} />
              Apply
            </button>
          </form>

          <div className="mt-5 space-y-3">
            {auditQuery.isPending && (
              <div className="grid h-44 place-items-center rounded-2xl border border-slate-800 bg-slate-950/40">
                <LoaderCircle
                  size={24}
                  className="animate-spin text-sky-300"
                />
              </div>
            )}

            {!auditQuery.isPending && auditEvents.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center">
                <Database
                  size={24}
                  className="mx-auto text-slate-600"
                />
                <p className="mt-3 text-sm text-slate-500">
                  No audit events match the current filters.
                </p>
              </div>
            )}

            {auditEvents.map((event) => (
              <article
                key={event.id}
                className="rounded-2xl border border-slate-800/70 bg-slate-900/30 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-sky-400/15 bg-sky-500/10 px-2.5 py-1 text-[11px] text-sky-300">
                        {humanize(event.event_type)}
                      </span>
                      {event.internal_request && (
                        <span className="rounded-full border border-slate-700/80 px-2.5 py-1 text-[11px] text-slate-500">
                          {event.internal_request.reference_number ??
                            `Request #${event.internal_request.id}`}
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-sm text-slate-300">
                      {event.summary}
                    </p>

                    <p className="mt-2 text-xs text-slate-600">
                      Actor: {event.actor_name ?? 'System'} آ· IP:{' '}
                      {event.ip_address ?? 'â€”'}
                    </p>
                  </div>

                  <span className="text-xs text-slate-600">
                    {formatDate(event.occurred_at)}
                  </span>
                </div>
              </article>
            ))}
          </div>

          {auditMeta && auditMeta.last_page > 1 && (
            <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-5">
              <p className="text-xs text-slate-600">
                Showing {auditMeta.from ?? 0}-{auditMeta.to ?? 0} of{' '}
                {auditMeta.total}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={auditMeta.current_page <= 1}
                  onClick={() =>
                    changeAuditPage(auditMeta.current_page - 1)
                  }
                  className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 text-slate-500 transition hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="text-xs text-slate-600">
                  Page {auditMeta.current_page} / {auditMeta.last_page}
                </span>

                <button
                  type="button"
                  disabled={
                    auditMeta.current_page >= auditMeta.last_page
                  }
                  onClick={() =>
                    changeAuditPage(auditMeta.current_page + 1)
                  }
                  className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 text-slate-500 transition hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === 'settings' && (
        <section className="grid gap-5 lg:grid-cols-3">
          {[
            {
              title: 'Organization settings',
              icon: Settings2,
              description:
                'Company profile, workspace defaults and business metadata.',
              status: 'Next batch',
            },
            {
              title: 'Security policies',
              icon: SlidersHorizontal,
              description:
                'Password policies, sessions, tokens and access control hardening.',
              status: 'Next batch',
            },
            {
              title: 'Branding',
              icon: ShieldCheck,
              description:
                'Logo, workspace identity, colors and enterprise presentation.',
              status: 'Next batch',
            },
          ].map((item) => {
            const Icon = item.icon

            return (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-6"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl border border-sky-400/10 bg-sky-500/10 text-sky-300">
                  <Icon size={20} />
                </div>

                <h2 className="mt-6 text-lg font-semibold text-slate-100">
                  {item.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>

                <span className="mt-5 inline-flex rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                  {item.status}
                </span>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}

export default AdministrationPage


