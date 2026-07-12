<?php

namespace App\Http\Controllers;

use App\Services\PdfTextExtractorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PdfController extends Controller
{
    public function __construct(private PdfTextExtractorService $extractor) {}

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

        return response()->json([
            'title'         => $request->input('title'),
            'exam_id'       => $request->input('exam_id'),
            'question_text' => $questionText,
            'answer_text'   => $answerText,
        ]);
    }
}
