<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateAiQuestionsJob;
use App\Models\Folder;
use App\Models\PdfUpload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiGenerateController extends Controller
{
    public function generate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'prompt'    => ['required', 'string', 'max:1000'],
            'exam_id'   => ['required', 'string'],
            'folder_id' => ['nullable', 'integer'],
            'name'      => ['nullable', 'string', 'max:100'],
        ]);

        if (empty($data['folder_id']) && empty($data['name'])) {
            return response()->json([
                'errors' => ['name' => ['フォルダ名またはフォルダIDが必要です']],
            ], 422);
        }

        $userId = auth()->id();

        if (!empty($data['folder_id'])) {
            $folder = Folder::findOrFail($data['folder_id']);
            if ($folder->user_id !== $userId) {
                return response()->json(['message' => '権限がありません'], 403);
            }
        } else {
            $folder = Folder::firstOrCreate(
                ['user_id' => $userId, 'exam_id' => $data['exam_id'], 'name' => $data['name']],
            );

            $duplicate = PdfUpload::where('user_id', $userId)
                ->where('folder_id', $folder->id)
                ->whereIn('status', ['done', 'pending', 'processing'])
                ->exists();

            if ($duplicate) {
                return response()->json(['message' => 'このフォルダはすでに登録済みです'], 409);
            }
        }

        $upload = PdfUpload::create([
            'user_id'           => $userId,
            'exam_id'           => $data['exam_id'],
            'exam_label'        => $folder->name,
            'folder_id'         => $folder->id,
            'question_pdf_path' => null,
            'status'            => 'pending',
        ]);

        GenerateAiQuestionsJob::dispatch($upload->id, $data['prompt']);

        return response()->json(['upload_id' => $upload->id, 'folder_id' => $folder->id, 'status' => 'pending'], 202);
    }
}
