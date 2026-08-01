<?php

namespace Database\Factories;

use App\Models\WorkflowStep;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkflowStep>
 */
final class WorkflowStepFactory extends Factory
{
    protected $model = WorkflowStep::class;

    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true),
            'code' => strtoupper(
                fake()->unique()->bothify('STEP-####')
            ),
            'description' => fake()->optional()->sentence(),
            'step_order' => 1,
            'approver_type' => 'requester_manager',
            'approver_role' => null,
            'approver_employee_id' => null,
            'approval_mode' => 'any',
            'required_approvals' => 1,
            'sla_hours' => null,
            'can_reject' => true,
            'is_final' => false,
        ];
    }
}