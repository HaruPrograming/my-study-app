<?php

namespace Tests\Feature;

use App\Models\Choice;
use App\Models\Question;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExamLabelFilterTest extends TestCase
{
    use RefreshDatabase;

    private function createQuestion(string $examId, string $examLabel, string $body, int $number = 1): Question
    {
        $q = Question::create([
            'exam_id'     => $examId,
            'exam_label'  => $examLabel,
            'category'    => 'テスト',
            'number'      => $number,
            'total_count' => 1,
            'body'        => $body,
            'illustration' => null,
            'points'      => [],
        ]);
        Choice::create(['question_id' => $q->id, 'label' => 'ア', 'text' => '選択肢', 'is_correct' => true]);
        return $q;
    }

    public function test_指定したexam_labelの問題のみ返す(): void
    {
        $this->createQuestion('fe', '2023年春期', '春期の問題');
        $this->createQuestion('fe', '2024年春期', '別年度の問題');

        $res = $this->getJson('/api/questions/fe/' . rawurlencode('2023年春期'));

        $res->assertOk()->assertJsonCount(1);
        $res->assertJsonFragment(['body' => '春期の問題']);
        $res->assertJsonMissing(['body' => '別年度の問題']);
    }

    public function test_別のexam_labelを指定すると別年度の問題が返る(): void
    {
        $this->createQuestion('fe', '2023年春期', '春期の問題');
        $this->createQuestion('fe', '2024年春期', '別年度の問題');

        $res = $this->getJson('/api/questions/fe/' . rawurlencode('2024年春期'));

        $res->assertOk()->assertJsonCount(1);
        $res->assertJsonFragment(['body' => '別年度の問題']);
        $res->assertJsonMissing(['body' => '春期の問題']);
    }

    public function test_exam_idとexam_label両方でフィルタされる(): void
    {
        $this->createQuestion('fe', '2023年春期', 'FE春期の問題');
        $this->createQuestion('ap', '2023年春期', 'AP春期の問題');

        $res = $this->getJson('/api/questions/fe/' . rawurlencode('2023年春期'));

        $res->assertOk()->assertJsonCount(1);
        $res->assertJsonFragment(['examId' => 'fe']);
        $res->assertJsonMissing(['examId' => 'ap']);
    }

    public function test_存在しないexam_labelは空配列を返す(): void
    {
        $this->createQuestion('fe', '2023年春期', '春期の問題');

        $res = $this->getJson('/api/questions/fe/' . rawurlencode('存在しない'));

        $res->assertOk()->assertJsonCount(0);
    }
}
