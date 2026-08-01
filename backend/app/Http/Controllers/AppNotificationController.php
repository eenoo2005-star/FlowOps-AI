<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexAppNotificationRequest;
use App\Http\Resources\AppNotificationResource;
use App\Models\AppNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class AppNotificationController extends Controller
{
    public function index(
        IndexAppNotificationRequest $request
    ): AnonymousResourceCollection {
        $query = AppNotification::query()
            ->where(
                'user_id',
                $request->user()->id
            );

        match (
            $request->validated('status', 'all')
        ) {
            'unread' => $query->whereNull('read_at'),
            'read' => $query->whereNotNull('read_at'),
            default => null,
        };

        return AppNotificationResource::collection(
            $query
                ->latest()
                ->paginate(
                    min(
                        max(
                            (int) $request->validated(
                                'per_page',
                                20
                            ),
                            5
                        ),
                        100
                    )
                )
        );
    }

    public function unreadCount(
        Request $request
    ): JsonResponse {
        abort_unless(
            $request->user()->can(
                'notifications.view'
            ),
            403
        );

        $count = AppNotification::query()
            ->where(
                'user_id',
                $request->user()->id
            )
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'data' => [
                'unread_count' => $count,
            ],
        ]);
    }

    public function markRead(
        Request $request,
        AppNotification $appNotification
    ): JsonResponse {
        abort_unless(
            $request->user()->can(
                'notifications.view'
            ),
            403
        );

        abort_unless(
            $appNotification->user_id
                === $request->user()->id,
            404
        );

        $appNotification->markAsRead();

        $notification = $appNotification->fresh();

        return response()->json([
            'data' => (
                new AppNotificationResource(
                    $notification
                )
            )->resolve($request),
        ]);
    }

    public function markAllRead(
        Request $request
    ): JsonResponse {
        abort_unless(
            $request->user()->can(
                'notifications.view'
            ),
            403
        );

        AppNotification::query()
            ->where(
                'user_id',
                $request->user()->id
            )
            ->whereNull('read_at')
            ->update([
                'read_at' => now(),
                'updated_at' => now(),
            ]);

        return response()->json([
            'message' => 'All notifications marked as read.',
        ]);
    }
}
