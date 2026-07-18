<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateAiQuestionsJob;
use App\Models\PdfUpload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiGenerateController extends Controller
{
    public function generate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'prompt'  => ['required', 'string', 'max:1000'],
            'title'   => ['required', 'string', 'max:100'],
            'exam_id' => ['required', 'string'],
        ]);

        $userId = auth()->id();

        $duplicate = PdfUpload::where('user_id', $userId)
            ->where('exam_id', $data['exam_id'])
            ->where('exam_label', $data['title'])
            ->whereIn('status', ['done', 'pending', 'processing'])
            ->exists();

        if ($duplicate) {
            return response()->json(['message' => 'この年度はすでに登録済みです'], 409);
        }

        $upload = PdfUpload::create([
            'user_id'           => $userId,
            'exam_id'           => $data['exam_id'],
            'exam_label'        => $data['title'],
            'question_pdf_path' => null,
            'status'            => 'pending',
        ]);

        GenerateAiQuestionsJob::dispatch($upload->id, $data['prompt']);

        return response()->json(['upload_id' => $upload->id, 'status' => 'pending'], 202);
    }
}
