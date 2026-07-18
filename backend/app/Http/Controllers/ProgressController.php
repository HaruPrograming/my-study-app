<?php

namespace App\Http\Controllers;

use App\Models\StudyDay;
use App\Models\UserDailyProgress;
use App\Models\UserProgress;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(UserProgress::all(['exam_id', 'exam_label', 'completed_count']));
    }

    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'exam_id'    => 'required|string',
            'exam_label' => 'required|string',
        ]);

        UserProgress::where('exam_id', $data['exam_id'])
            ->where('exam_label', $data['exam_label'])
            ->update(['completed_count' => 0]);

        return response()->json(['status' => 'reset'], 200);
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

        $today = now()->toDateString();

        try {
            StudyDay::firstOrCreate(['date' => $today]);
        } catch (UniqueConstraintViolationException) {
            // 同日レコードが既存のため無視
        }

        $affected = \DB::table('user_daily_progress')
            ->where('date', $today)
            ->where('exam_id', $data['exam_id'])
            ->where('exam_label', $data['exam_label'])
            ->increment('count');

        if (!$affected) {
            try {
                UserDailyProgress::create([
                    'date'       => $today,
                    'exam_id'    => $data['exam_id'],
                    'exam_label' => $data['exam_label'],
                    'count'      => 1,
                ]);
            } catch (UniqueConstraintViolationException) {
                \DB::table('user_daily_progress')
                    ->where('date', $today)
                    ->where('exam_id', $data['exam_id'])
                    ->where('exam_label', $data['exam_label'])
                    ->increment('count');
            }
        }

        return response()->json($progress, 201);
    }
}
