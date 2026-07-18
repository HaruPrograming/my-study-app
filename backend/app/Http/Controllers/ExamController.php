<?php

namespace App\Http\Controllers;

use App\Models\Choice;
use App\Models\Exam;
use App\Models\Question;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ExamController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Exam::where('user_id', auth()->id())->get());
    }

    public function store(Request $request): JsonResponse
    {
        $userId = auth()->id();

        $data = $request->validate([
            'name'       => ['required', 'string', 'max:255'],
            'short_name' => ['nullable', 'string', 'max:50', Rule::unique('exams', 'short_name')->where('user_id', $userId)],
            'color'      => ['required', 'string', 'in:green,orange,blue,purple,red'],
        ]);

        if (empty($data['short_name'])) {
            do {
                $data['short_name'] = Str::lower(Str::random(6));
            } while (Exam::where('user_id', $userId)->where('short_name', $data['short_name'])->exists());
        }

        $data['user_id'] = $userId;
        $exam = Exam::create($data);

        return response()->json($exam, 201);
    }

    public function destroy(Exam $exam): Response
    {
        abort_if($exam->user_id !== auth()->id(), 403);

        $examId = $exam->short_name;

        DB::transaction(function () use ($examId, $exam) {
            $questionIds = Question::where('exam_id', $examId)->pluck('id');
            Choice::whereIn('question_id', $questionIds)->delete();
            Question::where('exam_id', $examId)->delete();
            DB::table('pdf_uploads')->where('exam_id', $examId)->delete();
            DB::table('user_progress')->where('exam_id', $examId)->delete();
            DB::table('user_daily_progress')->where('exam_id', $examId)->delete();
            $exam->delete();
        });

        return response()->noContent();
    }
}
