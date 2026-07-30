<?php

namespace App\Services\IpGeolocation;

use App\Contracts\IpGeolocationService;
use App\Data\IpLocationData;
use Illuminate\Contracts\Cache\Repository;

final class CachedIpGeolocationService implements IpGeolocationService
{
    public function __construct(
        private readonly IpGeolocationService $innerService,
        private readonly Repository $cache,
        private readonly int $cacheTtlSeconds,
        private readonly int $negativeCacheTtlSeconds,
    ) {
    }

    public function lookup(string $ipAddress): ?IpLocationData
    {
        /*
         * The raw IP address is deliberately not placed inside the cache key.
         */
        $cacheKey = sprintf(
            'flowops:ip-geolocation:%s',
            hash('sha256', $ipAddress)
        );

        $cachedValue = $this->cache->get($cacheKey);

        if (
            is_array($cachedValue)
            && array_key_exists('found', $cachedValue)
        ) {
            if ($cachedValue['found'] !== true) {
                return null;
            }

            $cachedLocation = $cachedValue['data'] ?? null;

            if (! is_array($cachedLocation)) {
                return null;
            }

            $location = IpLocationData::fromArray($cachedLocation);

            return $location->isEmpty() ? null : $location;
        }

        $location = $this->innerService->lookup($ipAddress);

        $ttl = $location !== null
            ? max(60, $this->cacheTtlSeconds)
            : max(60, $this->negativeCacheTtlSeconds);

        $this->cache->put(
            $cacheKey,
            [
                'found' => $location !== null,
                'data' => $location?->toArray(),
            ],
            $ttl
        );

        return $location;
    }
}