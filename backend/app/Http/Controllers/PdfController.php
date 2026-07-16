<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessPdfJob;
use App\Models\PdfUpload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PdfController extends Controller
{

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'question_pdf' => ['required', 'file', 'mimes:pdf', 'max:30720'],
            'answer_pdf'   => ['nullable', 'file', 'mimes:pdf', 'max:30720'],
            'title'        => ['required', 'string', 'max:100'],
            'exam_id'      => ['required', 'string'],
        ]);

        $questionPath = $request->file('question_pdf')->store('pdfs', 'private');
        $answerPath   = $request->hasFile('answer_pdf')
            ? $request->file('answer_pdf')->store('pdfs', 'private')
            : null;

        $upload = PdfUpload::create([
            'exam_id'            => $request->input('exam_id'),
            'exam_label'         => $request->input('title'),
            'question_pdf_path'  => $questionPath,
            'answer_pdf_path'    => $answerPath,
            'status'             => 'pending',
        ]);

        ProcessPdfJob::dispatch($upload->id);

        return response()->json(['upload_id' => $upload->id, 'status' => 'pending'], 202);
    }

    public function listDone(): JsonResponse
    {
        $uploads = PdfUpload::where('status', 'done')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'exam_id', 'exam_label', 'question_count', 'created_at']);

        return response()->json($uploads);
    }

    public function listProcessing(): JsonResponse
    {
        $uploads = PdfUpload::whereIn('status', ['pending', 'processing'])
            ->orderBy('created_at', 'desc')
            ->get(['id', 'exam_id', 'exam_label']);

        return response()->json($uploads);
    }

    public function status(int $id): JsonResponse
    {
        $upload = PdfUpload::find($id);

        if (!$upload) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        return response()->json([
            'status'         => $upload->status,
            'question_count' => $upload->question_count,
            'error_message'  => $upload->error_message,
            'exam_id'        => $upload->exam_id,
            'exam_label'     => $upload->exam_label,
        ]);
    }
}
