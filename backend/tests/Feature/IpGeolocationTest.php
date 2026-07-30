<?php

namespace Tests\Feature;

use App\Contracts\IpGeolocationService;
use App\Data\IpLocationData;
use App\Jobs\EnrichLoginAttemptLocation;
use App\Models\LoginAttempt;
use App\Services\IpGeolocation\CachedIpGeolocationService;
use App\Services\IpGeolocation\IpWhoIsGeolocationService;
use Illuminate\Cache\CacheManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Mockery;
use Tests\TestCase;

class IpGeolocationTest extends TestCase
{
    use RefreshDatabase;

    public function test_created_login_attempt_dispatches_location_job(): void
    {
        config()->set('ip_geolocation.enabled', true);
        config()->set('ip_geolocation.queue', 'security');

        Queue::fake();

        $loginAttempt = $this->createLoginAttempt('8.8.8.8');

        Queue::assertPushedOn(
            'security',
            EnrichLoginAttemptLocation::class,
            fn (EnrichLoginAttemptLocation $job): bool =>
                $job->loginAttemptId === $loginAttempt->id
        );
    }

    public function test_job_enriches_public_ip_location(): void
    {
        config()->set('ip_geolocation.enabled', true);

        Queue::fake();

        $loginAttempt = $this->createLoginAttempt('8.8.8.8');

        $service = Mockery::mock(IpGeolocationService::class);

        $service
            ->shouldReceive('lookup')
            ->once()
            ->with('8.8.8.8')
            ->andReturn(new IpLocationData(
                countryCode: 'US',
                country: 'United States',
                region: 'California',
                city: 'Mountain View',
            ));

        $job = new EnrichLoginAttemptLocation(
            $loginAttempt->id
        );

        $job->handle($service);

        $this->assertDatabaseHas('login_attempts', [
            'id' => $loginAttempt->id,
            'country_code' => 'US',
            'country' => 'United States',
            'region' => 'California',
            'city' => 'Mountain View',
        ]);
    }

    public function test_job_skips_private_ip_addresses(): void
    {
        config()->set('ip_geolocation.enabled', true);

        Queue::fake();

        $loginAttempt = $this->createLoginAttempt(
            '192.168.1.10'
        );

        $service = Mockery::mock(IpGeolocationService::class);

        $service
            ->shouldNotReceive('lookup');

        $job = new EnrichLoginAttemptLocation(
            $loginAttempt->id
        );

        $job->handle($service);

        $loginAttempt->refresh();

        $this->assertNull($loginAttempt->country_code);
        $this->assertNull($loginAttempt->country);
        $this->assertNull($loginAttempt->region);
        $this->assertNull($loginAttempt->city);
    }

    public function test_geolocation_results_are_cached_per_ip(): void
    {
        $innerService = Mockery::mock(
            IpGeolocationService::class
        );

        $innerService
            ->shouldReceive('lookup')
            ->once()
            ->with('9.9.9.9')
            ->andReturn(new IpLocationData(
                countryCode: 'US',
                country: 'United States',
                region: null,
                city: null,
            ));

        $cache = $this->app
            ->make(CacheManager::class)
            ->store('array');

        $service = new CachedIpGeolocationService(
            innerService: $innerService,
            cache: $cache,
            cacheTtlSeconds: 3600,
            negativeCacheTtlSeconds: 60,
        );

        $firstResult = $service->lookup('9.9.9.9');
        $secondResult = $service->lookup('9.9.9.9');

        $this->assertNotNull($firstResult);
        $this->assertNotNull($secondResult);

        $this->assertSame(
            $firstResult->toArray(),
            $secondResult->toArray()
        );
    }

    public function test_ipwhois_provider_maps_api_response(): void
    {
        Http::fake([
            'https://ipwho.is/*' => Http::response([
                'success' => true,
                'country_code' => 'US',
                'country' => 'United States',
                'region' => 'California',
                'city' => 'Mountain View',
            ], 200),
        ]);

        $service = new IpWhoIsGeolocationService(
            baseUrl: 'https://ipwho.is',
            timeoutSeconds: 4,
            connectTimeoutSeconds: 2,
        );

        $location = $service->lookup('8.8.8.8');

        $this->assertNotNull($location);
        $this->assertSame('US', $location->countryCode);
        $this->assertSame('United States', $location->country);
        $this->assertSame('California', $location->region);
        $this->assertSame('Mountain View', $location->city);

        Http::assertSentCount(1);
    }

    private function createLoginAttempt(
        string $ipAddress
    ): LoginAttempt {
        return LoginAttempt::query()->create([
            'company_id' => null,
            'user_id' => null,
            'email_hash' => hash(
                'sha256',
                'geolocation@example.test'
            ),
            'email_masked' => 'g***@example.test',
            'ip_address' => $ipAddress,
            'user_agent' => 'PHPUnit',
            'was_successful' => false,
            'failure_reason' => 'invalid_credentials',
            'country_code' => null,
            'country' => null,
            'region' => null,
            'city' => null,
            'risk_score' => 25,
            'attempted_at' => now(),
        ]);
    }
}