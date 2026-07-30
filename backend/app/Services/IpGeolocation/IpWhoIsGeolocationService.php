<?php

namespace App\Services\IpGeolocation;

use App\Contracts\IpGeolocationService;
use App\Data\IpLocationData;
use Illuminate\Support\Facades\Http;

final class IpWhoIsGeolocationService implements IpGeolocationService
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly int $timeoutSeconds,
        private readonly int $connectTimeoutSeconds,
    ) {
    }

    public function lookup(string $ipAddress): ?IpLocationData
    {
        $url = sprintf(
            '%s/%s',
            rtrim($this->baseUrl, '/'),
            rawurlencode($ipAddress)
        );

        $response = Http::acceptJson()
            ->connectTimeout(max(1, $this->connectTimeoutSeconds))
            ->timeout(max(1, $this->timeoutSeconds))
            ->get($url, [
                'fields' => implode(',', [
                    'success',
                    'country_code',
                    'country',
                    'region',
                    'city',
                ]),
            ]);

        /*
         * Temporary provider failures should throw so that the queued job
         * can retry. Invalid or unavailable location data returns null.
         */
        if ($response->status() === 429 || $response->serverError()) {
            $response->throw();
        }

        if (! $response->successful()) {
            return null;
        }

        if ($response->json('success') !== true) {
            return null;
        }

        $location = IpLocationData::fromArray([
            'country_code' => $response->json('country_code'),
            'country' => $response->json('country'),
            'region' => $response->json('region'),
            'city' => $response->json('city'),
        ]);

        return $location->isEmpty() ? null : $location;
    }
}