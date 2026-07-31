<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class IndexEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('employees.view') ?? false;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $companyId = $this->user()?->company_id;

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
                    'active',
                    'inactive',
                    'on_leave',
                ]),
            ],

            'employment_type' => [
                'sometimes',
                'string',
                Rule::in([
                    'all',
                    'full_time',
                    'part_time',
                    'contract',
                    'intern',
                ]),
            ],

            'department_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('departments', 'id')
                    ->where('company_id', $companyId),
            ],

            'sort' => [
                'sometimes',
                'string',
                Rule::in([
                    'newest',
                    'oldest',
                    'name_asc',
                    'name_desc',
                    'employee_number_asc',
                    'employee_number_desc',
                    'hire_date_asc',
                    'hire_date_desc',
                ]),
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
                'search' => trim((string) $this->input('search')),
            ]);
        }

        if ($this->input('department_id') === '') {
            $this->merge([
                'department_id' => null,
            ]);
        }
    }
}
