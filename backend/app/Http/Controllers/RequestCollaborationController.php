<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRequestAttachmentRequest;
use App\Http\Requests\StoreRequestCommentRequest;
use App\Http\Resources\RequestAttachmentResource;
use App\Http\Resources\RequestAuditEventResource;
use App\Http\Resources\RequestCommentResource;
use App\Models\InternalRequest;
use App\Models\RequestAttachment;
use App\Models\RequestComment;
use App\Services\RequestAuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

final class RequestCollaborationController extends Controller
{
    public function __construct(
        private readonly RequestAuditService $auditService
    ) {}

    public function overview(
        Request $request,
        InternalRequest $internalRequest
    ): JsonResponse {
        $this->authorizeView(
            $request,
            $internalRequest
        );

        $comments = $internalRequest
            ->comments()
            ->with([
                'employee:id,first_name,last_name,employee_number',
            ])
            ->get();

        $attachments = $internalRequest
            ->attachments()
            ->get();

        $auditEvents = $request->user()->can(
            'request-audit.view'
        )
            ? $internalRequest
                ->auditEvents()
                ->limit(150)
                ->get()
            : collect();

        return response()->json([
            'data' => [
                'comments' => RequestCommentResource::collection(
                    $comments
                )->resolve($request),

                'attachments' => RequestAttachmentResource::collection(
                    $attachments
                )->resolve($request),

                'audit_events' => RequestAuditEventResource::collection(
                    $auditEvents
                )->resolve($request),

                'permissions' => [
                'comment' => $request->user()->can(
                    'request-comments.create'
                ),

                'upload' => $request->user()->can(
                    'request-attachments.upload'
                ),

                'view_audit' => $request->user()->can(
                    'request-audit.view'
                ),
                ],
            ],
        ]);
    }

    public function storeComment(
        StoreRequestCommentRequest $request,
        InternalRequest $internalRequest
    ): RequestCommentResource {
        $this->authorizeView(
            $request,
            $internalRequest
        );

        abort_unless(
            $request->user()->can(
                'request-comments.create'
            ),
            403
        );

        $comment = RequestComment::query()->create([
            'company_id' => $internalRequest->company_id,

            'internal_request_id' => $internalRequest->id,

            'user_id' => $request->user()->id,

            'employee_id' => $request->user()->employee?->id,

            'author_name' => $request->user()->name,

            'body' => $request->validated('body'),
        ]);

        $this->auditService->record(
            $internalRequest,
            'comment.created',
            'Comment added to request.',
            [
                'comment_id' => $comment->id,
            ],
            $request->user()
        );

        return new RequestCommentResource(
            $comment->load(
                'employee:id,first_name,last_name,employee_number'
            )
        );
    }

    public function destroyComment(
        Request $request,
        InternalRequest $internalRequest,
        RequestComment $requestComment
    ): JsonResponse {
        $this->authorizeView(
            $request,
            $internalRequest
        );

        $this->assertBelongsToRequest(
            $internalRequest,
            $requestComment->internal_request_id
        );

        $canDelete = $request->user()->can(
            'request-comments.manage'
        ) || (
            $requestComment->user_id
                === $request->user()->id
            && $request->user()->can(
                'request-comments.delete_own'
            )
        );

        abort_unless($canDelete, 403);

        $commentId = $requestComment->id;
        $requestComment->delete();

        $this->auditService->record(
            $internalRequest,
            'comment.deleted',
            'Comment deleted from request.',
            [
                'comment_id' => $commentId,
            ],
            $request->user()
        );

        return response()->json([
            'message' => 'Comment deleted.',
        ]);
    }

    public function storeAttachment(
        StoreRequestAttachmentRequest $request,
        InternalRequest $internalRequest
    ): RequestAttachmentResource {
        $this->authorizeView(
            $request,
            $internalRequest
        );

        abort_unless(
            $request->user()->can(
                'request-attachments.upload'
            ),
            403
        );

        $file = $request->file('file');

        $extension = strtolower(
            $file->guessExtension()
            ?: $file->getClientOriginalExtension()
        );

        $storedName = Str::uuid()->toString()
            .($extension !== ''
                ? ".{$extension}"
                : '');

        $directory = sprintf(
            'request-attachments/%d/%d',
            $internalRequest->company_id,
            $internalRequest->id
        );

        $checksum = hash_file(
            'sha256',
            $file->getRealPath()
        );

        $originalName = preg_replace(
            '/[\x00-\x1F\x7F]/u',
            '',
            $file->getClientOriginalName()
        ) ?: 'attachment';

        $path = $file->storeAs(
            $directory,
            $storedName,
            'local'
        );

        if ($path === false) {
            throw new RuntimeException(
                'The attachment could not be stored.'
            );
        }

        try {
            $attachment =
                RequestAttachment::query()->create([
                    'company_id' => $internalRequest->company_id,

                    'internal_request_id' => $internalRequest->id,

                    'uploaded_by_user_id' => $request->user()->id,

                    'uploaded_by_employee_id' => $request->user()->employee?->id,

                    'uploaded_by_name' => $request->user()->name,

                    'disk' => 'local',
                    'path' => $path,
                    'original_name' => $originalName,
                    'mime_type' => $file->getMimeType(),
                    'size' => $file->getSize(),
                    'sha256' => $checksum,
                ]);
        } catch (Throwable $exception) {
            Storage::disk('local')->delete($path);

            throw $exception;
        }

        $this->auditService->record(
            $internalRequest,
            'attachment.uploaded',
            'Attachment uploaded to request.',
            [
                'attachment_id' => $attachment->id,
                'original_name' => $originalName,
                'size' => $attachment->size,
                'sha256' => $attachment->sha256,
            ],
            $request->user()
        );

        return new RequestAttachmentResource(
            $attachment
        );
    }

    public function downloadAttachment(
        Request $request,
        InternalRequest $internalRequest,
        RequestAttachment $requestAttachment
    ): StreamedResponse {
        $this->authorizeView(
            $request,
            $internalRequest
        );

        $this->assertBelongsToRequest(
            $internalRequest,
            $requestAttachment->internal_request_id
        );

        abort_unless(
            $request->user()->can(
                'request-attachments.download'
            ),
            403
        );

        abort_unless(
            Storage::disk(
                $requestAttachment->disk
            )->exists($requestAttachment->path),
            404
        );

        return Storage::disk(
            $requestAttachment->disk
        )->download(
            $requestAttachment->path,
            $requestAttachment->original_name,
            [
                'Content-Type' => $requestAttachment->mime_type
                    ?? 'application/octet-stream',

                'X-Content-Type-Options' => 'nosniff',
            ]
        );
    }

    public function destroyAttachment(
        Request $request,
        InternalRequest $internalRequest,
        RequestAttachment $requestAttachment
    ): JsonResponse {
        $this->authorizeView(
            $request,
            $internalRequest
        );

        $this->assertBelongsToRequest(
            $internalRequest,
            $requestAttachment->internal_request_id
        );

        $canDelete = $request->user()->can(
            'request-attachments.manage'
        ) || (
            $requestAttachment->uploaded_by_user_id
                === $request->user()->id
            && $request->user()->can(
                'request-attachments.delete_own'
            )
        );

        abort_unless($canDelete, 403);

        $metadata = [
            'attachment_id' => $requestAttachment->id,

            'original_name' => $requestAttachment->original_name,

            'sha256' => $requestAttachment->sha256,
        ];

        Storage::disk(
            $requestAttachment->disk
        )->delete($requestAttachment->path);

        $requestAttachment->delete();

        $this->auditService->record(
            $internalRequest,
            'attachment.deleted',
            'Attachment deleted from request.',
            $metadata,
            $request->user()
        );

        return response()->json([
            'message' => 'Attachment deleted.',
        ]);
    }

    private function authorizeView(
        Request $request,
        InternalRequest $internalRequest
    ): void {
        Gate::forUser($request->user())->authorize(
            'view',
            $internalRequest
        );

        abort_unless(
            $request->user()->can(
                'request-collaboration.view'
            ),
            403
        );
    }

    private function assertBelongsToRequest(
        InternalRequest $internalRequest,
        int $relatedRequestId
    ): void {
        abort_unless(
            $relatedRequestId
                === $internalRequest->id,
            404
        );
    }
}
