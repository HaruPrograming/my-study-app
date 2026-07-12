<?php

namespace App\Services;

class PdfQuestionParserService
{
    private const FULLWIDTH_DIGITS = [
        '０' => '0', '１' => '1', '２' => '2', '３' => '3', '４' => '4',
        '５' => '5', '６' => '6', '７' => '7', '８' => '8', '９' => '9',
    ];

    /** 解答テキスト → [問番号(int) => 正解ラベル] */
    public function parseAnswers(string $text): array
    {
        preg_match_all('/問(\d{1,2})\s+([アイウエ])/u', $text, $matches, PREG_SET_ORDER);
        $map = [];
        foreach ($matches as $m) {
            $map[(int) $m[1]] = $m[2];
        }
        return $map;
    }

    /**
     * 問題テキスト + 解答マップ → 問題データ配列
     * @return array<int, array{number: int, body: string, choices: array}>
     */
    public function parseQuestions(string $text, array $answerMap): array
    {
        $text = $this->normalize($text);

        // 「問N」の位置を全て検出（漢字直後の「問」は除外）
        preg_match_all('/(?<!\p{Han})問(\d{1,2})\s/u', $text, $matches, PREG_OFFSET_CAPTURE);

        $questions = [];
        $found     = $matches[0];
        $nums      = $matches[1];
        $count     = count($found);

        for ($i = 0; $i < $count; $i++) {
            $num = (int) $nums[$i][0];

            // 解答マップにない問番号（見出しの「問題番号」など）はスキップ
            if (! isset($answerMap[$num])) {
                continue;
            }

            // このブロックの範囲
            $blockStart = $found[$i][1] + strlen($found[$i][0]);
            $blockEnd   = ($i + 1 < $count) ? $found[$i + 1][1] : strlen($text);
            $block      = substr($text, $blockStart, $blockEnd - $blockStart);

            [$body, $choices] = $this->extractBodyAndChoices($block, $answerMap[$num]);

            $questions[] = [
                'number'  => $num,
                'body'    => $body,
                'choices' => $choices,
            ];
        }

        return $questions;
    }

    // ---------------------------------------------------------------

    private function normalize(string $text): string
    {
        // 全角数字 → 半角
        $text = strtr($text, self::FULLWIDTH_DIGITS);
        // ページフッター「－ N －」を除去
        $text = preg_replace('/[－-]\s*\d+\s*[－-]/u', '', $text);
        return $text;
    }

    /** @return array{0: string, 1: array} */
    private function extractBodyAndChoices(string $block, string $correctLabel): array
    {
        // ア〜エ を区切りとして分割（後方最長マッチで最後の出現を狙う）
        if (preg_match('/^(.*?)\s*ア\s*(.+?)\s*イ\s*(.+?)\s*ウ\s*(.+?)\s*エ\s*(.+?)\s*$/su', $block, $m)) {
            $body         = $this->cleanText($m[1]);
            $choiceTexts  = [
                'ア' => $this->cleanText($m[2]),
                'イ' => $this->cleanText($m[3]),
                'ウ' => $this->cleanText($m[4]),
                'エ' => $this->cleanText($m[5]),
            ];
        } else {
            $body        = $this->cleanText($block);
            $choiceTexts = ['ア' => '', 'イ' => '', 'ウ' => '', 'エ' => ''];
        }

        $choices = [];
        foreach (['ア', 'イ', 'ウ', 'エ'] as $label) {
            $choices[] = [
                'label'      => $label,
                'text'       => $choiceTexts[$label],
                'is_correct' => ($label === $correctLabel),
            ];
        }

        return [$body, $choices];
    }

    private function cleanText(string $text): string
    {
        // 連続する空白・改行を1スペースに圧縮してトリム
        return trim(preg_replace('/\s+/u', ' ', $text));
    }
}
