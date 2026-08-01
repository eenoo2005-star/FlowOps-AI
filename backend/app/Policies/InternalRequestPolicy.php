<?php

namespace App\Policies;

use App\Models\InternalRequest;
use App\Models\User;

final class InternalRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('requests.view');
    }

    public function view(
        User $user,
        InternalRequest $internalRequest
    ): bool {
        return $this->sameCompany(
            $user,
            $internalRequest
        ) && (
            $user->can('requests.view_all')
            || $this->ownsRequest(
                $user,
                $internalRequest
            )
        );
    }

    public function create(User $user): bool
    {
        return $user->company_id !== null
            && $user->can('requests.create');
    }

    public function update(
        User $user,
        InternalRequest $internalRequest
    ): bool {
        return $internalRequest->status === 'draft'
            && $user->can('requests.update')
            && $this->view($user, $internalRequest);
    }

    public function submit(
        User $user,
        InternalRequest $internalRequest
    ): bool {
        return $internalRequest->status === 'draft'
            && $user->can('requests.submit')
            && $this->view($user, $internalRequest);
    }

    public function delete(
        User $user,
        InternalRequest $internalRequest
    ): bool {
        return $internalRequest->status === 'draft'
            && $user->can('requests.delete')
            && $this->view($user, $internalRequest);
    }

    private function sameCompany(
        User $user,
        InternalRequest $internalRequest
    ): bool {
        return $user->company_id
            === $internalRequest->company_id;
    }

    private function ownsRequest(
        User $user,
        InternalRequest $internalRequest
    ): bool {
        return $user->employee?->id
            === $internalRequest->requester_employee_id;
    }
}
