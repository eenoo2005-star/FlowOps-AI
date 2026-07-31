<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\LoginAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class SecurityApiTest extends TestCase
{
    use RefreshDatabase;

    private int $attemptSequence = 0;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('ip_geolocation.enabled', false);
        config()->set(
            'security.risk.elevated_threshold',
            50
        );

        Queue::fake();

        app(PermissionRegistrar::class)
            ->forgetCachedPermissions();

        Permission::findOrCreate(
            'view security dashboard',
            'web'
        );

        Permission::findOrCreate(
            'view all security data',
            'web'
        );
    }

    public function test_guest_cannot_access_security_api(): void
    {
        $this
            ->getJson('/api/security/login-attempts')
            ->assertUnauthorized();

        $this
            ->getJson('/api/security/overview')
            ->assertUnauthorized();
    }

    public function test_user_without_permission_cannot_access_security_api(): void
    {
        $company = Company::factory()->create();

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        Sanctum::actingAs($user, ['*']);

        $this
            ->getJson('/api/security/login-attempts')
            ->assertForbidden();

        $this
            ->getJson('/api/security/overview')
            ->assertForbidden();
    }

    public function test_company_user_only_sees_their_company_attempts(): void
    {
        $companyA = Company::factory()->create();
        $companyB = Company::factory()->create();

        $user = User::factory()->create([
            'company_id' => $companyA->id,
        ]);

        $user->givePermissionTo(
            'view security dashboard'
        );

        $firstOwnAttempt = $this->createAttempt(
            $companyA
        );

        $secondOwnAttempt = $this->createAttempt(
            $companyA
        );

        $otherCompanyAttempt = $this->createAttempt(
            $companyB
        );

        $unassignedAttempt = $this->createAttempt(
            null
        );

        Sanctum::actingAs($user, ['*']);

        $response = $this
            ->getJson('/api/security/login-attempts')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 2);

        $returnedIds = collect(
            $response->json('data')
        )->pluck('id');

        $this->assertTrue(
            $returnedIds->contains($firstOwnAttempt->id)
        );

        $this->assertTrue(
            $returnedIds->contains($secondOwnAttempt->id)
        );

        $this->assertFalse(
            $returnedIds->contains($otherCompanyAttempt->id)
        );

        $this->assertFalse(
            $returnedIds->contains($unassignedAttempt->id)
        );
    }

    public function test_global_security_permission_can_view_all_attempts(): void
    {
        $companyA = Company::factory()->create();
        $companyB = Company::factory()->create();

        $systemUser = User::factory()->create([
            'company_id' => null,
        ]);

        $systemUser->givePermissionTo([
            'view security dashboard',
            'view all security data',
        ]);

        $this->createAttempt($companyA);
        $this->createAttempt($companyB);
        $this->createAttempt(null);

        Sanctum::actingAs($systemUser, ['*']);

        $this
            ->getJson('/api/security/login-attempts')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('meta.total', 3);
    }

    public function test_login_attempt_filters_are_applied(): void
    {
        $company = Company::factory()->create();

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $user->givePermissionTo(
            'view security dashboard'
        );

        $matchingAttempt = $this->createAttempt(
            $company,
            [
                'was_successful' => false,
                'failure_reason' => 'company_inactive',
                'risk_score' => 75,
                'country_code' => 'LY',
                'country' => 'Libya',
            ]
        );

        $this->createAttempt(
            $company,
            [
                'was_successful' => false,
                'failure_reason' => 'invalid_credentials',
                'risk_score' => 25,
                'country_code' => 'US',
                'country' => 'United States',
            ]
        );

        $this->createAttempt(
            $company,
            [
                'was_successful' => true,
                'failure_reason' => null,
                'risk_score' => 0,
                'country_code' => 'LY',
                'country' => 'Libya',
            ]
        );

        Sanctum::actingAs($user, ['*']);

        $response = $this
            ->getJson(
                '/api/security/login-attempts'
                .'?status=failed'
                .'&country_code=ly'
                .'&risk_min=50'
                .'&sort=risk_high'
            )
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath(
                'data.0.id',
                $matchingAttempt->id
            );

        $response->assertJsonMissing([
            'email_hash' => $matchingAttempt->email_hash,
        ]);
    }

    public function test_security_overview_is_tenant_scoped(): void
    {
        $companyA = Company::factory()->create();
        $companyB = Company::factory()->create();

        $user = User::factory()->create([
            'company_id' => $companyA->id,
        ]);

        $user->givePermissionTo(
            'view security dashboard'
        );

        $this->createAttempt(
            $companyA,
            [
                'was_successful' => true,
                'failure_reason' => null,
                'risk_score' => 0,
                'ip_address' => '8.8.8.8',
            ]
        );

        $this->createAttempt(
            $companyA,
            [
                'was_successful' => false,
                'failure_reason' => 'invalid_credentials',
                'risk_score' => 25,
                'ip_address' => '8.8.8.8',
            ]
        );

        $this->createAttempt(
            $companyA,
            [
                'was_successful' => false,
                'failure_reason' => 'company_inactive',
                'risk_score' => 60,
                'ip_address' => '1.1.1.1',
            ]
        );

        $this->createAttempt(
            $companyB,
            [
                'was_successful' => false,
                'risk_score' => 90,
                'ip_address' => '9.9.9.9',
            ]
        );

        Sanctum::actingAs($user, ['*']);

        $this
            ->getJson('/api/security/overview?days=30')
            ->assertOk()
            ->assertJsonPath(
                'data.metrics.total_attempts',
                3
            )
            ->assertJsonPath(
                'data.metrics.successful_attempts',
                1
            )
            ->assertJsonPath(
                'data.metrics.failed_attempts',
                2
            )
            ->assertJsonPath(
                'data.metrics.elevated_risk_attempts',
                1
            )
            ->assertJsonPath(
                'data.metrics.unique_ip_addresses',
                2
            )
            ->assertJsonPath(
                'data.metrics.success_rate',
                33.33
            )
            ->assertJsonCount(
                1,
                'data.recent_elevated_attempts'
            );
    }

    public function test_invalid_security_filters_are_rejected(): void
    {
        $company = Company::factory()->create();

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $user->givePermissionTo(
            'view security dashboard'
        );

        Sanctum::actingAs($user, ['*']);

        $this
            ->getJson(
                '/api/security/login-attempts'
                .'?per_page=101'
                .'&risk_min=80'
                .'&risk_max=20'
                .'&from=2026-07-20'
                .'&to=2026-07-10'
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'per_page',
                'risk_max',
                'to',
            ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createAttempt(
        ?Company $company,
        array $overrides = []
    ): LoginAttempt {
        $this->attemptSequence++;

        return LoginAttempt::query()->create(
            array_merge(
                [
                    'company_id' => $company?->id,
                    'user_id' => null,

                    'email_hash' => hash(
                        'sha256',
                        "security-{$this->attemptSequence}@example.test"
                    ),

                    'email_masked' => "s{$this->attemptSequence}***@example.test",

                    'ip_address' => "8.8.4.{$this->attemptSequence}",

                    'user_agent' => 'Security API Test',

                    'was_successful' => false,
                    'failure_reason' => 'invalid_credentials',

                    'country_code' => 'US',
                    'country' => 'United States',
                    'region' => 'California',
                    'city' => 'Test City',

                    'risk_score' => 25,

                    'attempted_at' => now()->subMinutes(
                        $this->attemptSequence
                    ),
                ],
                $overrides
            )
        );
    }
}
