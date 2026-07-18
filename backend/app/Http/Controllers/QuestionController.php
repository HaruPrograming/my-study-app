<?php

namespace App\Http\Controllers;

use App\Models\Question;
use App\Services\QuestionGeneratorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    public function __construct(private QuestionGeneratorService $generator) {}

    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'question_text' => ['required', 'string', 'min:10'],
            'answer_text'   => ['nullable', 'string'],
            'exam_id'       => ['required', 'string'],
            'title'         => ['required', 'string', 'max:100'],
        ]);

        $result = $this->generator->generate(
            questionText: $request->input('question_text'),
            answerText:   $request->input('answer_text', ''),
            examId:       $request->input('exam_id'),
            title:        $request->input('title'),
        );

        return response()->json($result);
    }

    public function index(string $examId, string $examLabel): JsonResponse
    {
        $questions = Question::with('choices')
            ->where('exam_id', $examId)
            ->where('exam_label', $examLabel)
            ->orderBy('number')
            ->get()
            ->map(fn (Question $q) => $q->toApiArray())
            ->values();

        return response()->json($questions);
    }
}
