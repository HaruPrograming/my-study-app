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

        $upload = PdfUpload::create([
            'exam_id'           => $data['exam_id'],
            'exam_label'        => $data['title'],
            'question_pdf_path' => null,
            'status'            => 'pending',
        ]);

        GenerateAiQuestionsJob::dispatch($upload->id, $data['prompt']);

        return response()->json(['upload_id' => $upload->id, 'status' => 'pending'], 202);
    }
}
