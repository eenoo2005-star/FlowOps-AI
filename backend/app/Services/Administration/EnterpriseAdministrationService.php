<?php

namespace App\Services\Administration;

use App\Models\RequestAuditEvent;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

final class EnterpriseAdministrationService
{
    /**
     * @return array<string, mixed>
     */
    public function overview(User $user): array
    {
        $roleCount = Role::query()
            ->where('guard_name', 'web')
            ->count();

        $permissionCount = Permission::query()
            ->where('guard_name', 'web')
            ->count();

        $userCount = User::query()
            ->when(
                ! $this->isSystemAdministrator($user),
                fn (Builder $query): Builder => $query->where(
                    'company_id',
                    $user->company_id
                )
            )
            ->count();

        $auditEventsSevenDays = RequestAuditEvent::query()
            ->where('occurred_at', '>=', now()->subDays(7))
            ->count();

        $recentEvents = RequestAuditEvent::query()
            ->latest('occurred_at')
            ->limit(5)
            ->get()
            ->map(fn (RequestAuditEvent $event): array => $this->serializeAuditEvent($event))
            ->values()
            ->all();

        return [
            'role_count' => $roleCount,
            'permission_count' => $permissionCount,
            'user_count' => $userCount,
            'audit_events_7d' => $auditEventsSevenDays,
            'recent_audit_events' => $recentEvents,
            'readiness' => [
                [
                    'key' => 'role_management',
                    'label' => 'Role management',
                    'status' => 'active',
                    'description' => 'Roles can be reviewed and permission sets can be updated safely.',
                ],
                [
                    'key' => 'permission_catalog',
                    'label' => 'Permission catalog',
                    'status' => 'active',
                    'description' => 'Application permissions are grouped for enterprise administration.',
                ],
                [
                    'key' => 'audit_logs',
                    'label' => 'Audit logs',
                    'status' => 'active',
                    'description' => 'Immutable request audit events are available for compliance review.',
                ],
                [
                    'key' => 'settings',
                    'label' => 'System settings',
                    'status' => 'queued',
                    'description' => 'Branding, password policies, tokens and sessions are next.',
                ],
            ],
        ];
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function roles(): Collection
    {
        return Role::query()
            ->with([
                'permissions' => fn ($query) => $query->orderBy('name'),
            ])
            ->withCount('users')
            ->where('guard_name', 'web')
            ->orderBy('name')
            ->get()
            ->map(fn (Role $role): array => $this->serializeRole($role));
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function permissions(): Collection
    {
        return Permission::query()
            ->where('guard_name', 'web')
            ->orderBy('name')
            ->get()
            ->map(fn (Permission $permission): array => [
                'id' => $permission->id,
                'name' => $permission->name,
                'guard_name' => $permission->guard_name,
                'group' => $this->permissionGroup($permission->name),
                'description' => $this->humanizePermission($permission->name),
            ]);
    }

    /**
     * @param array<int, string> $permissionNames
     *
     * @return array<string, mixed>
     */
    public function updateRolePermissions(
        Role $role,
        array $permissionNames
    ): array {
        if ($this->isProtectedRole($role->name)) {
            abort(422, 'Protected administrator roles cannot be modified from this workspace.');
        }

        $permissionNames = collect($permissionNames)
            ->filter(fn ($permission): bool => is_string($permission) && trim($permission) !== '')
            ->map(fn (string $permission): string => trim($permission))
            ->unique()
            ->values()
            ->all();

        $permissions = Permission::query()
            ->where('guard_name', 'web')
            ->whereIn('name', $permissionNames)
            ->get();

        if ($permissions->count() !== count($permissionNames)) {
            abort(422, 'One or more selected permissions do not exist.');
        }

        $role->syncPermissions($permissions);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $this->serializeRole(
            $role->fresh()->load('permissions')
        );
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function auditEvents(array $filters = []): LengthAwarePaginator
    {
        $query = RequestAuditEvent::query()
            ->with([
                'internalRequest:id,title,status,reference_number',
                'actorUser:id,name,email',
            ]);

        $search = mb_strtolower(trim((string) ($filters['search'] ?? '')));

        if ($search !== '') {
            $like = "%{$search}%";

            $query->where(function (Builder $builder) use ($like): void {
                $builder
                    ->whereRaw('LOWER(summary) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(event_type) LIKE ?', [$like])
                    ->orWhereRaw("LOWER(COALESCE(actor_name, '')) LIKE ?", [$like])
                    ->orWhereRaw("LOWER(COALESCE(ip_address, '')) LIKE ?", [$like]);
            });
        }

        $eventType = trim((string) ($filters['event_type'] ?? ''));

        if ($eventType !== '') {
            $query->where('event_type', $eventType);
        }

        match ($filters['sort'] ?? 'newest') {
            'oldest' => $query->oldest('occurred_at'),
            default => $query->latest('occurred_at'),
        };

        return $query->paginate(
            min(max((int) ($filters['per_page'] ?? 15), 5), 100)
        );
    }

    /**
     * @return array<int, string>
     */
    public function auditEventTypes(): array
    {
        return RequestAuditEvent::query()
            ->select('event_type')
            ->distinct()
            ->orderBy('event_type')
            ->pluck('event_type')
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function serializeAuditEvent(RequestAuditEvent $event): array
    {
        return [
            'id' => $event->id,
            'event_type' => $event->event_type,
            'summary' => $event->summary,
            'metadata' => $event->metadata,
            'actor_name' => $event->actor_name,
            'ip_address' => $event->ip_address,
            'user_agent' => $event->user_agent,
            'occurred_at' => $event->occurred_at?->toISOString(),
            'internal_request' => $event->internalRequest ? [
                'id' => $event->internalRequest->id,
                'title' => $event->internalRequest->title,
                'status' => $event->internalRequest->status,
                'reference_number' => $event->internalRequest->reference_number,
            ] : null,
            'actor_user' => $event->actorUser ? [
                'id' => $event->actorUser->id,
                'name' => $event->actorUser->name,
                'email' => $event->actorUser->email,
            ] : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeRole(Role $role): array
    {
        $permissionNames = $role->permissions
            ->pluck('name')
            ->sort()
            ->values()
            ->all();

        return [
            'id' => $role->id,
            'name' => $role->name,
            'guard_name' => $role->guard_name,
            'users_count' => (int) ($role->users_count ?? 0),
            'permissions' => $permissionNames,
            'is_system_role' => $this->isProtectedRole($role->name),
            'editable' => ! $this->isProtectedRole($role->name),
        ];
    }

    private function isSystemAdministrator(User $user): bool
    {
        return collect($user->getRoleNames())
            ->contains(fn (string $roleName): bool => in_array(
                $roleName,
                ['system_admin', 'system admin'],
                true
            ));
    }

    private function isProtectedRole(string $roleName): bool
    {
        return in_array(
            $roleName,
            ['system_admin', 'system admin'],
            true
        );
    }

    private function permissionGroup(string $permission): string
    {
        if (str_contains($permission, '.')) {
            return str($permission)->before('.')->replace('-', ' ')->title()->toString();
        }

        if (str_contains($permission, 'security')) {
            return 'Security';
        }

        if (str_contains($permission, 'audit')) {
            return 'Audit';
        }

        if (str_contains($permission, 'notification')) {
            return 'Notifications';
        }

        return 'General';
    }

    private function humanizePermission(string $permission): string
    {
        return str($permission)
            ->replace(['.', '-', '_'], ' ')
            ->headline()
            ->toString();
    }
}
