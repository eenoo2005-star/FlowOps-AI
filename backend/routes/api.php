<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DepartmentController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\Api\Security\SecurityController;
use App\Http\Controllers\Api\DashboardController;

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
    Route::apiResource('employees', EmployeeController::class);
    Route::apiResource('departments', DepartmentController::class);
});