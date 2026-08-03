<?php

namespace App\Services;

use App\Models\RequestType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

final class RequestTypeService
{
    public function paginate(
        array $filters = []
    ): LengthAwarePaginator {
        $query = RequestType::query()
            ->with([
                'workflowDefinition:id,name,code,version,is_active',
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

        return $query
            ->orderBy('name')
            ->paginate(
                min(
                    max(
                        (int) ($filters['per_page'] ?? 15),
                        5
                    ),
                    100
                )
            )
            ->appends($filters);
    }

    public function activeOptions(): Collection
    {
        return RequestType::query()
            ->with([
                'workflowDefinition:id,name,code,version,is_active',
            ])
            ->where('is_active', true)
            ->whereHas(
                'workflowDefinition',
                fn (Builder $query): Builder => $query->where('is_active', true)
            )
            ->orderBy('name')
            ->limit(100)
            ->get();
    }

    public function create(
        array $data,
        int $companyId
    ): RequestType {
        $data['company_id'] = $companyId;

        return RequestType::query()
            ->create($data)
            ->load(
                'workflowDefinition:id,name,code,version,is_active'
            );
    }

    public function update(
        RequestType $requestType,
        array $data
    ): RequestType {
        $requestType->update($data);

        return $requestType
            ->fresh()
            ->load(
                'workflowDefinition:id,name,code,version,is_active'
            );
    }

    public function delete(
        RequestType $requestType
    ): void {
        $requestType->delete();
    }
}
