<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class RequestTypeResource extends JsonResource
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
            'instructions' => $this->instructions,
            'is_active' => $this->is_active,

            'workflow_definition' => $this->whenLoaded(
                'workflowDefinition',
                fn () => [
                    'id' => $this->workflowDefinition->id,
                    'name' => $this->workflowDefinition->name,
                    'code' => $this->workflowDefinition->code,
                    'version' => $this->workflowDefinition->version,
                    'is_active' => $this->workflowDefinition->is_active,
                ]
            ),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
