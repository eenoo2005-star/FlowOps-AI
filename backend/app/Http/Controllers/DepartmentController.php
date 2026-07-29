<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDepartmentRequest;
use App\Http\Requests\UpdateDepartmentRequest;
use App\Http\Resources\DepartmentResource;
use App\Models\Department;
use App\Services\DepartmentService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class DepartmentController extends Controller
{
    public function __construct(
        protected DepartmentService $departmentService
    ) {
    }

    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Department::class);

        return DepartmentResource::collection(
            $this->departmentService->paginate()
        );
    }

    public function store(StoreDepartmentRequest $request): DepartmentResource
    {
        Gate::authorize('create', Department::class);

        $data = $request->validated();
        $data['company_id'] = $request->user()->company_id;

        $department = $this->departmentService->create($data);

        return new DepartmentResource($department);
    }

    public function show(Department $department): DepartmentResource
    {
        Gate::authorize('view', $department);

        return new DepartmentResource($department);
    }

    public function update(
        UpdateDepartmentRequest $request,
        Department $department
    ): DepartmentResource {
        Gate::authorize('update', $department);

        $department = $this->departmentService->update(
            $department,
            $request->validated()
        );

        return new DepartmentResource($department);
    }

    public function destroy(Department $department): Response
    {
        Gate::authorize('delete', $department);

        $this->departmentService->delete($department);

        return response()->noContent();
    }
}