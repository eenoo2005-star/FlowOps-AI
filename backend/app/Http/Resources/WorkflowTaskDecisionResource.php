<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class WorkflowTaskDecisionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'decision' => $this->decision,
            'note' => $this->note,
            'acted_at' => $this->acted_at?->toISOString(),
            'acted_by_user' => $this->whenLoaded('actedByUser', fn () => [
                'id' => $this->actedByUser->id,
                'name' => $this->actedByUser->name,
                'email' => $this->actedByUser->email,
            ]),
            'acted_by_employee' => $this->whenLoaded(
                'actedByEmployee',
                fn () => $this->actedByEmployee ? [
                    'id' => $this->actedByEmployee->id,
                    'full_name' => trim(
                        $this->actedByEmployee->first_name.' '.$this->actedByEmployee->last_name
                    ),
                    'employee_number' => $this->actedByEmployee->employee_number,
                ] : null
            ),
        ];
    }
}
