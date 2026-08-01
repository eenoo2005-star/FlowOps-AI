<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\User;
use App\Models\WorkflowTask;

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

        return $workflowTask->assigned_role !== null
            && $user->hasRole($workflowTask->assigned_role);
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
            return User::query()
                ->where('company_id', $workflowTask->company_id)
                ->role($workflowTask->assigned_role)
                ->count();
        }

        return 0;
    }
}
