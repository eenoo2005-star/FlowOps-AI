<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DashboardAnalyticsRequest;
use App\Services\DashboardAnalyticsService;
use Illuminate\Http\JsonResponse;

final class DashboardAnalyticsController extends Controller
{
    public function __invoke(
        DashboardAnalyticsRequest $request,
        DashboardAnalyticsService $service
    ): JsonResponse {
        $days = (int) $request->validated(
            'days',
            30
        );

        $companyId = $request
            ->user()
            ->company_id;

        return response()->json([
            'data' => $companyId === null
                ? $service->empty($days)
                : $service->build(
                    (int) $companyId,
                    $days
                ),
        ]);
    }
}
