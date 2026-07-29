<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEmployeeRequest;
use App\Http\Requests\UpdateEmployeeRequest;
use App\Http\Resources\EmployeeResource;
use App\Models\Employee;
use App\Services\EmployeeService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class EmployeeController extends Controller
{
    public function __construct(
        protected EmployeeService $employeeService
    ) {
    }

    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Employee::class);

        return EmployeeResource::collection(
            $this->employeeService->paginate()
        );
    }

    public function store(StoreEmployeeRequest $request): EmployeeResource
    {
        Gate::authorize('create', Employee::class);

        $employee = $this->employeeService->create(
            $request->validated(),
            $request->user()->company_id
        );

        return new EmployeeResource($employee);
    }

    public function show(Employee $employee): EmployeeResource
    {
        Gate::authorize('view', $employee);

        return new EmployeeResource(
            $employee->load([
                'department:id,name,code',
                'manager:id,first_name,last_name',
                'user:id,name,email',
            ])
        );
    }

    public function update(
        UpdateEmployeeRequest $request,
        Employee $employee
    ): EmployeeResource {
        Gate::authorize('update', $employee);

        $employee = $this->employeeService->update(
            $employee,
            $request->validated()
        );

        return new EmployeeResource($employee);
    }

    public function destroy(Employee $employee): Response
    {
        Gate::authorize('delete', $employee);

        $this->employeeService->delete($employee);

        return response()->noContent();
    }
}