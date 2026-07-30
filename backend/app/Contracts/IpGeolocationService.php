<?php

namespace App\Contracts;

use App\Data\IpLocationData;

interface IpGeolocationService
{
    public function lookup(string $ipAddress): ?IpLocationData;
}