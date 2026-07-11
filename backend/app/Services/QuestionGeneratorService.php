<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class QuestionGeneratorService
{
    private const API_URL = 'https://api.anthropic.com/v1/messages';
    private const MODEL   = 'claude-sonnet-4-6';

    public function generate(string $questionText, string $answerText, string $examId, string $title): array
    {
        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
            'content-type'      => 'application/json',
        ])->timeout(120)->post(self::API_URL, [
            'model'      => self::MODEL,
            'max_tokens' => 8192,
            'messages'   => [
                ['role' => 'user', 'content' => $this->buildPrompt($questionText, $answerText, $examId, $title)],
            ],
        ]);

        if (!$response->successful()) {
            throw new \RuntimeException('Claude API error: ' . $response->body());
        }

        $text = $response->json('content.0.text', '');

        if (preg_match('/```json\s*([\s\S]+?)\s*```/', $text, $matches)) {
            $json = $matches[1];
        } else {
            $json = $text;
        }

        return json_decode($json, true, 512, JSON_THROW_ON_ERROR);
    }

    private function buildPrompt(string $questionText, string $answerText, string $examId, string $title): string
    {
        return <<<PROMPT
あなたはIT資格試験（基本情報技術者試験・応用情報技術者試験・ITパスポート）の学習アプリ用コンテンツを生成するAIです。

以下のPDFから抽出した問題テキストと解答テキストをもとに、学習コンテンツをJSON形式で生成してください。

## 試験情報
- 試験ID: {$examId}
- タイトル: {$title}

## 問題テキスト
{$questionText}

## 解答テキスト
{$answerText}

## 出力JSON形式

```json
{
  "questions": [
    {
      "id": "string — 例: fe-2026s-1（examId-年度-問題番号）",
      "examId": "string — 上記の試験ID",
      "examLabel": "string — 例: 2026年 春期",
      "category": "string — 問題のカテゴリ（例: コンピュータ構成）",
      "number": "integer — 問題番号",
      "totalCount": "integer — 全問題数",
      "body": "string — 問題文（原文のまま）",
      "choices": [
        {
          "label": "string — ア/イ/ウ/エ",
          "text": "string — 選択肢テキスト（原文のまま）",
          "isCorrect": "boolean"
        }
      ],
      "illustration": {
        "nodes": [
          {
            "icon": "string — keyboard/cpu/monitor のいずれか",
            "label": "string — ノードラベル",
            "highlight": "boolean — 省略可、強調表示"
          }
        ],
        "subNodes": [
          {
            "icon": "string — memory/storage のいずれか",
            "label": "string — サブノードラベル"
          }
        ],
        "caption": "string — 図の説明（<b>タグで強調可）"
      },
      "points": [
        {
          "icon": "string — target（覚える事実）/bolt（公式・計算）/bulb（応用・注意点）",
          "text": "string — ポイント（<b>タグで強調可）"
        }
      ]
    }
  ]
}
```

## ルール
1. 問題文・選択肢テキストは原文のまま使用する
2. illustration.nodes のアイコンは keyboard/cpu/monitor のみ使用可
3. illustration.subNodes のアイコンは memory/storage のみ使用可（省略可）
4. points は3項目。icon は target/bolt/bulb から選択
5. caption と points.text は <b> タグで重要語を強調
6. 全問題を解析して questions 配列に含める
7. 必ず正しいJSONのみを返す（コードブロック ```json ... ``` で囲む）
PROMPT;
    }
}
