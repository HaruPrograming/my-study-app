<?php

use App\Http\Controllers\AiGenerateController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\FolderController;
use App\Http\Controllers\PdfController;
use App\Http\Controllers\ProgressController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\StudyDayController;
use Illuminate\Support\Facades\Route;

Route::get('/auth/google', [AuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/exams', [ExamController::class, 'index']);
    Route::post('/exams', [ExamController::class, 'store']);
    Route::delete('/exams/{exam}', [ExamController::class, 'destroy']);

    Route::get('/progress', [ProgressController::class, 'index']);
    Route::post('/progress', [ProgressController::class, 'store']);
    Route::delete('/progress', [ProgressController::class, 'reset']);
    Route::get('/study-days', [StudyDayController::class, 'index']);
    Route::get('/study-days/history', [StudyDayController::class, 'history']);

    Route::get('/folders', [FolderController::class, 'index']);
    Route::post('/folders', [FolderController::class, 'store']);
    Route::delete('/folders/{folder}', [FolderController::class, 'destroy']);

    Route::post('/ai-generate', [AiGenerateController::class, 'generate']);
    Route::post('/chat', [ChatController::class, 'chat']);

    Route::get('/pdfs', [PdfController::class, 'listDone']);
    Route::get('/pdfs/processing', [PdfController::class, 'listProcessing']);
    Route::post('/pdfs/upload', [PdfController::class, 'upload']);
    Route::get('/pdfs/{id}/status', [PdfController::class, 'status']);
    Route::post('/questions/generate', [QuestionController::class, 'generate']);
    Route::get('/questions/{examId}/{folderId}', [QuestionController::class, 'index']);
});
