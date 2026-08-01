<?php

namespace Tests\Feature;

use App\Models\Choice;
use App\Models\Folder;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuestionApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Folder $folder;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
        $this->folder = Folder::create([
            'user_id' => $this->user->id,
            'exam_id' => 'fe',
            'name'    => '2026年 春期',
        ]);
    }

    private function createQuestion(int $number, array $choices = []): Question
    {
        $question = Question::create([
            'exam_id'      => 'fe',
            'exam_label'   => '2026年 春期',
            'folder_id'    => $this->folder->id,
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

    public function test_returns_questions_for_valid_folder_id(): void
    {
        $this->createQuestion(1, [
            ['label' => 'ア', 'text' => '選択肢A', 'is_correct' => true],
            ['label' => 'イ', 'text' => '選択肢B', 'is_correct' => false],
        ]);

        $response = $this->getJson("/api/questions/fe/{$this->folder->id}");

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonStructure([
                '*' => [
                    'id', 'examId', 'folderId', 'folderName', 'category',
                    'number', 'totalCount', 'body',
                    'choices' => [
                        '*' => ['label', 'text', 'isCorrect'],
                    ],
                    'illustration', 'points',
                ],
            ]);
    }

    public function test_returns_empty_array_for_unknown_folder_id(): void
    {
        $response = $this->getJson('/api/questions/fe/99999');

        $response->assertStatus(200)->assertJson([]);
    }

    public function test_questions_are_ordered_by_number(): void
    {
        $this->createQuestion(3);
        $this->createQuestion(1);
        $this->createQuestion(2);

        $response = $this->getJson("/api/questions/fe/{$this->folder->id}");

        $data = $response->json();
        $this->assertEquals(1, $data[0]['number']);
        $this->assertEquals(2, $data[1]['number']);
        $this->assertEquals(3, $data[2]['number']);
    }

    public function test_only_returns_questions_for_specified_folder_id(): void
    {
        $otherFolder = Folder::create([
            'user_id' => $this->user->id,
            'exam_id' => 'ap',
            'name'    => '2026年 春期',
        ]);

        $this->createQuestion(1);
        Question::create([
            'exam_id'     => 'ap',
            'exam_label'  => '2026年 春期',
            'folder_id'   => $otherFolder->id,
            'category'    => 'テスト',
            'number'      => 1,
            'total_count' => 1,
            'body'        => 'AP問題',
            'points'      => [],
        ]);

        $response = $this->getJson("/api/questions/fe/{$this->folder->id}");

        $response->assertStatus(200)->assertJsonCount(1);
        $this->assertEquals('fe', $response->json('0.examId'));
    }
}
