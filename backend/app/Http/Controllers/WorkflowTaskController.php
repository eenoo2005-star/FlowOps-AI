<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexWorkflowTaskRequest;
use App\Http\Resources\WorkflowTaskResource;
use App\Models\WorkflowTask;
use App\Services\WorkflowTaskService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

final class WorkflowTaskController extends Controller
{
    public function __construct(
        private readonly WorkflowTaskService $service
    ) {}

    public function index(IndexWorkflowTaskRequest $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', WorkflowTask::class);

        return WorkflowTaskResource::collection(
            $this->service->paginate($request->validated(), $request->user())
        );
    }

    public function show(WorkflowTask $workflowTask): WorkflowTaskResource
    {
        Gate::authorize('view', $workflowTask);

        return new WorkflowTaskResource(
            $this->service->loadForDisplay($workflowTask)
        );
    }
}
