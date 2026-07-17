<?php

namespace App\Http\Controllers;

use App\Models\StudyDay;
use App\Models\UserProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(UserProgress::all(['exam_id', 'exam_label', 'completed_count']));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'exam_id'    => 'required|string',
            'exam_label' => 'required|string',
        ]);

        $progress = UserProgress::firstOrNew([
            'exam_id'    => $data['exam_id'],
            'exam_label' => $data['exam_label'],
        ]);
        $progress->completed_count = ($progress->completed_count ?? 0) + 1;
        $progress->save();

        StudyDay::firstOrCreate(['date' => now()->toDateString()]);

        return response()->json($progress, 201);
    }
}
