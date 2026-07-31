<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Department;
use App\Models\Employee;
use App\Models\LoginAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardSummaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_dashboard_summary(): void
    {
        $this
            ->getJson('/api/dashboard/summary')
            ->assertUnauthorized();
    }

    public function test_dashboard_summary_only_contains_company_data(): void
    {
        config()->set(
            'ip_geolocation.enabled',
            false
        );

        $companyA = Company::factory()->create();
        $companyB = Company::factory()->create();

        $departmentA = Department::factory()->create([
            'company_id' => $companyA->id,
        ]);

        $departmentB = Department::factory()->create([
            'company_id' => $companyB->id,
        ]);

        Department::factory()->create([
            'company_id' => $companyA->id,
        ]);

        Employee::factory()->count(3)->create([
            'company_id' => $companyA->id,
            'department_id' => $departmentA->id,
        ]);

        Employee::factory()->count(2)->create([
            'company_id' => $companyB->id,
            'department_id' => $departmentB->id,
        ]);

        $this->createLoginAttempt(
            $companyA,
            false,
            25
        );

        $this->createLoginAttempt(
            $companyA,
            false,
            70
        );

        $this->createLoginAttempt(
            $companyA,
            true,
            0
        );

        $this->createLoginAttempt(
            $companyB,
            false,
            90
        );

        $user = User::factory()->create([
            'company_id' => $companyA->id,
        ]);

        Sanctum::actingAs($user, ['*']);

        $this
            ->getJson('/api/dashboard/summary')
            ->assertOk()
            ->assertJsonPath(
                'data.employees_total',
                3
            )
            ->assertJsonPath(
                'data.departments_total',
                2
            )
            ->assertJsonPath(
                'data.failed_logins_24h',
                2
            )
            ->assertJsonPath(
                'data.elevated_risk_attempts_24h',
                1
            )
            ->assertJsonStructure([
                'data' => [
                    'employees_total',
                    'departments_total',
                    'failed_logins_24h',
                    'elevated_risk_attempts_24h',
                    'generated_at',
                ],
            ]);
    }

    private function createLoginAttempt(
        Company $company,
        bool $wasSuccessful,
        int $riskScore
    ): LoginAttempt {
        $sequence = LoginAttempt::query()->count() + 1;

        return LoginAttempt::query()->create([
            'company_id' => $company->id,
            'user_id' => null,

            'email_hash' => hash(
                'sha256',
                "dashboard-{$sequence}@example.test"
            ),

            'email_masked' => "d{$sequence}***@example.test",

            'ip_address' => "8.8.8.{$sequence}",
            'user_agent' => 'Dashboard Test',

            'was_successful' => $wasSuccessful,

            'failure_reason' => $wasSuccessful
                ? null
                : 'invalid_credentials',

            'country_code' => 'US',
            'country' => 'United States',
            'region' => 'California',
            'city' => 'Test City',

            'risk_score' => $riskScore,
            'attempted_at' => now()->subMinutes(
                $sequence
            ),
        ]);
    }
}
