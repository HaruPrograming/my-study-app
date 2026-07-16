<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ChatController extends Controller
{
    public function chat(Request $request): JsonResponse
    {
        $data = $request->validate([
            'message'     => ['required', 'string', 'max:1000'],
            'context'     => ['required', 'array'],
            'context.body'        => ['sometimes', 'string'],
            'context.choices'     => ['sometimes', 'array'],
            'context.points'      => ['sometimes', 'array'],
            'context.explanation' => ['sometimes', 'nullable'],
            'history'     => ['sometimes', 'array'],
            'history.*.role' => ['sometimes', 'string', 'in:user,ai'],
            'history.*.text' => ['sometimes', 'string'],
        ]);

        $reply = $this->askClaude(
            $data['message'],
            $data['context'],
            $data['history'] ?? [],
        );

        return response()->json(['reply' => $reply]);
    }

    private function askClaude(string $message, array $context, array $history = []): string
    {
        $apiKey = config('services.anthropic.key');
        if (!$apiKey) {
            return 'AI サービスが設定されていません。';
        }

        $contextText = $this->buildContextText($context);

        $systemPrompt = <<<SYSTEM
あなたはIT資格試験の学習サポート AI です。
学習者が問題を解いた後に疑問点を質問してきます。以下の問題内容のみを対象に、分かりやすく丁寧に回答してください。

【回答ルール】
- マークダウン記法（**太字**、# 見出し、- リスト記号など）は使わず、自然な会話体で回答する
- 箇条書きにする場合は「・」を使う
- 200字程度に収める
- 日本語で回答する

【問題内容】
{$contextText}
SYSTEM;

        $messages = [];
        foreach ($history as $msg) {
            $role = ($msg['role'] === 'ai') ? 'assistant' : 'user';
            $messages[] = ['role' => $role, 'content' => $msg['text']];
        }
        $messages[] = ['role' => 'user', 'content' => $message];

        try {
            $response = Http::withHeaders([
                'x-api-key'         => $apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ])->timeout(60)->post('https://api.anthropic.com/v1/messages', [
                'model'      => 'claude-sonnet-4-6',
                'max_tokens' => 1024,
                'system'     => $systemPrompt,
                'messages'   => $messages,
            ]);

            if (!$response->successful()) {
                return 'AI の応答に失敗しました。しばらく後でお試しください。';
            }

            $content = $response->json('content', []);
            foreach ($content as $block) {
                if (($block['type'] ?? '') === 'text') {
                    return $block['text'];
                }
            }

            return 'AI から応答を取得できませんでした。';
        } catch (\Throwable) {
            return 'AI の応答に失敗しました。しばらく後でお試しください。';
        }
    }

    private function buildContextText(array $context): string
    {
        $lines = [];

        if (!empty($context['body'])) {
            $lines[] = '問題文: ' . $context['body'];
        }

        if (!empty($context['choices'])) {
            $lines[] = '選択肢:';
            foreach ($context['choices'] as $c) {
                $correct = ($c['is_correct'] ?? $c['isCorrect'] ?? false) ? '【正解】' : '';
                $lines[] = "  {$c['label']}: {$c['text']} {$correct}";
            }
        }

        if (!empty($context['explanation'])) {
            $lines[] = '解説:';
            foreach ((array) $context['explanation'] as $item) {
                if (is_array($item)) {
                    $lines[] = "  {$item['title']}: {$item['body']}";
                }
            }
        }

        return implode("\n", $lines);
    }
}
