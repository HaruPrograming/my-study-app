<?php

namespace Tests\Feature;

use App\Models\StudyDay;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudyDaysTest extends TestCase
{
    use RefreshDatabase;

    public function test_学習日一覧と連続日数を取得できる(): void
    {
        StudyDay::create(['date' => '2026-07-15']);
        StudyDay::create(['date' => '2026-07-16']);
        StudyDay::create(['date' => '2026-07-17']);

        $res = $this->getJson('/api/study-days');

        $res->assertOk()
            ->assertJsonStructure(['dates', 'streak_days', 'last_study_date']);
    }

    public function test_連続日数が正しく計算される(): void
    {
        $today = now()->toDateString();
        $yesterday = now()->subDay()->toDateString();
        $twoDaysAgo = now()->subDays(2)->toDateString();

        StudyDay::create(['date' => $twoDaysAgo]);
        StudyDay::create(['date' => $yesterday]);
        StudyDay::create(['date' => $today]);

        $res = $this->getJson('/api/study-days');

        $res->assertOk()->assertJsonFragment(['streak_days' => 3]);
    }

    public function test_途中が抜けると連続日数がリセットされる(): void
    {
        $today = now()->toDateString();
        $threeDaysAgo = now()->subDays(3)->toDateString();

        StudyDay::create(['date' => $threeDaysAgo]);
        StudyDay::create(['date' => $today]);

        $res = $this->getJson('/api/study-days');

        $res->assertOk()->assertJsonFragment(['streak_days' => 1]);
    }

    public function test_学習日がない場合は空配列と0を返す(): void
    {
        $res = $this->getJson('/api/study-days');

        $res->assertOk()->assertJson(['dates' => [], 'streak_days' => 0, 'last_study_date' => null]);
    }

    public function test_進捗保存時に当日の学習日が記録される(): void
    {
        $today = now()->toDateString();

        $this->postJson('/api/progress', [
            'exam_id'    => 'fe',
            'exam_label' => '2024年 春期',
        ]);

        $this->assertTrue(StudyDay::whereDate('date', $today)->exists());
    }

    public function test_同日に複数回進捗保存しても学習日は1件のみ(): void
    {
        $this->postJson('/api/progress', ['exam_id' => 'fe', 'exam_label' => '2024年 春期']);
        $this->postJson('/api/progress', ['exam_id' => 'fe', 'exam_label' => '2024年 春期']);

        $this->assertSame(1, StudyDay::count());
    }
}
