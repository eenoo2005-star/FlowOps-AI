<?php

namespace App\Services;

use App\Models\Employee;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

final class EmployeeService
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        $query = Employee::query()
            ->with([
                'department:id,name,code',
                'manager:id,first_name,last_name',
                'user:id,name,email',
            ]);

        $search = mb_strtolower(
            trim((string) ($filters['search'] ?? ''))
        );

        if ($search !== '') {
            $likeSearch = "%{$search}%";

            $query->where(
                function (Builder $searchQuery) use ($likeSearch): void {
                    $searchQuery
                        ->whereRaw(
                            'LOWER(employee_number) LIKE ?',
                            [$likeSearch]
                        )
                        ->orWhereRaw(
                            'LOWER(first_name) LIKE ?',
                            [$likeSearch]
                        )
                        ->orWhereRaw(
                            'LOWER(last_name) LIKE ?',
                            [$likeSearch]
                        )
                        ->orWhereRaw(
                            "LOWER(COALESCE(job_title, '')) LIKE ?",
                            [$likeSearch]
                        )
                        ->orWhereRaw(
                            "LOWER(COALESCE(work_email, '')) LIKE ?",
                            [$likeSearch]
                        )
                        ->orWhereRaw(
                            "LOWER(COALESCE(phone, '')) LIKE ?",
                            [$likeSearch]
                        )
                        ->orWhereHas(
                            'department',
                            function (Builder $departmentQuery) use (
                                $likeSearch
                            ): void {
                                $departmentQuery
                                    ->whereRaw(
                                        'LOWER(name) LIKE ?',
                                        [$likeSearch]
                                    )
                                    ->orWhereRaw(
                                        'LOWER(code) LIKE ?',
                                        [$likeSearch]
                                    );
                            }
                        );
                }
            );
        }

        $status = (string) ($filters['status'] ?? 'all');

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $employmentType = (string) (
            $filters['employment_type'] ?? 'all'
        );

        if ($employmentType !== 'all') {
            $query->where(
                'employment_type',
                $employmentType
            );
        }

        if (! empty($filters['department_id'])) {
            $query->where(
                'department_id',
                (int) $filters['department_id']
            );
        }

        match ($filters['sort'] ?? 'newest') {
            'oldest' => $query
                ->orderBy('created_at')
                ->orderBy('id'),

            'name_asc' => $query
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->orderBy('id'),

            'name_desc' => $query
                ->orderByDesc('first_name')
                ->orderByDesc('last_name')
                ->orderByDesc('id'),

            'employee_number_asc' => $query
                ->orderBy('employee_number')
                ->orderBy('id'),

            'employee_number_desc' => $query
                ->orderByDesc('employee_number')
                ->orderByDesc('id'),

            'hire_date_asc' => $query
                ->orderByRaw(
                    'CASE WHEN hire_date IS NULL THEN 1 ELSE 0 END'
                )
                ->orderBy('hire_date')
                ->orderBy('id'),

            'hire_date_desc' => $query
                ->orderByRaw(
                    'CASE WHEN hire_date IS NULL THEN 1 ELSE 0 END'
                )
                ->orderByDesc('hire_date')
                ->orderByDesc('id'),

            default => $query
                ->orderByDesc('created_at')
                ->orderByDesc('id'),
        };

        $perPage = min(
            max((int) ($filters['per_page'] ?? 15), 5),
            100
        );

        return $query
            ->paginate($perPage)
            ->appends($filters);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(
        array $data,
        int $companyId
    ): Employee {
        $data['company_id'] = $companyId;

        return Employee::query()
            ->create($data)
            ->load([
                'department:id,name,code',
                'manager:id,first_name,last_name',
                'user:id,name,email',
            ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(
        Employee $employee,
        array $data
    ): Employee {
        $employee->update($data);

        return $employee
            ->fresh()
            ->load([
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
