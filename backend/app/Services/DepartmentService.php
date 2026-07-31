<?php

namespace App\Services;

use App\Models\Department;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

final class DepartmentService
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        $query = Department::query();

        $search = mb_strtolower(
            trim((string) ($filters['search'] ?? ''))
        );

        if ($search !== '') {
            $likeSearch = "%{$search}%";

            $query->where(
                function (Builder $searchQuery) use ($likeSearch): void {
                    $searchQuery
                        ->whereRaw(
                            'LOWER(name) LIKE ?',
                            [$likeSearch]
                        )
                        ->orWhereRaw(
                            'LOWER(code) LIKE ?',
                            [$likeSearch]
                        )
                        ->orWhereRaw(
                            "LOWER(COALESCE(description, '')) LIKE ?",
                            [$likeSearch]
                        );
                }
            );
        }

        match ($filters['status'] ?? 'all') {
            'active' => $query->where('is_active', true),
            'inactive' => $query->where('is_active', false),
            default => null,
        };

        match ($filters['sort'] ?? 'newest') {
            'oldest' => $query
                ->orderBy('created_at')
                ->orderBy('id'),

            'name_asc' => $query
                ->orderBy('name')
                ->orderBy('id'),

            'name_desc' => $query
                ->orderByDesc('name')
                ->orderByDesc('id'),

            'code_asc' => $query
                ->orderBy('code')
                ->orderBy('id'),

            'code_desc' => $query
                ->orderByDesc('code')
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
    public function create(array $data): Department
    {
        return Department::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(
        Department $department,
        array $data
    ): Department {
        $department->update($data);

        return $department->fresh();
    }

    public function delete(Department $department): void
    {
        $department->delete();
    }
}
