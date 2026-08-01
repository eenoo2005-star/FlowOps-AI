<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class IndexInternalRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can(
            'requests.view'
        ) ?? false;
    }

    public function rules(): array
    {
        $companyId = $this->user()->company_id;

        return [
            'search' => [
                'sometimes',
                'string',
                'max:100',
            ],

            'status' => [
                'sometimes',
                'string',
                Rule::in([
                    'all',
                    'draft',
                    'in_review',
                    'approved',
                    'rejected',
                    'cancelled',
                ]),
            ],

            'priority' => [
                'sometimes',
                'string',
                Rule::in([
                    'all',
                    'low',
                    'normal',
                    'high',
                    'urgent',
                ]),
            ],

            'request_type_id' => [
                'sometimes',
                'nullable',
                'integer',

                Rule::exists(
                    'request_types',
                    'id'
                )->where('company_id', $companyId),
            ],

            'per_page' => [
                'sometimes',
                'integer',
                'min:5',
                'max:100',
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('search')) {
            $this->merge([
                'search' => trim(
                    (string) $this->input('search')
                ),
            ]);
        }

        if ($this->input('request_type_id') === '') {
            $this->merge([
                'request_type_id' => null,
            ]);
        }
    }
}
