<?php

namespace App\Services\IpGeolocation;

use App\Contracts\IpGeolocationService;
use App\Data\IpLocationData;

final class NullIpGeolocationService implements IpGeolocationService
{
    public function lookup(string $ipAddress): ?IpLocationData
    {
        return null;
    }
}