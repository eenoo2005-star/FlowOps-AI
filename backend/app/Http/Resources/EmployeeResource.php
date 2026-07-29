<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'department_id' => $this->department_id,
            'user_id' => $this->user_id,
            'manager_id' => $this->manager_id,

            'employee_number' => $this->employee_number,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => "{$this->first_name} {$this->last_name}",

            'job_title' => $this->job_title,
            'work_email' => $this->work_email,
            'phone' => $this->phone,
            'hire_date' => $this->hire_date?->toDateString(),
            'employment_type' => $this->employment_type,
            'status' => $this->status,
            'avatar' => $this->avatar,
            'notes' => $this->notes,

            'department' => $this->whenLoaded(
                'department',
                fn () => [
                    'id' => $this->department?->id,
                    'name' => $this->department?->name,
                    'code' => $this->department?->code,
                ]
            ),

            'manager' => $this->whenLoaded(
                'manager',
                fn () => $this->manager ? [
                    'id' => $this->manager->id,
                    'full_name' => "{$this->manager->first_name} {$this->manager->last_name}",
                ] : null
            ),

            'user' => $this->whenLoaded(
                'user',
                fn () => $this->user ? [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                ] : null
            ),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}