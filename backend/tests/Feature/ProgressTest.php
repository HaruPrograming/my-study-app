<?php

namespace Tests\Feature;

use App\Models\Folder;
use App\Models\User;
use App\Models\UserProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProgressTest extends TestCase
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

    public function test_進捗を記録できる(): void
    {
        $res = $this->postJson('/api/progress', [
            'exam_id'         => 'fe',
            'folder_id'       => $this->folder->id,
            'question_number' => 1,
        ]);

        $res->assertCreated();
        $this->assertDatabaseHas('user_progress', [
            'exam_id'         => 'fe',
            'folder_id'       => $this->folder->id,
            'completed_count' => 1,
        ]);
    }

    public function test_同じ問題番号を2回記録してもcompleted_countは1になる(): void
    {
        $this->postJson('/api/progress', [
            'exam_id' => 'fe', 'folder_id' => $this->folder->id, 'question_number' => 1,
        ]);
        $this->postJson('/api/progress', [
            'exam_id' => 'fe', 'folder_id' => $this->folder->id, 'question_number' => 1,
        ]);

        $this->assertDatabaseHas('user_progress', [
            'folder_id'       => $this->folder->id,
            'completed_count' => 1,
        ]);
    }

    public function test_異なる問題番号を記録するとcompleted_countが増える(): void
    {
        $this->postJson('/api/progress', [
            'exam_id' => 'fe', 'folder_id' => $this->folder->id, 'question_number' => 1,
        ]);
        $this->postJson('/api/progress', [
            'exam_id' => 'fe', 'folder_id' => $this->folder->id, 'question_number' => 2,
        ]);

        $this->assertDatabaseHas('user_progress', [
            'folder_id'       => $this->folder->id,
            'completed_count' => 2,
        ]);
    }

    public function test_進捗一覧を取得できる(): void
    {
        $folder2 = Folder::create(['user_id' => $this->user->id, 'exam_id' => 'ap', 'name' => '2023年 秋期']);
        UserProgress::create(['user_id' => $this->user->id, 'exam_id' => 'fe', 'exam_label' => '2024年 春期', 'folder_id' => $this->folder->id, 'completed_count' => 5]);
        UserProgress::create(['user_id' => $this->user->id, 'exam_id' => 'ap', 'exam_label' => '2023年 秋期', 'folder_id' => $folder2->id, 'completed_count' => 2]);

        $res = $this->getJson('/api/progress');

        $res->assertOk()
            ->assertJsonCount(2)
            ->assertJsonFragment(['folder_id' => $this->folder->id, 'completed_count' => 5])
            ->assertJsonFragment(['folder_id' => $folder2->id, 'completed_count' => 2]);
    }

    public function test_exam_idが必須(): void
    {
        $res = $this->postJson('/api/progress', [
            'folder_id' => $this->folder->id, 'question_number' => 1,
        ]);

        $res->assertUnprocessable();
    }

    public function test_folder_idが必須(): void
    {
        $res = $this->postJson('/api/progress', [
            'exam_id' => 'fe', 'question_number' => 1,
        ]);

        $res->assertUnprocessable();
    }

    public function test_question_numberが必須(): void
    {
        $res = $this->postJson('/api/progress', [
            'exam_id' => 'fe', 'folder_id' => $this->folder->id,
        ]);

        $res->assertUnprocessable();
    }
}
