<?php

namespace App\Services;

use App\Models\WorkflowDefinition;
use App\Models\WorkflowStep;

final class WorkflowStepService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(
        WorkflowDefinition $workflowDefinition,
        array $data
    ): WorkflowStep {
        $data['company_id'] = $workflowDefinition->company_id;
        $data['workflow_definition_id'] =
            $workflowDefinition->id;

        return WorkflowStep::query()
            ->create($data)
            ->load('approverEmployee:id,first_name,last_name');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(
        WorkflowStep $workflowStep,
        array $data
    ): WorkflowStep {
        $workflowStep->update($data);

        return $workflowStep
            ->fresh()
            ->load('approverEmployee:id,first_name,last_name');
    }

    public function delete(WorkflowStep $workflowStep): void
    {
        $workflowStep->delete();
    }
}
