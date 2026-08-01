<?php

namespace App\Http\Controllers;

use App\Http\Resources\InternalRequestResource;
use App\Models\InternalRequest;
use App\Services\InternalRequestService;
use Illuminate\Support\Facades\Gate;

final class InternalRequestActionController extends Controller
{
    public function __construct(
        private readonly InternalRequestService $service
    ) {}

    public function submit(
        InternalRequest $internalRequest
    ): InternalRequestResource {
        Gate::authorize('submit', $internalRequest);

        return new InternalRequestResource(
            $this->service->submit(
                $internalRequest
            )
        );
    }
}
