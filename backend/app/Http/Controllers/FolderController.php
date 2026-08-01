<?php

namespace App\Http\Controllers;

use App\Models\Choice;
use App\Models\Folder;
use App\Models\Question;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class FolderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = auth()->id();
        $folders = Folder::where('user_id', $userId)
            ->when($request->input('exam_id'), fn ($q, $id) => $q->where('exam_id', $id))
            ->withCount('questions')
            ->get();

        return response()->json($folders);
    }

    public function store(Request $request): JsonResponse
    {
        $userId = auth()->id();
        $data = $request->validate([
            'exam_id' => ['required', 'string'],
            'name'    => ['required', 'string', 'max:100'],
        ]);

        $existing = Folder::where('user_id', $userId)
            ->where('exam_id', $data['exam_id'])
            ->where('name', $data['name'])
            ->first();

        if ($existing) {
            return response()->json(['message' => 'このフォルダ名はすでに使用されています'], 409);
        }

        $folder = Folder::create([
            'user_id' => $userId,
            'exam_id' => $data['exam_id'],
            'name'    => $data['name'],
        ]);

        return response()->json($folder, 201);
    }

    public function destroy(Folder $folder): Response
    {
        abort_if($folder->user_id !== auth()->id(), 403);

        DB::transaction(function () use ($folder) {
            $questionIds = $folder->questions()->pluck('id');
            if ($questionIds->isNotEmpty()) {
                Choice::whereIn('question_id', $questionIds)->delete();
            }
            $folder->delete();
        });

        return response()->noContent();
    }
}
