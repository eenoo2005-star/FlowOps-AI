<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class RequestCommentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();

        return [
            'id' => $this->id,
            'body' => $this->body,
            'author_name' => $this->author_name,

            'author_employee' => $this->whenLoaded(
                'employee',
                fn () => $this->employee ? [
                    'id' => $this->employee->id,
                    'full_name' => trim(
                        $this->employee->first_name
                        .' '
                        .$this->employee->last_name
                    ),
                    'employee_number' => $this->employee
                        ->employee_number,
                ] : null
            ),

            'can_delete' => $user !== null
                && (
                    $user->can(
                        'request-comments.manage'
                    )
                    || (
                        $this->user_id === $user->id
                        && $user->can(
                            'request-comments.delete_own'
                        )
                    )
                ),

            'created_at' => $this->created_at?->toISOString(),

            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
