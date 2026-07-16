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

        ['point' => $point, 'explanation' => $explanation] = $this->askClaude(
            $data['message'],
            $data['context'],
            $data['history'] ?? [],
        );

        return response()->json(['point' => $point, 'explanation' => $explanation]);
    }

    /** @return array{point: string, explanation: string} */
    private function askClaude(string $message, array $context, array $history = []): array
    {
        $fallback = ['point' => '', 'explanation' => 'AI の応答に失敗しました。しばらく後でお試しください。'];

        $apiKey = config('services.anthropic.key');
        if (!$apiKey) {
            return ['point' => '', 'explanation' => 'AI サービスが設定されていません。'];
        }

        $contextText = $this->buildContextText($context);

        $systemPrompt = <<<SYSTEM
あなたはIT資格試験の学習サポート AI です。
学習者が問題を解いた後の疑問に答えます。以下の問題内容のみを対象に回答してください。

【回答フォーマット】
必ず以下の JSON のみを返してください（説明・コードブロック不要）：
{"point":"ポイントの内容","explanation":"解説の内容"}

【point の書き方】
- 重要な概念や覚え方を「・」で箇条書き
- 絵文字や矢印（→）を使って視覚的にわかりやすく表現する
例: 🔵 CPU → 🔄 演算処理 → 📤 結果出力
- 100字以内

【explanation の書き方】
- 問題の核心を自然な会話体で説明
- マークダウン記法（**、#、- など）は使わない
- 150字以内

【問題内容】
{$contextText}
SYSTEM;

        $messages = [];
        foreach ($history as $msg) {
            $role    = ($msg['role'] === 'ai') ? 'assistant' : 'user';
            $content = isset($msg['point'])
                ? json_encode(['point' => $msg['point'], 'explanation' => $msg['explanation'] ?? ''], JSON_UNESCAPED_UNICODE)
                : ($msg['text'] ?? '');
            $messages[] = ['role' => $role, 'content' => $content];
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
                return $fallback;
            }

            $text = '';
            foreach ($response->json('content', []) as $block) {
                if (($block['type'] ?? '') === 'text') {
                    $text .= $block['text'];
                }
            }

            return $this->parseStructuredResponse($text) ?? $fallback;
        } catch (\Throwable) {
            return $fallback;
        }
    }

    /** @return array{point: string, explanation: string}|null */
    private function parseStructuredResponse(string $text): ?array
    {
        if (preg_match('/```(?:json)?\s*([\s\S]+?)\s*```/', $text, $m)) {
            $text = $m[1];
        }
        try {
            $data = json_decode(trim($text), true, 512, JSON_THROW_ON_ERROR);
            if (isset($data['point'], $data['explanation'])) {
                return ['point' => (string) $data['point'], 'explanation' => (string) $data['explanation']];
            }
        } catch (\JsonException) {
        }
        return null;
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
