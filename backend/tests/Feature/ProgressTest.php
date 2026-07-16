<?php

namespace Tests\Feature;

use App\Models\UserProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProgressTest extends TestCase
{
    use RefreshDatabase;

    public function test_進捗を記録できる(): void
    {
        $res = $this->postJson('/api/progress', [
            'exam_id'    => 'fe',
            'exam_label' => '2024年 春期',
        ]);

        $res->assertCreated();
        $this->assertDatabaseHas('user_progress', [
            'exam_id'         => 'fe',
            'exam_label'      => '2024年 春期',
            'completed_count' => 1,
        ]);
    }

    public function test_同じ年度に2回記録するとcompleted_countが加算される(): void
    {
        $this->postJson('/api/progress', ['exam_id' => 'fe', 'exam_label' => '2024年 春期']);
        $this->postJson('/api/progress', ['exam_id' => 'fe', 'exam_label' => '2024年 春期']);

        $this->assertDatabaseHas('user_progress', [
            'exam_id'         => 'fe',
            'exam_label'      => '2024年 春期',
            'completed_count' => 2,
        ]);
    }

    public function test_進捗一覧を取得できる(): void
    {
        UserProgress::create(['exam_id' => 'fe', 'exam_label' => '2024年 春期', 'completed_count' => 5]);
        UserProgress::create(['exam_id' => 'ap', 'exam_label' => '2023年 秋期', 'completed_count' => 2]);

        $res = $this->getJson('/api/progress');

        $res->assertOk()
            ->assertJsonCount(2)
            ->assertJsonFragment(['exam_id' => 'fe', 'exam_label' => '2024年 春期', 'completed_count' => 5])
            ->assertJsonFragment(['exam_id' => 'ap', 'exam_label' => '2023年 秋期', 'completed_count' => 2]);
    }

    public function test_exam_idが必須(): void
    {
        $res = $this->postJson('/api/progress', ['exam_label' => '2024年 春期']);

        $res->assertUnprocessable();
    }

    public function test_exam_labelが必須(): void
    {
        $res = $this->postJson('/api/progress', ['exam_id' => 'fe']);

        $res->assertUnprocessable();
    }
}
