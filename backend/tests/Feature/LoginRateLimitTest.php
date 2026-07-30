<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginRateLimitTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_endpoint_is_rate_limited_after_five_attempts(): void
    {
        $payload = [
            'email' => 'attacker@example.test',
            'password' => 'WrongPassword123!',
            'device_name' => 'automated-test',
        ];

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->postJson('/api/login', $payload)
                ->assertStatus(422);
        }

        $response = $this->postJson('/api/login', $payload);

        $response
            ->assertStatus(429)
            ->assertJson([
                'message' => 'Too many login attempts. Please try again later.',
            ])
            ->assertJsonStructure([
                'message',
                'retry_after',
            ]);

        $this->assertGreaterThan(
            0,
            $response->json('retry_after')
        );
    }
}