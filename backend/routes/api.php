<?php

use App\Http\Controllers\AiGenerateController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\PdfController;
use App\Http\Controllers\ProgressController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\StudyDayController;
use Illuminate\Support\Facades\Route;

Route::get('/progress', [ProgressController::class, 'index']);
Route::post('/progress', [ProgressController::class, 'store']);
Route::get('/study-days', [StudyDayController::class, 'index']);

Route::post('/ai-generate', [AiGenerateController::class, 'generate']);
Route::post('/chat', [ChatController::class, 'chat']);

Route::get('/pdfs', [PdfController::class, 'listDone']);
Route::get('/pdfs/processing', [PdfController::class, 'listProcessing']);
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
