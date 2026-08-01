<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Employee;
use App\Models\InternalRequest;
use App\Models\RequestType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<InternalRequest>
 */
final class InternalRequestFactory extends Factory
{
    protected $model = InternalRequest::class;

    public function definition(): array
    {
        $company = Company::factory();

        $requestType = RequestType::factory()->state([
            'company_id' => $company,
        ]);

        return [
            'company_id' => $company,
            'request_type_id' => $requestType,

            'workflow_definition_id' => fn (array $attributes) =>
                RequestType::withoutGlobalScopes()
                    ->findOrFail(
                        $attributes['request_type_id']
                    )
                    ->workflow_definition_id,

            'requester_employee_id' =>
                Employee::factory()->state([
                    'company_id' => $company,
                    'department_id' => null,
                ]),

            'current_workflow_step_id' => null,

            'reference_number' =>
                'REQ-'.strtoupper(
                    Str::random(12)
                ),

            'title' => fake()->sentence(4),
            'description' => fake()->optional()->paragraph(),
            'payload' => null,
            'priority' => 'normal',
            'status' => 'draft',
            'submitted_at' => null,
            'completed_at' => null,
            'cancelled_at' => null,
        ];
    }
}