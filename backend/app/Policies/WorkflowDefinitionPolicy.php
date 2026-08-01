<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WorkflowDefinition;

final class WorkflowDefinitionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('workflows.view');
    }

    public function view(
        User $user,
        WorkflowDefinition $workflowDefinition
    ): bool {
        return $user->company_id
            === $workflowDefinition->company_id
            && $user->can('workflows.view');
    }

    public function create(User $user): bool
    {
        return $user->company_id !== null
            && $user->can('workflows.create');
    }

    public function update(
        User $user,
        WorkflowDefinition $workflowDefinition
    ): bool {
        return $user->company_id
            === $workflowDefinition->company_id
            && $user->can('workflows.update');
    }

    public function delete(
        User $user,
        WorkflowDefinition $workflowDefinition
    ): bool {
        return $user->company_id
            === $workflowDefinition->company_id
            && $user->can('workflows.delete');
    }

    public function restore(
        User $user,
        WorkflowDefinition $workflowDefinition
    ): bool {
        return false;
    }

    public function forceDelete(
        User $user,
        WorkflowDefinition $workflowDefinition
    ): bool {
        return false;
    }
}
