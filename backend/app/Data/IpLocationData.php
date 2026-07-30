<?php

namespace App\Data;

final readonly class IpLocationData
{
    public function __construct(
        public ?string $countryCode,
        public ?string $country,
        public ?string $region,
        public ?string $city,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $countryCode = self::normalizeString(
            $data['country_code'] ?? null,
            2
        );

        return new self(
            countryCode: $countryCode !== null
                ? strtoupper($countryCode)
                : null,

            country: self::normalizeString(
                $data['country'] ?? null,
                100
            ),

            region: self::normalizeString(
                $data['region'] ?? null,
                100
            ),

            city: self::normalizeString(
                $data['city'] ?? null,
                100
            ),
        );
    }

    /**
     * @return array{
     *     country_code: string|null,
     *     country: string|null,
     *     region: string|null,
     *     city: string|null
     * }
     */
    public function toArray(): array
    {
        return [
            'country_code' => $this->countryCode,
            'country' => $this->country,
            'region' => $this->region,
            'city' => $this->city,
        ];
    }

    public function isEmpty(): bool
    {
        return $this->countryCode === null
            && $this->country === null
            && $this->region === null
            && $this->city === null;
    }

    private static function normalizeString(
        mixed $value,
        int $maximumLength
    ): ?string {
        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        if ($value === '') {
            return null;
        }

        return mb_substr($value, 0, $maximumLength);
    }
}