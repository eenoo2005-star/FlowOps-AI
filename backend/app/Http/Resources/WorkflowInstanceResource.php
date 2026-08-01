<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class WorkflowInstanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'internal_request_id' => $this->internal_request_id,
            'workflow_definition_id' => $this->workflow_definition_id,
            'current_workflow_step_id' => $this->current_workflow_step_id,
            'status' => $this->status,
            'started_at' => $this->started_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),

            'tasks' => WorkflowTaskResource::collection(
                $this->whenLoaded('tasks')
            ),
        ];
    }
}
