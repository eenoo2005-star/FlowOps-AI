<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\RequestType;
use App\Models\WorkflowDefinition;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RequestType>
 */
final class RequestTypeFactory extends Factory
{
    protected $model = RequestType::class;

    public function definition(): array
    {
        $company = Company::factory();

        return [
            'company_id' => $company,

            'workflow_definition_id' =>
                WorkflowDefinition::factory()->state([
                    'company_id' => $company,
                ]),

            'name' => fake()->words(3, true),

            'code' => strtoupper(
                fake()->unique()->bothify('TYPE-####')
            ),

            'description' => fake()->optional()->sentence(),
            'instructions' => fake()->optional()->sentence(),
            'is_active' => true,
        ];
    }
}