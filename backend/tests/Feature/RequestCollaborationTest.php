<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\InternalRequest;
use App\Models\RequestAuditEvent;
use App\Models\RequestType;
use App\Models\User;
use App\Models\WorkflowDefinition;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use LogicException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

final class RequestCollaborationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app(PermissionRegistrar::class)
            ->forgetCachedPermissions();

        foreach ([
            'requests.view',
            'request-collaboration.view',
            'request-comments.create',
            'request-comments.delete_own',
            'request-attachments.upload',
            'request-attachments.download',
            'request-attachments.delete_own',
            'request-audit.view',
        ] as $permission) {
            Permission::findOrCreate(
                $permission,
                'web'
            );
        }
    }

    public function test_request_owner_can_comment_and_view_timeline(): void
    {
        [$user, $internalRequest] =
            $this->createOwnedRequest();

        Sanctum::actingAs($user, ['*']);

        $this
            ->postJson(
                "/api/internal-requests/{$internalRequest->id}/comments",
                [
                    'body' => 'Please review this request.',
                ]
            )
            ->assertCreated()
            ->assertJsonPath(
                'data.body',
                'Please review this request.'
            );

        $this
            ->getJson(
                "/api/internal-requests/{$internalRequest->id}/collaboration"
            )
            ->assertOk()
            ->assertJsonCount(1, 'data.comments')
            ->assertJsonPath(
                'data.permissions.comment',
                true
            )
            ->assertJsonPath(
                'data.permissions.view_audit',
                true
            );

        $this->assertDatabaseHas(
            'request_audit_events',
            [
                'internal_request_id' => $internalRequest->id,
                'event_type' => 'comment.created',
            ]
        );
    }

    public function test_private_attachment_can_be_uploaded_and_downloaded(): void
    {
        Storage::fake('local');

        [$user, $internalRequest] =
            $this->createOwnedRequest();

        Sanctum::actingAs($user, ['*']);

        $response = $this->post(
            "/api/internal-requests/{$internalRequest->id}/attachments",
            [
                'file' => UploadedFile::fake()->create(
                    'leave-policy.pdf',
                    100,
                    'application/pdf'
                ),
            ],
            [
                'Accept' => 'application/json',
            ]
        );

        $response
            ->assertCreated()
            ->assertJsonPath(
                'data.original_name',
                'leave-policy.pdf'
            );

        $attachmentId = (int) $response->json(
            'data.id'
        );

        $this
            ->get(
                "/api/internal-requests/{$internalRequest->id}/attachments/{$attachmentId}/download"
            )
            ->assertOk();

        $this->assertDatabaseHas(
            'request_attachments',
            [
                'id' => $attachmentId,
                'internal_request_id' => $internalRequest->id,
            ]
        );
    }

    public function test_other_company_cannot_access_collaboration(): void
    {
        [$owner, $internalRequest] =
            $this->createOwnedRequest();

        $otherCompany =
            Company::factory()->create();

        $otherUser = User::factory()->create([
            'company_id' => $otherCompany->id,
        ]);

        $otherEmployee =
            Employee::factory()->create([
                'company_id' => $otherCompany->id,
                'department_id' => null,
                'user_id' => $otherUser->id,
            ]);

        $otherUser->givePermissionTo([
            'requests.view',
            'request-collaboration.view',
        ]);

        Sanctum::actingAs($otherUser, ['*']);

        $this
            ->getJson(
                "/api/internal-requests/{$internalRequest->id}/collaboration"
            )
            ->assertNotFound();

        $this->assertNotNull($otherEmployee);
        $this->assertNotNull($owner);
    }

    public function test_audit_events_are_immutable(): void
    {
        [$user, $internalRequest] =
            $this->createOwnedRequest();

        Sanctum::actingAs($user, ['*']);

        $internalRequest->update([
            'status' => 'in_review',
            'submitted_at' => now(),
        ]);

        $this->assertDatabaseHas(
            'request_audit_events',
            [
                'internal_request_id' => $internalRequest->id,
                'event_type' => 'request.submitted',
            ]
        );

        $event = RequestAuditEvent::query()
            ->firstOrFail();

        $this->expectException(
            LogicException::class
        );

        $event->update([
            'summary' => 'Tampered',
        ]);
    }

    /**
     * @return array{0: User, 1: InternalRequest}
     */
    private function createOwnedRequest(): array
    {
        $company = Company::factory()->create();

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $employee = Employee::factory()->create([
            'company_id' => $company->id,
            'department_id' => null,
            'user_id' => $user->id,
        ]);

        $workflow =
            WorkflowDefinition::factory()->create([
                'company_id' => $company->id,
            ]);

        $requestType =
            RequestType::factory()->create([
                'company_id' => $company->id,
                'workflow_definition_id' => $workflow->id,
            ]);

        $user->givePermissionTo([
            'requests.view',
            'request-collaboration.view',
            'request-comments.create',
            'request-comments.delete_own',
            'request-attachments.upload',
            'request-attachments.download',
            'request-attachments.delete_own',
            'request-audit.view',
        ]);

        Sanctum::actingAs($user, ['*']);

        $internalRequest =
            InternalRequest::factory()->create([
                'company_id' => $company->id,
                'request_type_id' => $requestType->id,
                'workflow_definition_id' => $workflow->id,
                'requester_employee_id' => $employee->id,
            ]);

        return [$user, $internalRequest];
    }
}
