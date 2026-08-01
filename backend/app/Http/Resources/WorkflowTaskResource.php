<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class WorkflowTaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workflow_instance_id' => $this->workflow_instance_id,
            'workflow_step_id' => $this->workflow_step_id,
            'assigned_employee_id' => $this->assigned_employee_id,
            'assigned_role' => $this->assigned_role,
            'status' => $this->status,
            'due_at' => $this->due_at?->toISOString(),
            'acted_at' => $this->acted_at?->toISOString(),
            'decision_note' => $this->decision_note,

            'workflow_step' => $this->whenLoaded(
                'workflowStep',
                fn () => [
                    'id' => $this->workflowStep->id,
                    'name' => $this->workflowStep->name,
                    'code' => $this->workflowStep->code,
                    'step_order' => $this->workflowStep->step_order,
                ]
            ),

            'assigned_employee' => $this->whenLoaded(
                'assignedEmployee',
                fn () => $this->assignedEmployee ? [
                    'id' => $this->assignedEmployee->id,
                    'full_name' => trim(
                        $this->assignedEmployee->first_name
                        .' '
                        .$this->assignedEmployee->last_name
                    ),
                    'employee_number' => $this->assignedEmployee
                        ->employee_number,
                ] : null
            ),
        ];
    }
}
