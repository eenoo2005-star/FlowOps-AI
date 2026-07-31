<?php

namespace App\Http\Controllers\Api\Security;

use App\Http\Controllers\Controller;
use App\Http\Requests\Security\IndexLoginAttemptRequest;
use App\Http\Requests\Security\SecurityOverviewRequest;
use App\Http\Resources\Security\LoginAttemptResource;
use App\Services\Security\SecurityAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class SecurityController extends Controller
{
    public function loginAttempts(
        IndexLoginAttemptRequest $request,
        SecurityAnalyticsService $securityAnalytics
    ): AnonymousResourceCollection {
        $loginAttempts = $securityAnalytics
            ->paginateLoginAttempts(
                $request->user(),
                $request->validated()
            );

        return LoginAttemptResource::collection(
            $loginAttempts
        );
    }

    public function overview(
        SecurityOverviewRequest $request,
        SecurityAnalyticsService $securityAnalytics
    ): JsonResponse {
        $defaultDays = (int) config(
            'security.overview.default_days',
            30
        );

        $overview = $securityAnalytics->overview(
            $request->user(),
            (int) $request->validated(
                'days',
                $defaultDays
            )
        );

        $overview['recent_elevated_attempts'] =
            LoginAttemptResource::collection(
                $overview['recent_elevated_attempts']
            )->resolve($request);

        return response()->json([
            'data' => $overview,
        ]);
    }
}
