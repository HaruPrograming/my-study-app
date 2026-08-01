<?php

namespace Tests\Feature;

use App\Models\Choice;
use App\Models\Folder;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuestionDeleteTest extends TestCase
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
            'name'    => '2024年 春期',
        ]);
    }

    private function createQuestion(int $number = 1): Question
    {
        $q = Question::create([
            'exam_id'     => 'fe',
            'exam_label'  => '2024年 春期',
            'folder_id'   => $this->folder->id,
            'category'    => '科目A',
            'number'      => $number,
            'total_count' => 3,
            'body'        => "問題{$number}",
            'points'      => [],
        ]);
        Choice::create(['question_id' => $q->id, 'label' => 'ア', 'text' => 'A', 'is_correct' => true]);
        return $q;
    }

    public function test_自分の問題を削除できる(): void
    {
        $question = $this->createQuestion(1);

        $res = $this->deleteJson("/api/questions/{$question->id}");

        $res->assertStatus(200)->assertJson(['message' => '問題を削除しました']);
        $this->assertDatabaseMissing('questions', ['id' => $question->id]);
        $this->assertDatabaseMissing('choices', ['question_id' => $question->id]);
    }

    public function test_他人の問題は削除できない(): void
    {
        $other = User::factory()->create();
        $otherFolder = Folder::create([
            'user_id' => $other->id,
            'exam_id' => 'fe',
            'name'    => '他人のフォルダ',
        ]);
        $question = Question::create([
            'exam_id'     => 'fe',
            'exam_label'  => '他人のフォルダ',
            'folder_id'   => $otherFolder->id,
            'category'    => '科目A',
            'number'      => 1,
            'total_count' => 1,
            'body'        => '他人の問題',
            'points'      => [],
        ]);

        $res = $this->deleteJson("/api/questions/{$question->id}");

        $res->assertStatus(403);
        $this->assertDatabaseHas('questions', ['id' => $question->id]);
    }

    public function test_存在しない問題は404(): void
    {
        $res = $this->deleteJson('/api/questions/99999');

        $res->assertStatus(404);
    }

}
