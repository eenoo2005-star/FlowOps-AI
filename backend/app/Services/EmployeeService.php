<?php

namespace App\Services;

use App\Models\Employee;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EmployeeService
{
    public function paginate(): LengthAwarePaginator
    {
        return Employee::query()
            ->with([
                'department:id,name,code',
                'manager:id,first_name,last_name',
                'user:id,name,email',
            ])
            ->latest()
            ->paginate(15);
    }

    public function create(array $data, int $companyId): Employee
    {
        $data['company_id'] = $companyId;

        return Employee::create($data)->load([
            'department:id,name,code',
            'manager:id,first_name,last_name',
            'user:id,name,email',
        ]);
    }

    public function update(Employee $employee, array $data): Employee
    {
        $employee->update($data);

        return $employee->fresh()->load([
            'department:id,name,code',
            'manager:id,first_name,last_name',
            'user:id,name,email',
        ]);
    }

    public function delete(Employee $employee): void
    {
        $employee->delete();
    }
}