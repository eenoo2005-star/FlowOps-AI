<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class WorkflowTaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $internalRequest = $this->workflowInstance?->internalRequest;

        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'workflow_instance_id' => $this->workflow_instance_id,
            'workflow_step_id' => $this->workflow_step_id,
            'assigned_employee_id' => $this->assigned_employee_id,
            'assigned_role' => $this->assigned_role,
            'status' => $this->status,
            'due_at' => $this->due_at?->toISOString(),
            'acted_at' => $this->acted_at?->toISOString(),
            'decision_note' => $this->decision_note,
            'can_approve' => $request->user()?->can('approve', $this->resource) ?? false,
            'can_reject' => $request->user()?->can('reject', $this->resource) ?? false,
            'workflow_step' => $this->whenLoaded('workflowStep', fn () => [
                'id' => $this->workflowStep->id,
                'name' => $this->workflowStep->name,
                'code' => $this->workflowStep->code,
                'step_order' => $this->workflowStep->step_order,
                'approval_mode' => $this->workflowStep->approval_mode,
                'required_approvals' => $this->workflowStep->required_approvals,
                'can_reject' => $this->workflowStep->can_reject,
                'is_final' => $this->workflowStep->is_final,
            ]),
            'assigned_employee' => $this->whenLoaded(
                'assignedEmployee',
                fn () => $this->assignedEmployee ? [
                    'id' => $this->assignedEmployee->id,
                    'full_name' => trim(
                        $this->assignedEmployee->first_name.' '.$this->assignedEmployee->last_name
                    ),
                    'employee_number' => $this->assignedEmployee->employee_number,
                ] : null
            ),
            'internal_request' => $internalRequest ? [
                'id' => $internalRequest->id,
                'reference_number' => $internalRequest->reference_number,
                'title' => $internalRequest->title,
                'description' => $internalRequest->description,
                'priority' => $internalRequest->priority,
                'status' => $internalRequest->status,
                'request_type' => $internalRequest->requestType ? [
                    'id' => $internalRequest->requestType->id,
                    'name' => $internalRequest->requestType->name,
                    'code' => $internalRequest->requestType->code,
                ] : null,
                'requester_employee' => $internalRequest->requesterEmployee ? [
                    'id' => $internalRequest->requesterEmployee->id,
                    'full_name' => trim(
                        $internalRequest->requesterEmployee->first_name
                        .' '
                        .$internalRequest->requesterEmployee->last_name
                    ),
                    'employee_number' => $internalRequest->requesterEmployee->employee_number,
                ] : null,
            ] : null,
            'decisions' => WorkflowTaskDecisionResource::collection(
                $this->whenLoaded('decisions')
            ),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
