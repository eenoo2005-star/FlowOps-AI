<?php

use App\Http\Controllers\Api\DashboardAnalyticsController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\Security\SecurityController;
use App\Http\Controllers\AppNotificationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\InternalRequestActionController;
use App\Http\Controllers\InternalRequestController;
use App\Http\Controllers\RequestCollaborationController;
use App\Http\Controllers\RequestTypeController;
use App\Http\Controllers\WorkflowDefinitionController;
use App\Http\Controllers\WorkflowStepController;
use App\Http\Controllers\WorkflowTaskActionController;
use App\Http\Controllers\WorkflowTaskController;
use Illuminate\Support\Facades\Route;

// تسجيل الدخول
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:login');

// المسارات المحمية بـ Sanctum
Route::middleware('auth:sanctum')->group(function (): void {

    // مسارات لوحة التحكم (Dashboard)
    Route::get('/dashboard/summary', DashboardController::class);
    Route::get(
        '/dashboard/analytics',
        DashboardAnalyticsController::class
    );

    // مسارات الأمان (Security)
    Route::prefix('security')->group(function (): void {
        Route::get('/overview', [SecurityController::class, 'overview']);
        Route::get('/login-attempts', [SecurityController::class, 'loginAttempts']);
    });

    // مسارات الحساب والمستخدم
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // مسارات الموظفين والأقسام
    // Workflow definition and step administration
    Route::apiResource(
        'workflow-definitions',
        WorkflowDefinitionController::class
    )->parameters([
        'workflow-definitions' => 'workflowDefinition',
    ]);

    Route::post(
        '/workflow-definitions/{workflowDefinition}/steps',
        [WorkflowStepController::class, 'store']
    );

    Route::patch(
        '/workflow-definitions/{workflowDefinition}/steps/{workflowStep}',
        [WorkflowStepController::class, 'update']
    );

    Route::delete(
        '/workflow-definitions/{workflowDefinition}/steps/{workflowStep}',
        [WorkflowStepController::class, 'destroy']
    );
    Route::apiResource(
        'request-types',
        RequestTypeController::class
    )->parameters([
        'request-types' => 'requestType',
    ]);

    Route::apiResource(
        'internal-requests',
        InternalRequestController::class
    )->parameters([
        'internal-requests' => 'internalRequest',
    ]);

    Route::post(
        '/internal-requests/{internalRequest}/submit',
        [InternalRequestActionController::class, 'submit']
    );
    Route::get(
        '/internal-requests/{internalRequest}/collaboration',
        [RequestCollaborationController::class, 'overview']
    );

    Route::post(
        '/internal-requests/{internalRequest}/comments',
        [RequestCollaborationController::class, 'storeComment']
    );

    Route::delete(
        '/internal-requests/{internalRequest}/comments/{requestComment}',
        [RequestCollaborationController::class, 'destroyComment']
    );

    Route::post(
        '/internal-requests/{internalRequest}/attachments',
        [RequestCollaborationController::class, 'storeAttachment']
    );

    Route::get(
        '/internal-requests/{internalRequest}/attachments/{requestAttachment}/download',
        [RequestCollaborationController::class, 'downloadAttachment']
    );

    Route::delete(
        '/internal-requests/{internalRequest}/attachments/{requestAttachment}',
        [RequestCollaborationController::class, 'destroyAttachment']
    );
    Route::apiResource(
        'workflow-tasks',
        WorkflowTaskController::class
    )->only([
        'index',
        'show',
    ])->parameters([
        'workflow-tasks' => 'workflowTask',
    ]);

    Route::post(
        '/workflow-tasks/{workflowTask}/approve',
        [WorkflowTaskActionController::class, 'approve']
    );

    Route::post(
        '/workflow-tasks/{workflowTask}/reject',
        [WorkflowTaskActionController::class, 'reject']
    );
    Route::get(
        '/notifications',
        [AppNotificationController::class, 'index']
    );

    Route::get(
        '/notifications/unread-count',
        [AppNotificationController::class, 'unreadCount']
    );

    Route::post(
        '/notifications/mark-all-read',
        [AppNotificationController::class, 'markAllRead']
    );

    Route::post(
        '/notifications/{appNotification}/read',
        [AppNotificationController::class, 'markRead']
    );
    Route::apiResource('employees', EmployeeController::class);
    Route::apiResource('departments', DepartmentController::class);
});
