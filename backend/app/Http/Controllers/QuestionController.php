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

    public function index(string $examId, int $folderId): JsonResponse
    {
        $questions = Question::with(['choices', 'folder'])
            ->where('exam_id', $examId)
            ->where('folder_id', $folderId)
            ->orderBy('number')
            ->get()
            ->map(fn (Question $q) => $q->toApiArray())
            ->values();

        return response()->json($questions);
    }

    public function destroy(int $id): JsonResponse
    {
        $question = Question::findOrFail($id);

        if ($question->folder?->user_id !== auth()->id()) {
            return response()->json(['message' => '権限がありません'], 403);
        }

        $question->choices()->delete();
        $question->delete();

        return response()->json(['message' => '問題を削除しました']);
    }
}
