<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class WorkflowStepResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,

            'workflow_definition_id' => $this->workflow_definition_id,

            'name' => $this->name,
            'code' => $this->code,
            'description' => $this->description,
            'step_order' => $this->step_order,

            'approver_type' => $this->approver_type,
            'approver_role' => $this->approver_role,

            'approver_employee_id' => $this->approver_employee_id,

            'approver_employee' => $this->whenLoaded(
                'approverEmployee',
                fn () => $this->approverEmployee ? [
                    'id' => $this->approverEmployee->id,
                    'full_name' => trim(
                        $this->approverEmployee->first_name
                        .' '
                        .$this->approverEmployee->last_name
                    ),
                ] : null
            ),

            'approval_mode' => $this->approval_mode,

            'required_approvals' => $this->required_approvals,

            'sla_hours' => $this->sla_hours,
            'can_reject' => $this->can_reject,
            'is_final' => $this->is_final,

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
