<?php

namespace App\Http\Requests;

use App\Models\RequestType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateRequestTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var RequestType $requestType */
        $requestType = $this->route('requestType');

        $companyId = $this->user()->company_id;

        return [
            'workflow_definition_id' => [
                'sometimes',
                'required',
                'integer',

                Rule::exists(
                    'workflow_definitions',
                    'id'
                )->where('company_id', $companyId),
            ],

            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'code' => [
                'sometimes',
                'required',
                'string',
                'max:80',

                Rule::unique(
                    'request_types',
                    'code'
                )
                    ->where(
                        'company_id',
                        $companyId
                    )
                    ->ignore($requestType),
            ],

            'description' => [
                'sometimes',
                'nullable',
                'string',
            ],

            'instructions' => [
                'sometimes',
                'nullable',
                'string',
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ];
    }
}
