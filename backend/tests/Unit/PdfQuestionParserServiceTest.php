<?php

namespace Tests\Unit;

use App\Services\PdfQuestionParserService;
use Tests\TestCase;

class PdfQuestionParserServiceTest extends TestCase
{
    private PdfQuestionParserService $parser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->parser = new PdfQuestionParserService();
    }

    // --- parseAnswers ---

    public function test_解答テキストから問番号と正解をマップできる(): void
    {
        $text = "問番号 正解\n問1 イ\n問2 ウ\n問3 ア\n問4 エ";
        $result = $this->parser->parseAnswers($text);

        $this->assertSame('イ', $result[1]);
        $this->assertSame('ウ', $result[2]);
        $this->assertSame('ア', $result[3]);
        $this->assertSame('エ', $result[4]);
    }

    public function test_解答テキストに複数ページ分が含まれていても全件取得できる(): void
    {
        $text = "問番号 正解\n問1 イ\n問2 ウ\n\n問番号 正解\n問11 ア\n問20 エ";
        $result = $this->parser->parseAnswers($text);

        $this->assertSame('イ', $result[1]);
        $this->assertSame('ウ', $result[2]);
        $this->assertSame('ア', $result[11]);
        $this->assertSame('エ', $result[20]);
    }

    // --- parseQuestions ---

    public function test_問題テキストを問番号で分割して本文を抽出できる(): void
    {
        $questionText = "問1 クイックソートの説明はどれか。\n\nア 正解の説明\nイ 誤りの説明1\nウ 誤りの説明2\nエ 誤りの説明3\n\n問2 GPUの特徴はどれか。\n\nア 誤りの説明\nイ 正解の説明\nウ 誤りの説明2\nエ 誤りの説明3";
        $answerMap = [1 => 'ア', 2 => 'イ'];

        $result = $this->parser->parseQuestions($questionText, $answerMap);

        $this->assertCount(2, $result);
        $this->assertSame(1, $result[0]['number']);
        $this->assertStringContainsString('クイックソート', $result[0]['body']);
        $this->assertSame(2, $result[1]['number']);
        $this->assertStringContainsString('GPU', $result[1]['body']);
    }

    public function test_選択肢アイウエが正しく抽出される(): void
    {
        $questionText = "問1 正しいものはどれか。\n\nア 選択肢A\nイ 選択肢B\nウ 選択肢C\nエ 選択肢D";
        $answerMap = [1 => 'ウ'];

        $result = $this->parser->parseQuestions($questionText, $answerMap);
        $choices = $result[0]['choices'];

        $this->assertCount(4, $choices);
        $this->assertSame('ア', $choices[0]['label']);
        $this->assertSame('選択肢A', trim($choices[0]['text']));
        $this->assertFalse($choices[0]['is_correct']);
        $this->assertSame('ウ', $choices[2]['label']);
        $this->assertTrue($choices[2]['is_correct']);
    }

    public function test_全角数字の問番号もパースできる(): void
    {
        $questionText = "問１ スラッシングとはどれか。\n\nア 選択肢A\nイ 選択肢B\nウ 正解\nエ 選択肢D";
        $answerMap = [1 => 'ウ'];

        $result = $this->parser->parseQuestions($questionText, $answerMap);

        $this->assertCount(1, $result);
        $this->assertSame(1, $result[0]['number']);
    }

    public function test_ページフッターが除去される(): void
    {
        $questionText = "－ 4 － \n問1 正しいものはどれか。\n\nア A\nイ B\nウ C\nエ D\n\n－ 5 －\n問2 次はどれか。\n\nア A\nイ B\nウ C\nエ D";
        $answerMap = [1 => 'ア', 2 => 'イ'];

        $result = $this->parser->parseQuestions($questionText, $answerMap);

        $this->assertCount(2, $result);
        $this->assertStringNotContainsString('－', $result[0]['body']);
    }

    public function test_解答マップにない問番号はスキップされる(): void
    {
        $questionText = "問1 質問1\n\nア A\nイ B\nウ C\nエ D\n\n問2 質問2\n\nア A\nイ B\nウ C\nエ D";
        $answerMap = [1 => 'ア']; // 問2 は解答なし

        $result = $this->parser->parseQuestions($questionText, $answerMap);

        $this->assertCount(1, $result);
        $this->assertSame(1, $result[0]['number']);
    }
}
