<?php

namespace App\Http\Controllers;

use App\Models\Goal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoalController extends Controller
{
    public function index(): JsonResponse
    {
        $goals = Goal::where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($goals);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'body' => ['required', 'string', 'max:1000'],
        ]);

        $goal = Goal::create([
            'user_id' => auth()->id(),
            'body'    => $data['body'],
        ]);

        return response()->json($goal, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $goal = Goal::findOrFail($id);

        if ($goal->user_id !== auth()->id()) {
            return response()->json(['message' => '権限がありません'], 403);
        }

        $data = $request->validate([
            'is_done'   => ['sometimes', 'boolean'],
            'notify_at' => ['sometimes', 'nullable', 'date'],
        ]);

        $goal->update($data);

        return response()->json($goal);
    }

    public function destroy(int $id): JsonResponse
    {
        $goal = Goal::findOrFail($id);

        if ($goal->user_id !== auth()->id()) {
            return response()->json(['message' => '権限がありません'], 403);
        }

        $goal->delete();

        return response()->json(['message' => '削除しました']);
    }
}
