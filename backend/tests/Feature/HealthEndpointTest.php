<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class HealthEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint_is_public_and_reports_dependencies(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertJsonPath('data.status', 'healthy')
            ->assertJsonPath('data.checks.database.status', 'ok')
            ->assertJsonPath('data.checks.cache.status', 'ok')
            ->assertJsonPath('data.checks.storage.status', 'ok')
            ->assertJsonPath('data.checks.queue.status', 'ok')
            ->assertJsonStructure([
                'data' => [
                    'status',
                    'checks' => [
                        'database' => [
                            'status',
                            'latency_ms',
                        ],
                        'cache' => [
                            'status',
                            'latency_ms',
                        ],
                        'storage' => [
                            'status',
                            'latency_ms',
                        ],
                        'queue' => [
                            'status',
                            'latency_ms',
                        ],
                    ],
                    'timestamp',
                ],
            ]);
    }
}
