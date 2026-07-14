<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PdfController;
use App\Http\Controllers\QuestionController;
use Illuminate\Support\Facades\Route;

Route::get('/pdfs', [PdfController::class, 'listDone']);
Route::post('/pdfs/upload', [PdfController::class, 'upload']);
Route::get('/pdfs/{id}/status', [PdfController::class, 'status']);
Route::post('/questions/generate', [QuestionController::class, 'generate']);
Route::get('/questions/{examId}/{examLabel}', [QuestionController::class, 'index']);

Route::get('/auth/google', [AuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
});
