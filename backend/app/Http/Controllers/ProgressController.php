<?php

namespace App\Http\Controllers;

use App\Models\StudyDay;
use App\Models\UserDailyProgress;
use App\Models\UserProgress;
use App\Models\UserQuestionCompletion;
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

        UserQuestionCompletion::where('exam_id', $data['exam_id'])
            ->where('exam_label', $data['exam_label'])
            ->delete();

        UserProgress::where('exam_id', $data['exam_id'])
            ->where('exam_label', $data['exam_label'])
            ->update(['completed_count' => 0]);

        return response()->json(['status' => 'reset'], 200);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'exam_id'         => 'required|string',
            'exam_label'      => 'required|string',
            'question_number' => 'required|integer|min:1',
        ]);

        try {
            UserQuestionCompletion::create([
                'exam_id'         => $data['exam_id'],
                'exam_label'      => $data['exam_label'],
                'question_number' => $data['question_number'],
            ]);
        } catch (UniqueConstraintViolationException) {
            // 同じ問題は重複登録しない
        }

        $uniqueCount = UserQuestionCompletion::where('exam_id', $data['exam_id'])
            ->where('exam_label', $data['exam_label'])
            ->count();

        $progress = UserProgress::firstOrNew([
            'exam_id'    => $data['exam_id'],
            'exam_label' => $data['exam_label'],
        ]);
        $progress->completed_count = $uniqueCount;
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
