<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DepartmentController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\Api\Security\SecurityController;

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:login');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::prefix('security')->group(function (): void {
        Route::get(
            '/overview',
            [SecurityController::class, 'overview']
        );

        Route::get(
            '/login-attempts',
            [SecurityController::class, 'loginAttempts']
        );
    });

    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::apiResource('employees', EmployeeController::class);

    Route::apiResource('departments', DepartmentController::class);
});
    
