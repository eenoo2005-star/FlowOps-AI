<?php

namespace App\Http\Controllers\Api\Administration;

use App\Http\Controllers\Controller;
use App\Http\Requests\Administration\UpdateRolePermissionsRequest;
use App\Services\Administration\EnterpriseAdministrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

final class EnterpriseAdministrationController extends Controller
{
    public function __construct(
        private readonly EnterpriseAdministrationService $service
    ) {
    }

    public function overview(Request $request): JsonResponse
    {
        $this->authorizeAny($request, [
            'administration.view',
            'roles.view',
            'audit.view',
        ]);

        return response()->json([
            'data' => $this->service->overview($request->user()),
        ]);
    }

    public function roles(Request $request): JsonResponse
    {
        $this->authorizeAny($request, [
            'roles.view',
            'roles.manage',
        ]);

        return response()->json([
            'data' => $this->service->roles(),
        ]);
    }

    public function permissions(Request $request): JsonResponse
    {
        $this->authorizeAny($request, [
            'permissions.view',
            'roles.view',
            'roles.manage',
        ]);

        return response()->json([
            'data' => $this->service->permissions(),
        ]);
    }

    public function updateRolePermissions(
        UpdateRolePermissionsRequest $request,
        Role $role
    ): JsonResponse {
        return response()->json([
            'message' => 'Role permissions updated successfully.',
            'data' => $this->service->updateRolePermissions(
                $role,
                $request->validated('permissions')
            ),
        ]);
    }

    public function auditEvents(Request $request): JsonResponse
    {
        $this->authorizeAny($request, ['audit.view']);

        $paginator = $this->service->auditEvents(
            $request->only([
                'search',
                'event_type',
                'sort',
                'per_page',
            ])
        );

        return response()->json([
            'data' => $paginator
                ->getCollection()
                ->map(fn ($event): array => $this->service->serializeAuditEvent($event))
                ->values(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'from' => $paginator->firstItem(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'to' => $paginator->lastItem(),
                'total' => $paginator->total(),
            ],
            'event_types' => $this->service->auditEventTypes(),
        ]);
    }

    /**
     * @param array<int, string> $permissions
     */
    private function authorizeAny(
        Request $request,
        array $permissions
    ): void {
        $user = $request->user();

        abort_unless(
            $user !== null
                && collect($permissions)->contains(
                    fn (string $permission): bool => $user->can($permission)
                ),
            403
        );
    }
}
