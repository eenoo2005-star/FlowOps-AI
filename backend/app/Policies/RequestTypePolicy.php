<?php

namespace App\Policies;

use App\Models\RequestType;
use App\Models\User;

final class RequestTypePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('request-types.view');
    }

    public function view(
        User $user,
        RequestType $requestType
    ): bool {
        return $user->company_id
            === $requestType->company_id
            && $user->can('request-types.view');
    }

    public function create(User $user): bool
    {
        return $user->company_id !== null
            && $user->can('request-types.create');
    }

    public function update(
        User $user,
        RequestType $requestType
    ): bool {
        return $user->company_id
            === $requestType->company_id
            && $user->can('request-types.update');
    }

    public function delete(
        User $user,
        RequestType $requestType
    ): bool {
        return $user->company_id
            === $requestType->company_id
            && $user->can('request-types.delete');
    }
}
