<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

final class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $checks = [
            'database' => $this->check(function (): void {
                DB::select('select 1');
            }),
            'cache' => $this->check(function (): void {
                $key = 'health:'.Str::uuid();

                Cache::put($key, 'ok', 10);

                if (Cache::get($key) !== 'ok') {
                    throw new RuntimeException('Cache verification failed.');
                }

                Cache::forget($key);
            }),
            'storage' => $this->check(function (): void {
                $directory = storage_path('app/private');
                $probe = $directory.'/health-'.Str::uuid().'.tmp';

                File::ensureDirectoryExists($directory);

                try {
                    File::put($probe, 'ok');

                    if (File::get($probe) !== 'ok') {
                        throw new RuntimeException('Storage verification failed.');
                    }
                } finally {
                    File::delete($probe);
                }
            }),
            'queue' => $this->check(function (): void {
                if (config('queue.default') !== 'database') {
                    return;
                }

                $table = (string) config(
                    'queue.connections.database.table',
                    'jobs'
                );

                if (! Schema::hasTable($table)) {
                    throw new RuntimeException('Queue table is unavailable.');
                }

                DB::table($table)->limit(1)->get();
            }),
        ];

        $healthy = collect($checks)->every(
            fn (array $check): bool => $check['status'] === 'ok'
        );

        return response()->json([
            'data' => [
                'status' => $healthy ? 'healthy' : 'unhealthy',
                'checks' => $checks,
                'timestamp' => now()->toIso8601String(),
            ],
        ], $healthy ? 200 : 503);
    }

    /**
     * @return array{status: string, latency_ms: float}
     */
    private function check(callable $callback): array
    {
        $startedAt = hrtime(true);

        try {
            $callback();

            return [
                'status' => 'ok',
                'latency_ms' => $this->latency($startedAt),
            ];
        } catch (Throwable $exception) {
            report($exception);

            return [
                'status' => 'failed',
                'latency_ms' => $this->latency($startedAt),
            ];
        }
    }

    private function latency(int $startedAt): float
    {
        return round((hrtime(true) - $startedAt) / 1_000_000, 2);
    }
}
