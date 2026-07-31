<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Employee;
use App\Models\LoginAttempt;
use App\Models\Scopes\TenantScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $companyId = $user->company_id;

        if ($companyId === null) {
            return response()->json([
                'data' => $this->emptySummary(),
            ]);
        }

        $employeesTotal = Employee::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('company_id', $companyId)
            ->count();

        $departmentsTotal = Department::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('company_id', $companyId)
            ->count();

        $securityAttempts = LoginAttempt::query()
            ->where('company_id', $companyId)
            ->where(
                'attempted_at',
                '>=',
                now()->subDay()
            );

        $failedLogins = (clone $securityAttempts)
            ->where('was_successful', false)
            ->count();

        $elevatedRiskThreshold = (int) config(
            'security.risk.elevated_threshold',
            50
        );

        $elevatedRiskAttempts = (clone $securityAttempts)
            ->where(
                'risk_score',
                '>=',
                $elevatedRiskThreshold
            )
            ->count();

        return response()->json([
            'data' => [
                'employees_total' => $employeesTotal,
                'departments_total' => $departmentsTotal,
                'failed_logins_24h' => $failedLogins,
                'elevated_risk_attempts_24h' => $elevatedRiskAttempts,

                'generated_at' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * @return array{
     *     employees_total: int,
     *     departments_total: int,
     *     failed_logins_24h: int,
     *     elevated_risk_attempts_24h: int,
     *     generated_at: string
     * }
     */
    private function emptySummary(): array
    {
        return [
            'employees_total' => 0,
            'departments_total' => 0,
            'failed_logins_24h' => 0,
            'elevated_risk_attempts_24h' => 0,
            'generated_at' => now()->toIso8601String(),
        ];
    }
}
