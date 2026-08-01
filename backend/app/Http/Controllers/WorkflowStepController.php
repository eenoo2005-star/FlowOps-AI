<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWorkflowStepRequest;
use App\Http\Requests\UpdateWorkflowStepRequest;
use App\Http\Resources\WorkflowStepResource;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowStep;
use App\Services\WorkflowStepService;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

final class WorkflowStepController extends Controller
{
    public function __construct(
        private readonly WorkflowStepService $service
    ) {}

    public function store(
        StoreWorkflowStepRequest $request,
        WorkflowDefinition $workflowDefinition
    ): WorkflowStepResource {
        Gate::authorize(
            'update',
            $workflowDefinition
        );

        $workflowStep = $this->service->create(
            $workflowDefinition,
            $request->validated()
        );

        return new WorkflowStepResource($workflowStep);
    }

    public function update(
        UpdateWorkflowStepRequest $request,
        WorkflowDefinition $workflowDefinition,
        WorkflowStep $workflowStep
    ): WorkflowStepResource {
        $this->ensureStepBelongsToDefinition(
            $workflowDefinition,
            $workflowStep
        );

        Gate::authorize(
            'update',
            $workflowDefinition
        );

        $workflowStep = $this->service->update(
            $workflowStep,
            $request->validated()
        );

        return new WorkflowStepResource($workflowStep);
    }

    public function destroy(
        WorkflowDefinition $workflowDefinition,
        WorkflowStep $workflowStep
    ): Response {
        $this->ensureStepBelongsToDefinition(
            $workflowDefinition,
            $workflowStep
        );

        Gate::authorize(
            'update',
            $workflowDefinition
        );

        $this->service->delete($workflowStep);

        return response()->noContent();
    }

    private function ensureStepBelongsToDefinition(
        WorkflowDefinition $workflowDefinition,
        WorkflowStep $workflowStep
    ): void {
        abort_unless(
            $workflowStep->workflow_definition_id
                === $workflowDefinition->id,
            404
        );
    }
}
