<?php

namespace App\Http\Controllers;

use App\Http\Requests\ApproveWorkflowTaskRequest;
use App\Http\Requests\RejectWorkflowTaskRequest;
use App\Http\Resources\WorkflowTaskResource;
use App\Models\WorkflowTask;
use App\Services\ApprovalActionService;
use Illuminate\Support\Facades\Gate;

final class WorkflowTaskActionController extends Controller
{
    public function __construct(
        private readonly ApprovalActionService $service
    ) {}

    public function approve(
        ApproveWorkflowTaskRequest $request,
        WorkflowTask $workflowTask
    ): WorkflowTaskResource {
        Gate::authorize('approve', $workflowTask);

        return new WorkflowTaskResource(
            $this->service->approve(
                $workflowTask,
                $request->user(),
                $request->validated('note')
            )
        );
    }

    public function reject(
        RejectWorkflowTaskRequest $request,
        WorkflowTask $workflowTask
    ): WorkflowTaskResource {
        Gate::authorize('reject', $workflowTask);

        return new WorkflowTaskResource(
            $this->service->reject(
                $workflowTask,
                $request->user(),
                $request->validated('note')
            )
        );
    }
}
