<?php

namespace App\Http\Requests\Security;

use Illuminate\Foundation\Http\FormRequest;

final class SecurityOverviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('view security dashboard') ?? false;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $maximumDays = (int) config(
            'security.overview.max_days',
            90
        );

        return [
            'days' => [
                'sometimes',
                'integer',
                'min:1',
                "max:{$maximumDays}",
            ],
        ];
    }
}
