<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\WorkflowDefinition;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkflowDefinition>
 */
final class WorkflowDefinitionFactory extends Factory
{
    protected $model = WorkflowDefinition::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'name' => fake()->words(3, true),
            'code' => strtoupper(
                fake()->unique()->bothify('WF-####')
            ),
            'description' => fake()->optional()->sentence(),
            'version' => 1,
            'is_active' => true,
        ];
    }
}