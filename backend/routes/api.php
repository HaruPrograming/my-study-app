<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PdfController;
use Illuminate\Support\Facades\Route;

Route::post('/pdfs/upload', [PdfController::class, 'upload']);

Route::get('/auth/google', [AuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
});
