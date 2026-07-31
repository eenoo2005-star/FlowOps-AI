<?php

namespace App\Services\Security;

use App\Models\LoginAttempt;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

final class SecurityAnalyticsService
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function paginateLoginAttempts(
        User $user,
        array $filters
    ): LengthAwarePaginator {
        $query = $this
            ->scopedQuery($user)
            ->with([
                'company:id,name,code',
                'user:id,name,email',
            ]);

        $this->applyFilters($query, $filters);
        $this->applySorting($query, $filters);

        $defaultPerPage = (int) config(
            'security.pagination.default_per_page',
            20
        );

        $maximumPerPage = (int) config(
            'security.pagination.max_per_page',
            100
        );

        $perPage = min(
            max(
                (int) ($filters['per_page'] ?? $defaultPerPage),
                1
            ),
            $maximumPerPage
        );

        return $query
            ->paginate($perPage)
            ->appends($filters);
    }

    /**
     * @return array{
     *     period: array{days: int, from: string, to: string},
     *     metrics: array{
     *         total_attempts: int,
     *         successful_attempts: int,
     *         failed_attempts: int,
     *         elevated_risk_attempts: int,
     *         unique_ip_addresses: int,
     *         success_rate: float
     *     },
     *     top_countries: Collection<int, array<string, mixed>>,
     *     top_failure_reasons: Collection<int, array<string, mixed>>,
     *     recent_elevated_attempts: Collection<int, LoginAttempt>
     * }
     */
    public function overview(User $user, int $days): array
    {
        $maximumDays = (int) config(
            'security.overview.max_days',
            90
        );

        $days = min(max($days, 1), $maximumDays);

        $to = now();
        $from = now()
            ->subDays($days - 1)
            ->startOfDay();

        $baseQuery = $this
            ->scopedQuery($user)
            ->whereBetween('attempted_at', [$from, $to]);

        $totalAttempts = (clone $baseQuery)->count();

        $successfulAttempts = (clone $baseQuery)
            ->where('was_successful', true)
            ->count();

        $failedAttempts = (clone $baseQuery)
            ->where('was_successful', false)
            ->count();

        $elevatedThreshold = (int) config(
            'security.risk.elevated_threshold',
            50
        );

        $elevatedRiskAttempts = (clone $baseQuery)
            ->where('risk_score', '>=', $elevatedThreshold)
            ->count();

        $uniqueIpAddresses = (clone $baseQuery)
            ->distinct()
            ->count('ip_address');

        $successRate = $totalAttempts > 0
            ? round(
                ($successfulAttempts / $totalAttempts) * 100,
                2
            )
            : 0.0;

        $topCountries = (clone $baseQuery)
            ->whereNotNull('country_code')
            ->select([
                'country_code',
                'country',
            ])
            ->selectRaw('COUNT(*) AS attempts')
            ->groupBy([
                'country_code',
                'country',
            ])
            ->orderByDesc('attempts')
            ->limit(5)
            ->get()
            ->map(static fn (LoginAttempt $attempt): array => [
                'country_code' => $attempt->country_code,
                'country' => $attempt->country,
                'attempts' => (int) $attempt->getAttribute('attempts'),
            ]);

        $topFailureReasons = (clone $baseQuery)
            ->where('was_successful', false)
            ->whereNotNull('failure_reason')
            ->select('failure_reason')
            ->selectRaw('COUNT(*) AS attempts')
            ->groupBy('failure_reason')
            ->orderByDesc('attempts')
            ->limit(5)
            ->get()
            ->map(static fn (LoginAttempt $attempt): array => [
                'failure_reason' => $attempt->failure_reason,
                'attempts' => (int) $attempt->getAttribute('attempts'),
            ]);

        $recentElevatedAttempts = (clone $baseQuery)
            ->with([
                'company:id,name,code',
                'user:id,name,email',
            ])
            ->where('risk_score', '>=', $elevatedThreshold)
            ->orderByDesc('attempted_at')
            ->limit(5)
            ->get();

        return [
            'period' => [
                'days' => $days,
                'from' => $from->toIso8601String(),
                'to' => $to->toIso8601String(),
            ],

            'metrics' => [
                'total_attempts' => $totalAttempts,
                'successful_attempts' => $successfulAttempts,
                'failed_attempts' => $failedAttempts,
                'elevated_risk_attempts' => $elevatedRiskAttempts,
                'unique_ip_addresses' => $uniqueIpAddresses,
                'success_rate' => $successRate,
            ],

            'top_countries' => $topCountries,

            'top_failure_reasons' => $topFailureReasons,

            'recent_elevated_attempts' => $recentElevatedAttempts,
        ];
    }

    private function scopedQuery(User $user): Builder
    {
        $query = LoginAttempt::query();

        /*
         * A user with this explicit permission may inspect all companies,
         * including attempts that could not be associated with a company.
         */
        if ($user->can('view all security data')) {
            return $query;
        }

        /*
         * Never accidentally expose global security records to a user
         * who has no company association.
         */
        if ($user->company_id === null) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where(
            'company_id',
            $user->company_id
        );
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function applyFilters(
        Builder $query,
        array $filters
    ): void {
        $status = $filters['status'] ?? 'all';

        if ($status === 'successful') {
            $query->where('was_successful', true);
        }

        if ($status === 'failed') {
            $query->where('was_successful', false);
        }

        if (! empty($filters['country_code'])) {
            $query->where(
                'country_code',
                $filters['country_code']
            );
        }

        if (! empty($filters['ip_address'])) {
            $query->where(
                'ip_address',
                $filters['ip_address']
            );
        }

        if (! empty($filters['failure_reason'])) {
            $query->where(
                'failure_reason',
                $filters['failure_reason']
            );
        }

        if (isset($filters['risk_min'])) {
            $query->where(
                'risk_score',
                '>=',
                (int) $filters['risk_min']
            );
        }

        if (isset($filters['risk_max'])) {
            $query->where(
                'risk_score',
                '<=',
                (int) $filters['risk_max']
            );
        }

        if (! empty($filters['from'])) {
            $query->whereDate(
                'attempted_at',
                '>=',
                $filters['from']
            );
        }

        if (! empty($filters['to'])) {
            $query->whereDate(
                'attempted_at',
                '<=',
                $filters['to']
            );
        }

        $search = trim((string) ($filters['search'] ?? ''));

        if ($search !== '') {
            $lowercaseSearch = mb_strtolower($search);
            $likeSearch = "%{$lowercaseSearch}%";
            $rawSearch = "%{$search}%";

            $query->where(
                function (Builder $searchQuery) use (
                    $likeSearch,
                    $rawSearch
                ): void {
                    $searchQuery
                        ->whereRaw(
                            'LOWER(email_masked) LIKE ?',
                            [$likeSearch]
                        )
                        ->orWhere(
                            'ip_address',
                            'like',
                            $rawSearch
                        )
                        ->orWhereRaw(
                            "LOWER(COALESCE(country, '')) LIKE ?",
                            [$likeSearch]
                        )
                        ->orWhereRaw(
                            "LOWER(COALESCE(region, '')) LIKE ?",
                            [$likeSearch]
                        )
                        ->orWhereRaw(
                            "LOWER(COALESCE(city, '')) LIKE ?",
                            [$likeSearch]
                        );
                }
            );
        }
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function applySorting(
        Builder $query,
        array $filters
    ): void {
        $sort = $filters['sort'] ?? 'newest';

        match ($sort) {
            'oldest' => $query
                ->orderBy('attempted_at')
                ->orderBy('id'),

            'risk_high' => $query
                ->orderByDesc('risk_score')
                ->orderByDesc('attempted_at'),

            'risk_low' => $query
                ->orderBy('risk_score')
                ->orderByDesc('attempted_at'),

            default => $query
                ->orderByDesc('attempted_at')
                ->orderByDesc('id'),
        };
    }
}
