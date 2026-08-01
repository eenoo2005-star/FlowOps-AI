<?php

namespace App\Http\Controllers;

use App\Http\Requests\WorkspaceSearchRequest;
use App\Services\WorkspaceSearchService;
use Illuminate\Http\JsonResponse;

final class WorkspaceSearchController extends Controller
{
    public function __invoke(
        WorkspaceSearchRequest $request,
        WorkspaceSearchService $service
    ): JsonResponse {
        $query = (string) $request->validated('q');
        $limit = (int) $request->validated(
            'limit',
            6
        );

        return response()->json([
            'data' => [
                'query' => $query,
                'results' => $service->search(
                    $request->user(),
                    $query,
                    $limit
                ),
            ],
        ]);
    }
}
