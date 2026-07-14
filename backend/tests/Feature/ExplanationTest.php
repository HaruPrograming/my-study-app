<?php

namespace Tests\Feature;

use App\Models\Choice;
use App\Models\Question;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExplanationTest extends TestCase
{
    use RefreshDatabase;

    public function test_explanation付きの問題をAPIで取得できる(): void
    {
        $q = Question::create([
            'exam_id'     => 'fe',
            'exam_label'  => '2024年 春期',
            'category'    => 'コンピュータ構成',
            'number'      => 1,
            'total_count' => 3,
            'body'        => 'CPUの役割はどれか。',
            'illustration' => null,
            'points'      => [],
            'explanation' => 'CPUは中央処理装置であり、演算・制御を担当する。',
        ]);
        Choice::create(['question_id' => $q->id, 'label' => 'ア', 'text' => '演算を行う', 'is_correct' => true]);

        $res = $this->getJson('/api/questions/fe/' . rawurlencode('2024年 春期'));

        $res->assertOk()
            ->assertJsonFragment(['explanation' => 'CPUは中央処理装置であり、演算・制御を担当する。']);
    }

    public function test_explanationがnullの問題もAPIで取得できる(): void
    {
        $q = Question::create([
            'exam_id'     => 'fe',
            'exam_label'  => '2024年 春期',
            'category'    => 'コンピュータ構成',
            'number'      => 1,
            'total_count' => 1,
            'body'        => '問題文',
            'illustration' => null,
            'points'      => [],
            'explanation' => null,
        ]);
        Choice::create(['question_id' => $q->id, 'label' => 'ア', 'text' => '選択肢', 'is_correct' => true]);

        $res = $this->getJson('/api/questions/fe/' . rawurlencode('2024年 春期'));

        $res->assertOk()
            ->assertJsonFragment(['explanation' => null]);
    }

    public function test_exam_idでフィルタリングされる(): void
    {
        Question::create([
            'exam_id'     => 'fe',
            'exam_label'  => '2024年 春期',
            'category'    => 'テスト',
            'number'      => 1,
            'total_count' => 1,
            'body'        => 'FE問題',
            'illustration' => null,
            'points'      => [],
        ]);
        Question::create([
            'exam_id'     => 'ap',
            'exam_label'  => '2024年 春期',
            'category'    => 'テスト',
            'number'      => 1,
            'total_count' => 1,
            'body'        => 'AP問題',
            'illustration' => null,
            'points'      => [],
        ]);

        $res = $this->getJson('/api/questions/fe/' . rawurlencode('2024年 春期'));

        $res->assertOk()->assertJsonCount(1);
        $res->assertJsonFragment(['examId' => 'fe']);
        $res->assertJsonMissing(['examId' => 'ap']);
    }
}
