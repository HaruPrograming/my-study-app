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

        $questionPath = $request->file('question_pdf')->store('pdfs', 'private');
        $questionText = $this->extractor->extract(Storage::disk('private')->path($questionPath));

        $answerText = '';
        if ($request->hasFile('answer_pdf')) {
            $answerPath = $request->file('answer_pdf')->store('pdfs', 'private');
            $answerText = $this->extractor->extract(Storage::disk('private')->path($answerPath));
        }

        return response()->json([
            'title'         => $request->input('title'),
            'exam_id'       => $request->input('exam_id'),
            'question_text' => $questionText,
            'answer_text'   => $answerText,
        ]);
    }
}
