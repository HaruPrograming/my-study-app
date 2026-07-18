<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserDailyProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudyDaysHistoryTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_日別学習履歴を取得できる(): void
    {
        UserDailyProgress::create(['user_id' => $this->user->id, 'date' => '2026-07-17', 'exam_id' => 'fe', 'exam_label' => '2024年 春期', 'count' => 3]);

        $res = $this->getJson('/api/study-days/history');

        $res->assertOk()
            ->assertJsonStructure([['date', 'exams']]);
    }

    public function test_同じ日に複数試験を解いた場合それぞれ返る(): void
    {
        UserDailyProgress::create(['user_id' => $this->user->id, 'date' => '2026-07-17', 'exam_id' => 'fe', 'exam_label' => '2024年 春期', 'count' => 5]);
        UserDailyProgress::create(['user_id' => $this->user->id, 'date' => '2026-07-17', 'exam_id' => 'ap', 'exam_label' => '2024年 秋期', 'count' => 2]);

        $res = $this->getJson('/api/study-days/history');

        $data = $res->json();
        $this->assertCount(1, $data);
        $this->assertCount(2, $data[0]['exams']);
    }

    public function test_日付の降順で返る(): void
    {
        UserDailyProgress::create(['user_id' => $this->user->id, 'date' => '2026-07-15', 'exam_id' => 'fe', 'exam_label' => '2024年 春期', 'count' => 1]);
        UserDailyProgress::create(['user_id' => $this->user->id, 'date' => '2026-07-17', 'exam_id' => 'fe', 'exam_label' => '2024年 春期', 'count' => 3]);

        $res = $this->getJson('/api/study-days/history');

        $data = $res->json();
        $this->assertSame('2026-07-17', $data[0]['date']);
        $this->assertSame('2026-07-15', $data[1]['date']);
    }

    public function test_データがない場合は空配列を返す(): void
    {
        $res = $this->getJson('/api/study-days/history');

        $res->assertOk()->assertJson([]);
    }

    public function test_進捗保存時に日別テーブルが更新される(): void
    {
        $this->postJson('/api/progress', [
            'exam_id'         => 'fe',
            'exam_label'      => '2024年 春期',
            'question_number' => 1,
        ]);

        $today = now()->toDateString();
        $this->assertDatabaseHas('user_daily_progress', [
            'date'       => $today,
            'exam_id'    => 'fe',
            'exam_label' => '2024年 春期',
            'count'      => 1,
        ]);
    }

    public function test_同日に同試験を複数回保存するとcountが加算される(): void
    {
        $this->postJson('/api/progress', ['exam_id' => 'fe', 'exam_label' => '2024年 春期', 'question_number' => 1]);
        $this->postJson('/api/progress', ['exam_id' => 'fe', 'exam_label' => '2024年 春期', 'question_number' => 1]);

        $today = now()->toDateString();
        $row = UserDailyProgress::where('user_id', $this->user->id)->where('date', $today)->where('exam_id', 'fe')->first();
        $this->assertSame(2, $row->count);
    }
}
