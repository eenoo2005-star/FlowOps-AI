<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class DashboardAnalyticsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can(
            'reports.view'
        ) ?? false;
    }

    public function rules(): array
    {
        return [
            'days' => [
                'sometimes',
                'integer',
                Rule::in([
                    7,
                    30,
                    90,
                ]),
            ],
        ];
    }
}
