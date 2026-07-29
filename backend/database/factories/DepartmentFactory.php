<?php

namespace Database\Factories;

use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Department>
 */
class DepartmentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'name' => fake()->randomElement([
                'Human Resources',
                'Information Technology',
                'Finance',
                'Operations',
                'Procurement',
                'Maintenance',
            ]),
            'code' => strtoupper(fake()->unique()->bothify('DEP-###')),
            'description' => fake()->sentence(),
            'is_active' => true,
        ];
    }
}