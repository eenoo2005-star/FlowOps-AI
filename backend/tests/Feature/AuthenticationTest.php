<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Facades\Hash;
use App\Models\Company;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_valid_credentials(): void
{
    $company = Company::factory()->create([
        'is_active' => true,
    ]);

    $user = User::factory()->create([
        'company_id' => $company->id,
        'email' => 'user@example.test',
        'password' => Hash::make('CorrectPassword123!'),
    ]);

    $response = $this
        ->withServerVariables([
            'REMOTE_ADDR' => '10.10.0.1',
        ])
        ->postJson('/api/login', [
            'email' => 'user@example.test',
            'password' => 'CorrectPassword123!',
            'device_name' => 'testing',
        ]);

    $response
        ->assertOk()
        ->assertJson([
            'message' => 'Authentication successful.',
            'token_type' => 'Bearer',
        ])
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonPath('user.company_id', $company->id)
        ->assertJsonPath('user.email', 'user@example.test')
        ->assertJsonStructure([
            'message',
            'token',
            'token_type',
            'user' => [
                'id',
                'company_id',
                'name',
                'email',
                'roles',
                'permissions',
            ],
        ]);

    $this->assertNotEmpty($response->json('token'));

    $this->assertDatabaseHas('login_attempts', [
        'company_id' => $company->id,
        'user_id' => $user->id,
        'was_successful' => true,
        'failure_reason' => null,
    ]);
}
    public function test_login_fails_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'user@example.com',
            'password' => 'Password123!',
        ]);

        $this->postJson('/api/login', [
            'email' => 'user@example.com',
            'password' => 'wrong-password',
        ])->assertUnprocessable();
    }

    public function test_guest_cannot_access_protected_routes(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
        $this->getJson('/api/departments')->assertUnauthorized();
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('testing');

        $this->withToken($token->plainTextToken)
            ->postJson('/api/logout')
            ->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
    public function test_login_endpoint_is_rate_limited(): void
{
    User::factory()->create([
        'email' => 'rate-limit@example.com',
        'password' => 'Password123!',
    ]);

    $payload = [
        'email' => 'rate-limit@example.com',
        'password' => 'wrong-password',
    ];

    for ($attempt = 0; $attempt < 5; $attempt++) {
        $this->postJson('/api/login', $payload)
            ->assertUnprocessable();
    }

    $this->postJson('/api/login', $payload)
        ->assertStatus(429);
}
public function test_user_cannot_login_when_company_is_inactive(): void
{
    $company = Company::factory()->create([
        'is_active' => false,
    ]);

    $user = User::factory()->create([
        'company_id' => $company->id,
        'email' => 'inactive@example.test',
        'password' => Hash::make('CorrectPassword123!'),
    ]);

    $this
        ->withServerVariables([
            'REMOTE_ADDR' => '10.10.0.2',
        ])
        ->postJson('/api/login', [
            'email' => 'inactive@example.test',
            'password' => 'CorrectPassword123!',
            'device_name' => 'testing',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['email'])
        ->assertJsonPath(
            'errors.email.0',
            'The provided credentials are incorrect.'
        );

    $this->assertDatabaseHas('login_attempts', [
        'company_id' => $company->id,
        'user_id' => $user->id,
        'was_successful' => false,
        'failure_reason' => 'company_inactive',
        'risk_score' => 50,
    ]);
}
}