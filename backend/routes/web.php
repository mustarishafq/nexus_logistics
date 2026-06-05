<?php

use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\NexusSsoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function (Request $request) {
    $frontendUrl = rtrim((string) config('app.frontend_url'), '/');
    $query = $request->query();

    if ($query === []) {
        return redirect()->to($frontendUrl);
    }

    return redirect()->to($frontendUrl . '?' . http_build_query($query));
})->name('home');

Route::get('/sso/nexus', NexusSsoController::class)->name('sso.nexus');

Route::post('/logout', LogoutController::class)
    ->middleware('auth')
    ->name('logout');
