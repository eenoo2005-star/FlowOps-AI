<?php

use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\Security\SecurityController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\InternalRequestActionController;
use App\Http\Controllers\InternalRequestController;
use App\Http\Controllers\RequestTypeController;
use App\Http\Controllers\WorkflowDefinitionController;
use App\Http\Controllers\WorkflowStepController;
use Illuminate\Support\Facades\Route;

// تسجيل الدخول
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:login');

// المسارات المحمية بـ Sanctum
Route::middleware('auth:sanctum')->group(function (): void {

    // مسارات لوحة التحكم (Dashboard)
    Route::get('/dashboard/summary', DashboardController::class);

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
    Route::apiResource('employees', EmployeeController::class);
    Route::apiResource('departments', DepartmentController::class);
});
