<?php

namespace App\Http\Requests\Security;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class IndexLoginAttemptRequest extends FormRequest
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
        $maximumPerPage = (int) config(
            'security.pagination.max_per_page',
            100
        );

        return [
            'status' => [
                'sometimes',
                'string',
                Rule::in(['all', 'successful', 'failed']),
            ],

            'search' => [
                'sometimes',
                'string',
                'max:100',
            ],

            'country_code' => [
                'sometimes',
                'string',
                'size:2',
                'alpha',
            ],

            'ip_address' => [
                'sometimes',
                'ip',
            ],

            'failure_reason' => [
                'sometimes',
                'string',
                'max:50',
                'regex:/^[a-z0-9_]+$/',
            ],

            'risk_min' => [
                'sometimes',
                'integer',
                'between:0,100',
            ],

            'risk_max' => [
                'sometimes',
                'integer',
                'between:0,100',
            ],

            'from' => [
                'sometimes',
                'date_format:Y-m-d',
            ],

            'to' => [
                'sometimes',
                'date_format:Y-m-d',
            ],

            'sort' => [
                'sometimes',
                'string',
                Rule::in([
                    'newest',
                    'oldest',
                    'risk_high',
                    'risk_low',
                ]),
            ],

            'per_page' => [
                'sometimes',
                'integer',
                'min:1',
                "max:{$maximumPerPage}",
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('country_code')) {
            $this->merge([
                'country_code' => strtoupper(
                    trim((string) $this->input('country_code'))
                ),
            ]);
        }

        if ($this->filled('search')) {
            $this->merge([
                'search' => trim((string) $this->input('search')),
            ]);
        }

        if ($this->filled('failure_reason')) {
            $this->merge([
                'failure_reason' => strtolower(
                    trim((string) $this->input('failure_reason'))
                ),
            ]);
        }
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (
                $this->filled('risk_min')
                && $this->filled('risk_max')
                && (int) $this->input('risk_max')
                    < (int) $this->input('risk_min')
            ) {
                $validator->errors()->add(
                    'risk_max',
                    'The maximum risk score must be greater than or equal to the minimum risk score.'
                );
            }

            if (
                ! $validator->errors()->hasAny(['from', 'to'])
                && $this->filled('from')
                && $this->filled('to')
                && (string) $this->input('to')
                    < (string) $this->input('from')
            ) {
                $validator->errors()->add(
                    'to',
                    'The end date must be after or equal to the start date.'
                );
            }
        });
    }
}
