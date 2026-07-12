<?php

namespace Tests\Feature;

use App\Models\Choice;
use App\Models\Question;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuestionApiTest extends TestCase
{
    use RefreshDatabase;

    private function createQuestion(string $examId, int $number, array $choices = []): Question
    {
        $question = Question::create([
            'exam_id'      => $examId,
            'exam_label'   => '2026年 春期',
            'category'     => 'コンピュータ構成',
            'number'       => $number,
            'total_count'  => 80,
            'body'         => "問題{$number}の本文",
            'illustration' => json_encode(['nodes' => [['icon' => 'cpu', 'label' => 'CPU', 'highlight' => true]], 'caption' => 'テスト図解']),
            'points'       => json_encode([['icon' => 'target', 'text' => 'ポイント1']]),
        ]);

        foreach ($choices as $c) {
            Choice::create(['question_id' => $question->id] + $c);
        }

        return $question;
    }

    public function test_returns_questions_for_valid_exam_id(): void
    {
        $this->createQuestion('fe', 1, [
            ['label' => 'ア', 'text' => '選択肢A', 'is_correct' => true],
            ['label' => 'イ', 'text' => '選択肢B', 'is_correct' => false],
        ]);

        $response = $this->getJson('/api/questions/fe');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonStructure([
                '*' => [
                    'id', 'examId', 'examLabel', 'category',
                    'number', 'totalCount', 'body',
                    'choices' => [
                        '*' => ['label', 'text', 'isCorrect'],
                    ],
                    'illustration', 'points',
                ],
            ]);
    }

    public function test_returns_empty_array_for_unknown_exam_id(): void
    {
        $response = $this->getJson('/api/questions/unknown');

        $response->assertStatus(200)->assertJson([]);
    }

    public function test_questions_are_ordered_by_number(): void
    {
        $this->createQuestion('fe', 3);
        $this->createQuestion('fe', 1);
        $this->createQuestion('fe', 2);

        $response = $this->getJson('/api/questions/fe');

        $data = $response->json();
        $this->assertEquals(1, $data[0]['number']);
        $this->assertEquals(2, $data[1]['number']);
        $this->assertEquals(3, $data[2]['number']);
    }

    public function test_only_returns_questions_for_specified_exam_id(): void
    {
        $this->createQuestion('fe', 1);
        $this->createQuestion('ap', 1);

        $response = $this->getJson('/api/questions/fe');

        $response->assertStatus(200)->assertJsonCount(1);
        $this->assertEquals('fe', $response->json('0.examId'));
    }
}
