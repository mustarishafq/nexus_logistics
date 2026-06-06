<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ImportController;
use App\Http\Controllers\Api\ShipmentController;
use App\Http\Controllers\Api\SlaRuleController;
use App\Http\Controllers\Api\SourceSystemController;
use App\Http\Controllers\Api\TrackingEventController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WebhookController;
use App\Http\Controllers\Api\WebhookLogController;
use App\Http\Controllers\NexusSsoController;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\EnsureUserIsApproved;
use Illuminate\Support\Facades\Route;

Route::post('webhooks/{sourceSystem}/shipments', [WebhookController::class, 'receiveShipments']);

Route::get('sso/nexus', [NexusSsoController::class, 'exchange']);

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
});

Route::middleware(['auth:sanctum', EnsureUserIsApproved::class])->group(function () {
    Route::prefix('auth')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });

    Route::get('shipments', [ShipmentController::class, 'index']);
    Route::post('shipments', [ShipmentController::class, 'store']);
    Route::post('shipments/bulk', [ShipmentController::class, 'bulkStore']);
    Route::delete('shipments/{id}', [ShipmentController::class, 'destroy']);

    Route::get('sla-rules', [SlaRuleController::class, 'index']);
    Route::post('sla-rules', [SlaRuleController::class, 'store']);
    Route::post('sla-rules/bulk', [SlaRuleController::class, 'bulkStore']);
    Route::delete('sla-rules/{id}', [SlaRuleController::class, 'destroy']);

    Route::get('source-systems', [SourceSystemController::class, 'index']);
    Route::post('source-systems', [SourceSystemController::class, 'store']);
    Route::patch('source-systems/{id}', [SourceSystemController::class, 'update']);
    Route::delete('source-systems/{id}', [SourceSystemController::class, 'destroy']);

    Route::get('webhook-logs', [WebhookLogController::class, 'index']);
    Route::post('webhook-logs', [WebhookLogController::class, 'store']);

    Route::get('tracking-events', [TrackingEventController::class, 'index']);

    Route::post('imports/parse-csv', [ImportController::class, 'parseCsv']);
    Route::post('imports/shipments', [ImportController::class, 'importShipments']);
    Route::post('imports/sla-rules', [ImportController::class, 'importSlaRules']);

    Route::middleware(EnsureUserIsAdmin::class)->group(function () {
        Route::get('users', [UserController::class, 'index']);
        Route::post('users/{user}/approve', [UserController::class, 'approve']);
        Route::patch('users/{user}', [UserController::class, 'update']);
    });
});
