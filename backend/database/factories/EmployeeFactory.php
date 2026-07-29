<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Department;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Employee>
 */
class EmployeeFactory extends Factory
{
    protected $model = Employee::class;

    public function definition(): array
    {
        $company = Company::factory();

        return [
            'company_id' => $company,
            'department_id' => Department::factory()->state([
                'company_id' => $company,
            ]),
            'user_id' => null,
            'manager_id' => null,
            'employee_number' => strtoupper(
                fake()->unique()->bothify('EMP-####')
            ),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'job_title' => fake()->randomElement([
                'Software Engineer',
                'Data Analyst',
                'HR Specialist',
                'Operations Manager',
                'Maintenance Engineer',
                'Finance Officer',
            ]),
            'work_email' => fake()->unique()->companyEmail(),
            'phone' => fake()->phoneNumber(),
            'hire_date' => fake()->dateTimeBetween('-8 years', 'now'),
            'employment_type' => fake()->randomElement([
                'full_time',
                'part_time',
                'contract',
                'intern',
            ]),
            'status' => fake()->randomElement([
                'active',
                'inactive',
                'on_leave',
            ]),
            'avatar' => null,
            'notes' => fake()->optional()->sentence(),
        ];
    }
}