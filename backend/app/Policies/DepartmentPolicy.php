<?php

namespace App\Policies;

use App\Models\Department;
use App\Models\User;

class DepartmentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('departments.view');
    }

    public function view(User $user, Department $department): bool
    {
        return $user->company_id === $department->company_id
            && $user->can('departments.view');
    }

    public function create(User $user): bool
    {
        return $user->company_id !== null
            && $user->can('departments.create');
    }

    public function update(User $user, Department $department): bool
    {
        return $user->company_id === $department->company_id
            && $user->can('departments.update');
    }

    public function delete(User $user, Department $department): bool
    {
        return $user->company_id === $department->company_id
            && $user->can('departments.delete');
    }

    public function restore(User $user, Department $department): bool
    {
        return false;
    }

    public function forceDelete(User $user, Department $department): bool
    {
        return false;
    }
}