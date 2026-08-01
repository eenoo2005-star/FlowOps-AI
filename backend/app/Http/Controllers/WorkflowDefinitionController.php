<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexWorkflowDefinitionRequest;
use App\Http\Requests\StoreWorkflowDefinitionRequest;
use App\Http\Requests\UpdateWorkflowDefinitionRequest;
use App\Http\Resources\WorkflowDefinitionResource;
use App\Models\WorkflowDefinition;
use App\Services\WorkflowDefinitionService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

final class WorkflowDefinitionController extends Controller
{
    public function __construct(
        private readonly WorkflowDefinitionService $service
    ) {}

    public function index(
        IndexWorkflowDefinitionRequest $request
    ): AnonymousResourceCollection {
        Gate::authorize(
            'viewAny',
            WorkflowDefinition::class
        );

        return WorkflowDefinitionResource::collection(
            $this->service->paginate(
                $request->validated()
            )
        );
    }

    public function store(
        StoreWorkflowDefinitionRequest $request
    ): WorkflowDefinitionResource {
        Gate::authorize(
            'create',
            WorkflowDefinition::class
        );

        $workflowDefinition = $this->service->create(
            $request->validated(),
            (int) $request->user()->company_id
        );

        return new WorkflowDefinitionResource(
            $workflowDefinition
        );
    }

    public function show(
        WorkflowDefinition $workflowDefinition
    ): WorkflowDefinitionResource {
        Gate::authorize(
            'view',
            $workflowDefinition
        );

        return new WorkflowDefinitionResource(
            $workflowDefinition->load([
                'steps.approverEmployee:id,first_name,last_name',
            ])
        );
    }

    public function update(
        UpdateWorkflowDefinitionRequest $request,
        WorkflowDefinition $workflowDefinition
    ): WorkflowDefinitionResource {
        Gate::authorize(
            'update',
            $workflowDefinition
        );

        $workflowDefinition = $this->service->update(
            $workflowDefinition,
            $request->validated()
        );

        return new WorkflowDefinitionResource(
            $workflowDefinition
        );
    }

    public function destroy(
        WorkflowDefinition $workflowDefinition
    ): Response {
        Gate::authorize(
            'delete',
            $workflowDefinition
        );

        $this->service->delete($workflowDefinition);

        return response()->noContent();
    }
}
