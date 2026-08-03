<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexRequestTypeRequest;
use App\Http\Requests\StoreRequestTypeRequest;
use App\Http\Requests\UpdateRequestTypeRequest;
use App\Http\Resources\RequestTypeResource;
use App\Models\RequestType;
use App\Services\RequestTypeService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

final class RequestTypeController extends Controller
{
    public function __construct(
        private readonly RequestTypeService $service
    ) {}

    public function index(
        IndexRequestTypeRequest $request
    ): AnonymousResourceCollection {
        Gate::authorize(
            'viewAny',
            RequestType::class
        );

        return RequestTypeResource::collection(
            $this->service->paginate(
                $request->validated()
            )
        );
    }

    public function activeOptions(
        Request $request
    ): AnonymousResourceCollection {
        abort_unless(
            $request->user()?->can('request-types.view')
                || $request->user()?->can('requests.create'),
            403
        );

        return RequestTypeResource::collection(
            $this->service->activeOptions()
        );
    }

    public function store(
        StoreRequestTypeRequest $request
    ): RequestTypeResource {
        Gate::authorize(
            'create',
            RequestType::class
        );

        return new RequestTypeResource(
            $this->service->create(
                $request->validated(),
                (int) $request->user()->company_id
            )
        );
    }

    public function show(
        RequestType $requestType
    ): RequestTypeResource {
        Gate::authorize('view', $requestType);

        return new RequestTypeResource(
            $requestType->load(
                'workflowDefinition:id,name,code,version,is_active'
            )
        );
    }

    public function update(
        UpdateRequestTypeRequest $request,
        RequestType $requestType
    ): RequestTypeResource {
        Gate::authorize('update', $requestType);

        return new RequestTypeResource(
            $this->service->update(
                $requestType,
                $request->validated()
            )
        );
    }

    public function destroy(
        RequestType $requestType
    ): Response {
        Gate::authorize('delete', $requestType);

        $this->service->delete($requestType);

        return response()->noContent();
    }
}
