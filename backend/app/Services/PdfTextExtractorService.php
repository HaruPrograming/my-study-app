<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Smalot\PdfParser\Parser;

class PdfTextExtractorService
{
    private const VISION_MODEL   = 'claude-haiku-4-5-20251001';
    private const VISION_API_URL = 'https://api.anthropic.com/v1/messages';

    public function extract(string $filePath): string
    {
        $text = $this->extractWithParser($filePath);

        if ($text !== '') {
            return $text;
        }

        // テキスト抽出に失敗した場合、pdftotext でリトライ
        $text = $this->extractWithPdftotext($filePath);

        if ($text !== '') {
            return $text;
        }

        // 画像型 PDF は Claude Vision API でOCR（Tesseract より精度が高い）
        $text = $this->extractWithClaudeVision($filePath);

        if ($text !== '') {
            return $text;
        }

        // Claude Vision も失敗した場合は Tesseract にフォールバック
        return $this->extractWithOcr($filePath);
    }

    private function extractWithParser(string $filePath): string
    {
        try {
            $parser = new Parser();
            $pdf    = $parser->parseFile($filePath);

            $text = '';
            foreach ($pdf->getPages() as $page) {
                $text .= mb_convert_encoding($page->getText(), 'UTF-8', 'UTF-8') . "\n";
            }

            return trim($text);
        } catch (\Throwable) {
            return '';
        }
    }

    private function extractWithPdftotext(string $filePath): string
    {
        $escaped = escapeshellarg($filePath);
        $output  = shell_exec("pdftotext -layout {$escaped} - 2>/dev/null");

        // 画像型 PDF は \f (form feed) だけ返す — PHP の trim() は除去しないため明示的に除去
        return trim(str_replace("\f", "\n", (string) $output));
    }

    private function extractWithClaudeVision(string $filePath): string
    {
        $apiKey = config('services.anthropic.key');
        if (!$apiKey) {
            return '';
        }

        $tmpDir = sys_get_temp_dir() . '/pdf_vision_' . uniqid();
        @mkdir($tmpDir, 0700);

        try {
            $escaped   = escapeshellarg($filePath);
            $outPrefix = escapeshellarg($tmpDir . '/page');
            shell_exec("pdftoppm -r 150 -png {$escaped} {$outPrefix} 2>/dev/null");

            $images = glob($tmpDir . '/*.png') ?: [];
            sort($images);

            if (empty($images)) {
                return '';
            }

            $text = '';
            foreach ($images as $image) {
                $imageData = base64_encode((string) file_get_contents($image));
                @unlink($image);

                try {
                    $response = Http::withHeaders([
                        'x-api-key'         => $apiKey,
                        'anthropic-version' => '2023-06-01',
                        'content-type'      => 'application/json',
                    ])->timeout(30)->post(self::VISION_API_URL, [
                        'model'      => self::VISION_MODEL,
                        'max_tokens' => 2048,
                        'messages'   => [
                            [
                                'role'    => 'user',
                                'content' => [
                                    [
                                        'type'   => 'image',
                                        'source' => [
                                            'type'       => 'base64',
                                            'media_type' => 'image/png',
                                            'data'       => $imageData,
                                        ],
                                    ],
                                    [
                                        'type' => 'text',
                                        'text' => "このページはIT資格試験（応用情報技術者試験等）のスキャン画像です。\n画像内のすべてのテキストを正確に抽出してください。\n特に「問X」という問題番号（X は数字）と、選択肢（ア・イ・ウ・エ）を正確に抽出することが重要です。\n抽出したテキストのみを返し、説明や補足は一切不要です。",
                                    ],
                                ],
                            ],
                        ],
                    ]);

                    if ($response->successful()) {
                        $text .= $response->json('content.0.text', '') . "\n";
                    }
                } catch (\Throwable) {
                    // 1ページの失敗は無視して続行
                }
            }

            return trim($text);
        } finally {
            foreach (glob($tmpDir . '/*') ?: [] as $f) {
                @unlink($f);
            }
            @rmdir($tmpDir);
        }
    }

    /**
     * Claude Vision で問題を構造化JSON として直接抽出する（正規表現パース不要）
     * @return array<int, array{number: int, body: string, choices: list<array{label: string, text: string, is_correct: bool}>}>
     */
    public function extractStructuredQuestions(string $filePath): array
    {
        $apiKey = config('services.anthropic.key');
        if (!$apiKey) {
            return [];
        }

        $tmpDir = sys_get_temp_dir() . '/pdf_struct_' . uniqid();
        @mkdir($tmpDir, 0700);

        try {
            $escaped   = escapeshellarg($filePath);
            $outPrefix = escapeshellarg($tmpDir . '/page');
            shell_exec("pdftoppm -r 150 -png {$escaped} {$outPrefix} 2>/dev/null");

            $images = glob($tmpDir . '/*.png') ?: [];
            sort($images);

            if (empty($images)) {
                return [];
            }

            // ページインデックス付きで抽出（欠番回復のために画像は保持）
            $questionsWithPage = [];
            foreach ($images as $pageIdx => $image) {
                $imageData = base64_encode((string) file_get_contents($image));

                try {
                    $response = Http::withHeaders([
                        'x-api-key'         => $apiKey,
                        'anthropic-version' => '2023-06-01',
                        'content-type'      => 'application/json',
                    ])->timeout(30)->post(self::VISION_API_URL, [
                        'model'      => self::VISION_MODEL,
                        'max_tokens' => 4096,
                        'messages'   => [[
                            'role'    => 'user',
                            'content' => [
                                [
                                    'type'   => 'image',
                                    'source' => [
                                        'type'       => 'base64',
                                        'media_type' => 'image/png',
                                        'data'       => $imageData,
                                    ],
                                ],
                                ['type' => 'text', 'text' => $this->buildQuestionPrompt()],
                            ],
                        ]],
                    ]);

                    if ($response->successful()) {
                        $data = $this->parseJsonResponse($response->json('content.0.text', ''));
                        foreach ($data['questions'] ?? [] as $q) {
                            if (!isset($q['number'], $q['body'], $q['choices'])) {
                                continue;
                            }
                            $questionsWithPage[] = [
                                'pageIdx' => $pageIdx,
                                'number'  => intval($q['number']),
                                'body'    => $q['body'],
                                'choices' => array_map(fn($c) => [
                                    'label'      => $c['label'] ?? '',
                                    'text'       => $c['text'] ?? '',
                                    'is_correct' => false,
                                ], $q['choices']),
                            ];
                        }
                    }
                } catch (\Throwable) {
                    // 1ページ失敗は無視して続行
                }
            }

            // 重複問番号を検出して欠番を回復（問X が誤読で問Y として取得された場合の修正）
            $recovered = $this->recoverMisreadNumbers($questionsWithPage, $images, $apiKey);

            return array_map(
                fn($q) => array_diff_key($q, ['pageIdx' => true]),
                $recovered
            );
        } finally {
            foreach (glob($tmpDir . '/*') ?: [] as $f) {
                @unlink($f);
            }
            @rmdir($tmpDir);
        }
    }

    /**
     * 誤読による重複問番号を検出し、欠番に割り当てて回復する
     *
     * 例: Vision が「問80」を「問30」と誤読 → 問30が2回出現 (body異なる) →
     *     後続ページの「問30」を「問80」として再抽出する
     *
     * @param  list<array{pageIdx: int, number: int, body: string, choices: list}>  $questionsWithPage
     * @param  string[]  $images  ページごとの PNG ファイルパス（まだ存在する）
     * @return list<array{pageIdx: int, number: int, body: string, choices: list}>
     */
    private function recoverMisreadNumbers(array $questionsWithPage, array $images, string $apiKey): array
    {
        // 問番号ごとに最初の出現を記録
        $first     = [];  // number => question
        $misreads  = [];  // 異なるbodyで重複した後続出現 {pageIdx, number(誤読), body, choices}
        $maxSeen   = 0;

        foreach ($questionsWithPage as $q) {
            $n = $q['number'];
            if (!isset($first[$n])) {
                $first[$n] = $q;
                $maxSeen   = max($maxSeen, $n);
            } elseif ($q['body'] !== $first[$n]['body'] && $n < $maxSeen) {
                // 同番号・異なる本文・かつ最大番号より小さい → 誤読の可能性が高い
                $misreads[] = $q;
            }
        }

        if (empty($misreads)) {
            return array_values($first);
        }

        // 欠番（1〜最大+誤読数 の範囲で存在しない番号）を算出
        $estimatedMax = $maxSeen + count($misreads);
        $presentNums  = array_keys($first);
        $missingNums  = array_values(array_diff(range(1, $estimatedMax), $presentNums));

        // 各誤読ページを「この問題は問Xです」という明示的ヒント付きで再抽出
        foreach ($misreads as $misread) {
            if (empty($missingNums)) {
                break;
            }
            $expectedNum = array_shift($missingNums);
            $pageIdx     = $misread['pageIdx'];

            if (!isset($images[$pageIdx]) || !file_exists($images[$pageIdx])) {
                // 画像が既に消えている場合は元の誤読データを使って番号だけ修正
                $fixed                  = $misread;
                $fixed['number']        = $expectedNum;
                $first[$expectedNum]    = $fixed;
                continue;
            }

            $imageData = base64_encode((string) file_get_contents($images[$pageIdx]));
            $hint      = $this->buildQuestionPromptWithHint($expectedNum);

            try {
                $response = Http::withHeaders([
                    'x-api-key'         => $apiKey,
                    'anthropic-version' => '2023-06-01',
                    'content-type'      => 'application/json',
                ])->timeout(30)->post(self::VISION_API_URL, [
                    'model'      => self::VISION_MODEL,
                    'max_tokens' => 4096,
                    'messages'   => [[
                        'role'    => 'user',
                        'content' => [
                            [
                                'type'   => 'image',
                                'source' => [
                                    'type'       => 'base64',
                                    'media_type' => 'image/png',
                                    'data'       => $imageData,
                                ],
                            ],
                            ['type' => 'text', 'text' => $hint],
                        ],
                    ]],
                ]);

                if ($response->successful()) {
                    $data = $this->parseJsonResponse($response->json('content.0.text', ''));
                    foreach ($data['questions'] ?? [] as $q) {
                        $num = intval($q['number'] ?? 0);
                        // 回答が expectedNum を返した場合のみ採用
                        if ($num === $expectedNum && isset($q['body'], $q['choices'])) {
                            $first[$expectedNum] = [
                                'pageIdx' => $pageIdx,
                                'number'  => $expectedNum,
                                'body'    => $q['body'],
                                'choices' => array_map(fn($c) => [
                                    'label'      => $c['label'] ?? '',
                                    'text'       => $c['text'] ?? '',
                                    'is_correct' => false,
                                ], $q['choices']),
                            ];
                            break;
                        }
                    }
                }
            } catch (\Throwable) {
                // 回復失敗は無視（元の誤読データを番号修正して使用）
                $fixed               = $misread;
                $fixed['number']     = $expectedNum;
                $first[$expectedNum] = $fixed;
            }
        }

        ksort($first);
        return array_values($first);
    }

    /**
     * Claude Vision で解答表を構造化JSON として直接抽出する
     * @return array<int, string>  [問番号 => 正解ラベル]
     */
    public function extractStructuredAnswers(string $filePath): array
    {
        $apiKey = config('services.anthropic.key');
        if (!$apiKey) {
            return [];
        }

        $tmpDir = sys_get_temp_dir() . '/pdf_ans_' . uniqid();
        @mkdir($tmpDir, 0700);

        try {
            $escaped   = escapeshellarg($filePath);
            $outPrefix = escapeshellarg($tmpDir . '/page');
            shell_exec("pdftoppm -r 150 -png {$escaped} {$outPrefix} 2>/dev/null");

            $images = glob($tmpDir . '/*.png') ?: [];
            sort($images);

            $answerMap = [];
            foreach ($images as $image) {
                $imageData = base64_encode((string) file_get_contents($image));
                @unlink($image);

                try {
                    $response = Http::withHeaders([
                        'x-api-key'         => $apiKey,
                        'anthropic-version' => '2023-06-01',
                        'content-type'      => 'application/json',
                    ])->timeout(30)->post(self::VISION_API_URL, [
                        'model'      => self::VISION_MODEL,
                        'max_tokens' => 2048,
                        'messages'   => [[
                            'role'    => 'user',
                            'content' => [
                                [
                                    'type'   => 'image',
                                    'source' => [
                                        'type'       => 'base64',
                                        'media_type' => 'image/png',
                                        'data'       => $imageData,
                                    ],
                                ],
                                ['type' => 'text', 'text' => $this->buildAnswerPrompt()],
                            ],
                        ]],
                    ]);

                    if ($response->successful()) {
                        $data = $this->parseJsonResponse($response->json('content.0.text', ''));
                        foreach ($data['answers'] ?? [] as $a) {
                            if (isset($a['number'], $a['answer'])) {
                                $answerMap[intval($a['number'])] = $a['answer'];
                            }
                        }
                    }
                } catch (\Throwable) {
                    // 1ページ失敗は無視
                }
            }

            return $answerMap;
        } finally {
            foreach (glob($tmpDir . '/*') ?: [] as $f) {
                @unlink($f);
            }
            @rmdir($tmpDir);
        }
    }

    private function buildQuestionPrompt(): string
    {
        return <<<'PROMPT'
このページはIT資格試験（応用情報技術者試験・基本情報技術者試験等）の問題ページです。
このページに含まれる問題を以下のJSON形式で正確に抽出してください。

{"questions":[{"number":問題番号の整数,"body":"問題文の全文","choices":[{"label":"ア","text":"選択肢ア"},{"label":"イ","text":"選択肢イ"},{"label":"ウ","text":"選択肢ウ"},{"label":"エ","text":"選択肢エ"}]}]}

ルール:
- 問題が複数あれば全て含める
- 問題がない場合（表紙・ページ番号のみ等）は {"questions":[]} を返す
- 問題番号は必ず整数で（例: 問7→7, 問20→20, 問80→80）
- この試験の問題番号は1〜80の整数です。PDFに印刷された数字を正確に読んでください
- 選択肢は必ずア・イ・ウ・エの順で4択
- JSONのみ返し、説明・マークダウンコードブロックは不要
PROMPT;
    }

    private function buildQuestionPromptWithHint(int $questionNumber): string
    {
        return <<<PROMPT
このページはIT資格試験（応用情報技術者試験・基本情報技術者試験等）の問題ページです。

重要: このページには「問{$questionNumber}」の問題が含まれています。
問題番号は {$questionNumber} です（PDFに印刷されている番号が誤読されやすいため、{$questionNumber} として抽出してください）。

以下のJSON形式で正確に抽出してください：

{"questions":[{"number":{$questionNumber},"body":"問題文の全文","choices":[{"label":"ア","text":"選択肢ア"},{"label":"イ","text":"選択肢イ"},{"label":"ウ","text":"選択肢ウ"},{"label":"エ","text":"選択肢エ"}]}]}

ルール:
- 問題番号は必ず {$questionNumber} を使用する
- 選択肢は必ずア・イ・ウ・エの順で4択
- JSONのみ返し、説明・マークダウンコードブロックは不要
PROMPT;
    }

    private function buildAnswerPrompt(): string
    {
        return <<<'PROMPT'
このページはIT資格試験の解答表です。
問題番号と正解（ア/イ/ウ/エ）をJSON形式で返してください。

{"answers":[{"number":問題番号の整数,"answer":"ア"},{"number":2,"answer":"イ"},...]}

解答表がない場合は {"answers":[]} を返してください。
JSONのみ返し、説明は不要。
PROMPT;
    }

    private function parseJsonResponse(string $text): array
    {
        if (preg_match('/```(?:json)?\s*([\s\S]+?)\s*```/', $text, $m)) {
            $text = $m[1];
        }
        try {
            return json_decode(trim($text), true, 512, JSON_THROW_ON_ERROR) ?? [];
        } catch (\JsonException) {
            return [];
        }
    }

    private function extractWithOcr(string $filePath): string
    {
        $tmpDir = sys_get_temp_dir() . '/pdf_ocr_' . uniqid();
        @mkdir($tmpDir, 0700);

        try {
            $escaped   = escapeshellarg($filePath);
            $outPrefix = escapeshellarg($tmpDir . '/page');

            // PDF を PNG に変換（150 DPI — 速度と精度のバランス）
            shell_exec("pdftoppm -r 150 -png {$escaped} {$outPrefix} 2>/dev/null");

            $images = glob($tmpDir . '/*.png') ?: [];
            sort($images);

            $text = '';
            foreach ($images as $image) {
                $escapedImg = escapeshellarg($image);
                $outTxt     = escapeshellarg($tmpDir . '/out');
                shell_exec("tesseract {$escapedImg} {$outTxt} -l jpn 2>/dev/null");
                $txtFile = $tmpDir . '/out.txt';
                if (file_exists($txtFile)) {
                    $text .= file_get_contents($txtFile) . "\n";
                    @unlink($txtFile);
                }
                @unlink($image);
            }

            // 「問」と誤認されやすい漢字を正規化（OCR 品質補正）
            // 3桁の場合: 間688 → 先頭2桁が≤80なら問68 として扱う（末尾1桁は OCR ノイズ）
            $text = preg_replace_callback(
                '/[間聞闻]\s*(\d{2})\d(\s)/u',
                static function (array $m): string {
                    return intval($m[1]) <= 80 ? "問{$m[1]}{$m[2]}" : $m[0];
                },
                $text
            );
            $text = preg_replace('/[間聞闻]\s*(\d{1,2})\s/u', '問$1 ', $text);

            // 「0」の代替文字を正規化（OCR誤認識: O, o, Q → 0）
            // 例: 問1O → 問10, 問7O → 問70
            $text = preg_replace('/問(\d)[OoQ](\s)/u', '問${1}0$2', $text);

            // 「0」が「9」と誤認識されるケース対策:
            // 問X9 が2回出現する場合、1回目は 問X0 の誤認識と判断して変換
            // 例: 問39が2回 → 1回目を問30に変換（問30の末尾0を9と誤読）
            preg_match_all('/問(\d{1,2})\s/u', $text, $numMatches);
            $counts = array_count_values($numMatches[1]);
            foreach ($counts as $numStr => $count) {
                $num      = intval($numStr);
                $roundNum = $num - 9;
                if ($count >= 2 && $num % 10 === 9 && $roundNum > 0 && $roundNum <= 80) {
                    // 最初の出現だけ 問X0 に置換（2回目以降は本物の問X9）
                    $text = preg_replace('/問' . $num . '(\s)/u', "問{$roundNum}$1", $text, 1);
                }
            }

            return trim($text);
        } finally {
            // 残存ファイルも含めて再帰削除
            foreach (glob($tmpDir . '/*') ?: [] as $f) {
                @unlink($f);
            }
            @rmdir($tmpDir);
        }
    }

    /**
     * 問題・選択肢・正解をもとに illustration / points / explanation を一括生成する。
     * API キー未設定または失敗時は空の配列を返す。
     */
    public function generateRichContent(array $question): array
    {
        $empty = ['illustration' => null, 'points' => [], 'explanation' => null];

        $apiKey = config('services.anthropic.key');
        if (!$apiKey) {
            return $empty;
        }

        $correctLabel = collect($question['choices'])
            ->where('is_correct', true)
            ->value('label') ?? '不明';

        $choicesText = collect($question['choices'])
            ->map(fn($c) => "{$c['label']}: {$c['text']}")
            ->implode("\n");

        $prompt = <<<PROMPT
以下のIT資格試験の問題について、学習コンテンツを JSON 形式で生成してください。
JSONのみを出力してください（前後の説明・マークダウン不要）。

{
  "illustration": {
    "nodes": [{"icon": "アイコン名", "label": "ラベル（改行は\\nで）", "highlight": true}],
    "subNodes": [{"icon": "アイコン名", "label": "ラベル"}],
    "caption": "図の説明（<b>強調語</b>タグ使用可）"
  },
  "points": [
    {"icon": "target", "text": "重要概念（<b>強調語</b>タグ使用可）"},
    {"icon": "bolt", "text": "試験頻出ポイント"},
    {"icon": "bulb", "text": "補足・豆知識"}
  ],
  "explanation": "解説文（プレーンテキスト、200〜300字）"
}

【illustration ルール】
- nodes の icon: keyboard(入力), cpu(CPU・演算・処理), monitor(出力・画面), book(知識・学習), document(文書・仕様), file(ファイル・データ), chart(統計・分析), lock(セキュリティ)
- subNodes の icon: memory(メモリ・一時記憶), storage(HDD・永続記憶)
- nodes は2〜4個、highlight は正解に直接関係する node を1個だけ true
- IT・コンピュータの概念に関係しない問題は "illustration": null
- subNodes は記憶装置の概念があるときのみ（省略可）

【points ルール】
- 必ず3個、icon は target/bolt/bulb を1つずつ使う
- <b>重要語</b> で緑色強調

【explanation ルール】
- プレーンテキスト（マークダウン記法不要）
- 200〜300字

【問題】
{$question['body']}

【選択肢】
{$choicesText}

【正解】{$correctLabel}
PROMPT;

        try {
            $response = Http::withHeaders([
                'x-api-key'         => $apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ])->timeout(45)->post(self::VISION_API_URL, [
                'model'      => 'claude-haiku-4-5-20251001',
                'max_tokens' => 1024,
                'messages'   => [
                    ['role' => 'user', 'content' => $prompt],
                ],
            ]);

            if (!$response->successful()) {
                return $empty;
            }

            $text = trim($response->json('content.0.text', ''));
            // JSON のみ抽出（```json ... ``` を除去）
            $text = preg_replace('/^```(?:json)?\s*/m', '', $text);
            $text = preg_replace('/\s*```$/m', '', $text);

            $decoded = json_decode($text, true);
            if (!is_array($decoded)) {
                return $empty;
            }

            return [
                'illustration' => $decoded['illustration'] ?? null,
                'points'       => $decoded['points'] ?? [],
                'explanation'  => $decoded['explanation'] ?? null,
            ];
        } catch (\Throwable) {
            return $empty;
        }
    }
}
