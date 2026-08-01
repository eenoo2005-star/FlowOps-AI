<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WorkflowTask;
use App\Services\ApprovalEligibilityService;

final class WorkflowTaskPolicy
{
    public function __construct(
        private readonly ApprovalEligibilityService $eligibility
    ) {}

    public function viewAny(User $user): bool
    {
        return $user->can('workflow-tasks.view');
    }

    public function view(User $user, WorkflowTask $workflowTask): bool
    {
        return $user->company_id === $workflowTask->company_id
            && (
                $user->can('workflow-tasks.view_all')
                || $this->eligibility->canAct($user, $workflowTask)
            );
    }

    public function approve(User $user, WorkflowTask $workflowTask): bool
    {
        return $workflowTask->status === 'pending'
            && $user->can('workflow-tasks.approve')
            && $this->eligibility->canAct($user, $workflowTask);
    }

    public function reject(User $user, WorkflowTask $workflowTask): bool
    {
        return $workflowTask->status === 'pending'
            && $workflowTask->workflowStep->can_reject
            && $user->can('workflow-tasks.reject')
            && $this->eligibility->canAct($user, $workflowTask);
    }
}
