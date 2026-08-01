<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreInternalRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $companyId = $this->user()->company_id;

        return [
            'request_type_id' => [
                'required',
                'integer',

                Rule::exists(
                    'request_types',
                    'id'
                )->where('company_id', $companyId),
            ],

            'requester_employee_id' => [
                'nullable',
                'integer',

                Rule::exists(
                    'employees',
                    'id'
                )->where('company_id', $companyId),
            ],

            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'payload' => [
                'nullable',
                'array',
            ],

            'priority' => [
                'required',
                Rule::in([
                    'low',
                    'normal',
                    'high',
                    'urgent',
                ]),
            ],
        ];
    }
}
