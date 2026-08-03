<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class InternalRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'request_type_id' => $this->request_type_id,

            'workflow_definition_id' => $this->workflow_definition_id,

            'requester_employee_id' => $this->requester_employee_id,
            'created_by_user_id' => $this->created_by_user_id,
            'on_behalf_of_reason' => $this->on_behalf_of_reason,

            'current_workflow_step_id' => $this->current_workflow_step_id,

            'reference_number' => $this->reference_number,
            'title' => $this->title,
            'description' => $this->description,
            'payload' => $this->payload,
            'priority' => $this->priority,
            'status' => $this->status,

            'submitted_at' => $this->submitted_at?->toISOString(),

            'completed_at' => $this->completed_at?->toISOString(),

            'cancelled_at' => $this->cancelled_at?->toISOString(),

            'request_type' => $this->whenLoaded(
                'requestType',
                fn () => [
                    'id' => $this->requestType->id,
                    'name' => $this->requestType->name,
                    'code' => $this->requestType->code,
                ]
            ),

            'requester_employee' => $this->whenLoaded(
                'requesterEmployee',
                fn () => [
                    'id' => $this->requesterEmployee->id,
                    'full_name' => trim(
                        $this->requesterEmployee->first_name
                        .' '
                        .$this->requesterEmployee->last_name
                    ),
                    'employee_number' => $this->requesterEmployee
                        ->employee_number,
                ]
            ),

            'created_by' => $this->whenLoaded('creator', fn () => $this->creator ? [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
                'email' => $this->creator->email,
            ] : null),

            'workflow_definition' => $this->whenLoaded(
                'workflowDefinition',
                fn () => [
                    'id' => $this->workflowDefinition->id,
                    'name' => $this->workflowDefinition->name,
                    'code' => $this->workflowDefinition->code,
                    'version' => $this->workflowDefinition->version,
                ]
            ),

            'current_workflow_step' => $this->whenLoaded(
                'currentWorkflowStep',
                fn () => $this->currentWorkflowStep ? [
                    'id' => $this->currentWorkflowStep->id,
                    'name' => $this->currentWorkflowStep->name,
                    'code' => $this->currentWorkflowStep->code,
                    'step_order' => $this->currentWorkflowStep
                        ->step_order,
                ] : null
            ),

            'workflow_instance' => $this->whenLoaded(
                'workflowInstance',
                fn () => new WorkflowInstanceResource(
                    $this->workflowInstance
                )
            ),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
