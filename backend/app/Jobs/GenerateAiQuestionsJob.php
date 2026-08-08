<?php

namespace App\Jobs;

use App\Models\Choice;
use App\Models\PdfUpload;
use App\Models\Question;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class GenerateAiQuestionsJob implements ShouldQueue
{
    use Queueable;

    public int $timeout = 600;

    public function __construct(
        private int $uploadId,
        private string $prompt,
    ) {}

    public function failed(\Throwable $exception): void
    {
        PdfUpload::where('id', $this->uploadId)
            ->whereIn('status', ['pending', 'processing'])
            ->update([
                'status'        => 'failed',
                'error_message' => mb_substr($exception->getMessage(), 0, 255),
            ]);
    }

    public function handle(): void
    {
        $upload = PdfUpload::findOrFail($this->uploadId);
        $upload->update(['status' => 'processing']);

        try {
            $questions = $this->generateQuestions($this->prompt, $upload->exam_id);

            $count = DB::transaction(function () use ($questions, $upload) {
                foreach ($questions as $item) {
                    $question = Question::create([
                        'exam_id'      => $upload->exam_id,
                        'exam_label'   => $upload->exam_label,
                        'folder_id'    => $upload->folder_id,
                        'category'     => '科目A',
                        'number'       => $item['number'],
                        'total_count'  => count($questions),
                        'body'         => $item['body'],
                        'illustration' => $item['illustration'] ?? null,
                        'points'       => $item['points'] ?? [],
                        'explanation'  => $item['explanation'] ?? null,
                    ]);

                    foreach ($item['choices'] as $c) {
                        Choice::create([
                            'question_id' => $question->id,
                            'label'       => $c['label'],
                            'text'        => $c['text'],
                            'is_correct'  => $c['is_correct'],
                        ]);
                    }
                }
                return count($questions);
            });

            $upload->update(['status' => 'done', 'question_count' => $count]);
        } catch (\Throwable $e) {
            $upload->update([
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
            ]);
        }
    }

    private function generateQuestions(string $prompt, string $examId): array
    {
        $apiKey = config('services.anthropic.key');
        if (!$apiKey) {
            throw new \RuntimeException('ANTHROPIC_API_KEY が設定されていません。');
        }

        $systemPrompt = <<<SYSTEM
あなたはIT資格試験の問題作成専門家です。
ユーザーの指示に従い、最新のWeb情報を検索して高精度な問題を生成してください。

問題は以下のJSON形式で返してください（JSONのみ・説明不要）：
{
  "questions": [
    {
      "number": 1,
      "body": "問題文",
      "choices": [
        {"label": "ア", "text": "選択肢テキスト", "is_correct": false},
        {"label": "イ", "text": "選択肢テキスト", "is_correct": true},
        {"label": "ウ", "text": "選択肢テキスト", "is_correct": false},
        {"label": "エ", "text": "選択肢テキスト", "is_correct": false}
      ],
      "illustration": null,
      "points": [
        {"icon": "target", "text": "重要概念"},
        {"icon": "bolt", "text": "試験頻出ポイント"},
        {"icon": "bulb", "text": "補足・豆知識"}
      ],
      "explanation": [
        {"title": "見出し", "body": "説明文（60〜80字）"},
        {"title": "見出し", "body": "説明文（60〜80字）"},
        {"title": "見出し", "body": "説明文（60〜80字）"}
      ]
    }
  ]
}

ルール：
- 選択肢は必ずア・イ・ウ・エの4択、is_correct は1つだけ true
- 最新のIT動向・法改正・規格改定を反映した問題を優先する
- explanation は必ず3項目の配列
- points は必ず target/bolt/bulb 各1つ
SYSTEM;

        $response = Http::withHeaders([
            'x-api-key'         => $apiKey,
            'anthropic-version' => '2023-06-01',
            'anthropic-beta'    => 'web-search-2025-03-05',
            'content-type'      => 'application/json',
        ])->timeout(300)->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 8000,
            'system'     => $systemPrompt,
            'tools'      => [[
                'type'     => 'web_search_20250305',
                'name'     => 'web_search',
                'max_uses' => 3,
            ]],
            'messages' => [[
                'role'    => 'user',
                'content' => $prompt,
            ]],
        ]);

        if (!$response->successful()) {
            $body = mb_substr($response->body(), 0, 300);
            throw new \RuntimeException("Anthropic API エラー (HTTP {$response->status()}): {$body}");
        }

        $stopReason = $response->json('stop_reason', '');
        $content = $response->json('content', []);
        $text = '';
        foreach ($content as $block) {
            if (($block['type'] ?? '') === 'text') {
                $text .= $block['text'];
            }
        }

        $questions = $this->parseJsonResponse($text);
        if (count($questions) === 0) {
            throw new \RuntimeException(
                "JSON パース失敗。stop_reason={$stopReason}, text_length=" . strlen($text) .
                ', text_preview=' . mb_substr($text, 0, 200)
            );
        }
        return $questions;
    }

    private function parseJsonResponse(string $text): array
    {
        if (preg_match('/```(?:json)?\s*([\s\S]+?)\s*```/', $text, $m)) {
            $text = $m[1];
        }
        try {
            $data = json_decode(trim($text), true, 512, JSON_THROW_ON_ERROR);
            return $data['questions'] ?? [];
        } catch (\JsonException $e) {
            throw new \RuntimeException('JSON デコード失敗: ' . $e->getMessage() . ' text_preview=' . mb_substr($text, 0, 200));
        }
    }
}
