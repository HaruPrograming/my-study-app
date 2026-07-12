<?php

namespace App\Http\Controllers;

use App\Models\Choice;
use App\Models\Question;
use App\Services\PdfQuestionParserService;
use App\Services\PdfTextExtractorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PdfController extends Controller
{
    public function __construct(
        private PdfTextExtractorService $extractor,
        private PdfQuestionParserService $parser,
    ) {}

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'question_pdf' => ['required', 'file', 'mimes:pdf', 'max:20480'],
            'answer_pdf'   => ['nullable', 'file', 'mimes:pdf', 'max:20480'],
            'title'        => ['required', 'string', 'max:100'],
            'exam_id'      => ['required', 'string'],
        ]);

        try {
            $questionPath = $request->file('question_pdf')->store('pdfs', 'private');
            $questionText = $this->extractor->extract(Storage::disk('private')->path($questionPath));

            $answerText = '';
            if ($request->hasFile('answer_pdf')) {
                $answerPath = $request->file('answer_pdf')->store('pdfs', 'private');
                $answerText = $this->extractor->extract(Storage::disk('private')->path($answerPath));
            }
        } catch (\Exception $e) {
            $message = str_contains($e->getMessage(), 'Secured')
                ? 'パスワード保護された PDF は読み取れません。Adobe Acrobat またはブラウザの「印刷 → PDF 保存」でセキュリティを解除してから再度アップロードしてください。'
                : 'PDF の読み取りに失敗しました。ファイルが壊れていないか確認してください。';

            return response()->json(['message' => $message], 422);
        }

        $examId    = $request->input('exam_id');
        $examLabel = $request->input('title');

        $answerMap = $answerText ? $this->parser->parseAnswers($answerText) : [];
        $parsed    = $this->parser->parseQuestions($questionText, $answerMap);

        if (count($parsed) === 0) {
            return response()->json([
                'message' => 'PDF から問題を抽出できませんでした。スキャン画像型の PDF には対応していません。テキストデータを含む PDF（IPA 公式サイトの最新年度など）をお試しください。',
            ], 422);
        }

        $saved = DB::transaction(function () use ($parsed, $examId, $examLabel) {
            $questions = [];
            foreach ($parsed as $item) {
                $question = Question::create([
                    'exam_id'     => $examId,
                    'exam_label'  => $examLabel,
                    'category'    => '科目A',
                    'number'      => $item['number'],
                    'total_count' => count($parsed),
                    'body'        => $item['body'],
                    'illustration' => null,
                    'points'      => [],
                ]);

                foreach ($item['choices'] as $c) {
                    Choice::create([
                        'question_id' => $question->id,
                        'label'       => $c['label'],
                        'text'        => $c['text'],
                        'is_correct'  => $c['is_correct'],
                    ]);
                }

                $questions[] = $question->load('choices')->toApiArray();
            }
            return $questions;
        });

        return response()->json([
            'title'          => $examLabel,
            'exam_id'        => $examId,
            'question_count' => count($saved),
            'questions'      => $saved,
        ]);
    }
}
