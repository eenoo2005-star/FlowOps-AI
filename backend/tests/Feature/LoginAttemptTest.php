<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LoginAttemptTest extends TestCase
{
    use RefreshDatabase;

    public function test_failed_login_attempt_is_recorded_without_password(): void
    {
        $company = Company::factory()->create([
            'is_active' => true,
        ]);

        User::factory()->create([
            'company_id' => $company->id,
            'email' => 'security@example.test',
            'password' => Hash::make('CorrectPassword123!'),
        ]);

        $this->postJson('/api/login', [
            'email' => 'security@example.test',
            'password' => 'WrongPassword123!',
            'device_name' => 'security-test',
        ])->assertStatus(422);

        $this->assertDatabaseHas('login_attempts', [
            'company_id' => $company->id,
            'email_hash' => hash(
                'sha256',
                'security@example.test'
            ),
            'email_masked' => 's***@example.test',
            'ip_address' => '127.0.0.1',
            'was_successful' => false,
            'failure_reason' => 'invalid_credentials',
        ]);

        $this->assertDatabaseMissing('login_attempts', [
            'user_agent' => 'WrongPassword123!',
        ]);
    }

    public function test_successful_login_attempt_is_recorded(): void
    {
        $company = Company::factory()->create([
            'is_active' => true,
        ]);

        $user = User::factory()->create([
            'company_id' => $company->id,
            'email' => 'success@example.test',
            'password' => Hash::make('CorrectPassword123!'),
        ]);

        $this->postJson('/api/login', [
            'email' => 'success@example.test',
            'password' => 'CorrectPassword123!',
            'device_name' => 'security-test',
        ])->assertOk();

        $this->assertDatabaseHas('login_attempts', [
            'company_id' => $company->id,
            'user_id' => $user->id,
            'email_hash' => hash(
                'sha256',
                'success@example.test'
            ),
            'was_successful' => true,
            'failure_reason' => null,
            'risk_score' => 0,
        ]);
    }
}