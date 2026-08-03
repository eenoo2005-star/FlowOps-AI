<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\User;
use App\Models\WorkflowTask;
use Spatie\Permission\Models\Role;
use Throwable;

final class ApprovalEligibilityService
{
    public function canAct(User $user, WorkflowTask $workflowTask): bool
    {
        if ($user->company_id !== $workflowTask->company_id) {
            return false;
        }

        if ($user->can('workflow-tasks.act_all')) {
            return true;
        }

        if (
            $workflowTask->assigned_employee_id !== null
            && $user->employee?->id === $workflowTask->assigned_employee_id
        ) {
            return true;
        }

        if ($workflowTask->assigned_role === null) {
            return false;
        }

        if (! $this->roleExists($workflowTask->assigned_role)) {
            return false;
        }

        try {
            return $user->hasRole($workflowTask->assigned_role);
        } catch (Throwable) {
            return false;
        }
    }

    public function eligibleUserCount(WorkflowTask $workflowTask): int
    {
        if ($workflowTask->assigned_employee_id !== null) {
            return Employee::query()
                ->whereKey($workflowTask->assigned_employee_id)
                ->whereNotNull('user_id')
                ->count();
        }

        if ($workflowTask->assigned_role !== null) {
            if (! $this->roleExists($workflowTask->assigned_role)) {
                return 0;
            }

            try {
                return User::query()
                    ->where('company_id', $workflowTask->company_id)
                    ->role($workflowTask->assigned_role)
                    ->count();
            } catch (Throwable) {
                return 0;
            }
        }

        return 0;
    }

    private function roleExists(string $roleName): bool
    {
        return Role::query()
            ->where('name', $roleName)
            ->where('guard_name', 'web')
            ->exists();
    }
}
