<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'endpoint' => ['required', 'string', 'max:500'],
            'p256dh'   => ['required', 'string'],
            'auth'     => ['required', 'string'],
        ]);

        PushSubscription::updateOrCreate(
            ['endpoint' => $data['endpoint']],
            [
                'user_id' => auth()->id(),
                'p256dh'  => $data['p256dh'],
                'auth'    => $data['auth'],
            ]
        );

        return response()->json(['message' => '登録しました'], 201);
    }
}
