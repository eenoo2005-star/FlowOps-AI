<?php

namespace App\Http\Requests\Administration;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateRolePermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('roles.manage') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'permissions' => ['required', 'array', 'max:300'],
            'permissions.*' => ['string', 'max:160'],
        ];
    }
}
