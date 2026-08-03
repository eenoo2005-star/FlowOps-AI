<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexInternalRequestRequest;
use App\Http\Requests\StoreInternalRequestRequest;
use App\Http\Requests\UpdateInternalRequestRequest;
use App\Http\Resources\InternalRequestResource;
use App\Models\InternalRequest;
use App\Services\InternalRequestService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

final class InternalRequestController extends Controller
{
    public function __construct(
        private readonly InternalRequestService $service
    ) {}

    public function index(
        IndexInternalRequestRequest $request
    ): AnonymousResourceCollection {
        Gate::authorize(
            'viewAny',
            InternalRequest::class
        );

        return InternalRequestResource::collection(
            $this->service->paginate(
                $request->validated(),
                $request->user()
            )
        );
    }

    public function store(
        StoreInternalRequestRequest $request
    ): InternalRequestResource {
        Gate::authorize(
            'create',
            InternalRequest::class
        );

        return new InternalRequestResource(
            $this->service->createDraft(
                $request->validated(),
                $request->user()
            )
        );
    }

    public function show(
        InternalRequest $internalRequest
    ): InternalRequestResource {
        Gate::authorize('view', $internalRequest);

        return new InternalRequestResource(
            $internalRequest->load([
                'requestType:id,name,code',
                'requesterEmployee:id,first_name,last_name,employee_number,user_id',
                'creator:id,name,email',
                'workflowDefinition:id,name,code,version',
                'currentWorkflowStep:id,name,code,step_order',

                'workflowInstance.tasks.workflowStep:id,name,code,step_order',

                'workflowInstance.tasks.assignedEmployee:id,first_name,last_name,employee_number',
            ])
        );
    }

    public function update(
        UpdateInternalRequestRequest $request,
        InternalRequest $internalRequest
    ): InternalRequestResource {
        Gate::authorize('update', $internalRequest);

        return new InternalRequestResource(
            $this->service->updateDraft(
                $internalRequest,
                $request->validated()
            )
        );
    }

    public function destroy(
        InternalRequest $internalRequest
    ): Response {
        Gate::authorize('delete', $internalRequest);

        $this->service->deleteDraft($internalRequest);

        return response()->noContent();
    }
}
