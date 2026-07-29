<?php

namespace App\Http\Requests;

use App\Models\Employee;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Employee $employee */
        $employee = $this->route('employee');

        $companyId = $this->user()->company_id;

        return [
            'department_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('departments', 'id')
                    ->where('company_id', $companyId),
            ],

            'user_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('users', 'id')
                    ->where('company_id', $companyId),
                Rule::unique('employees', 'user_id')
                    ->ignore($employee),
            ],

            'manager_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('employees', 'id')
                    ->where('company_id', $companyId),
                Rule::notIn([$employee->id]),
            ],

            'employee_number' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('employees', 'employee_number')
                    ->where('company_id', $companyId)
                    ->ignore($employee),
            ],

            'first_name' => ['sometimes', 'required', 'string', 'max:100'],
            'last_name' => ['sometimes', 'required', 'string', 'max:100'],
            'job_title' => ['sometimes', 'nullable', 'string', 'max:150'],

            'work_email' => [
                'sometimes',
                'nullable',
                'email',
                'max:255',
                Rule::unique('employees', 'work_email')
                    ->where('company_id', $companyId)
                    ->ignore($employee),
            ],

            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'hire_date' => [
                'sometimes',
                'nullable',
                'date',
                'before_or_equal:today',
            ],

            'employment_type' => [
                'sometimes',
                'required',
                Rule::in([
                    'full_time',
                    'part_time',
                    'contract',
                    'intern',
                ]),
            ],

            'status' => [
                'sometimes',
                'required',
                Rule::in([
                    'active',
                    'inactive',
                    'on_leave',
                ]),
            ],

            'avatar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ];
    }
}