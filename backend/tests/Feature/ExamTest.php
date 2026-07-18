<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\Question;
use App\Models\Choice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ExamTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_試験一覧を取得できる(): void
    {
        Exam::create(['user_id' => $this->user->id, 'name' => '基本情報技術者', 'short_name' => 'fe', 'color' => 'green']);
        Exam::create(['user_id' => $this->user->id, 'name' => '応用情報技術者', 'short_name' => 'ap', 'color' => 'orange']);

        $res = $this->getJson('/api/exams');

        $res->assertOk()
            ->assertJsonCount(2)
            ->assertJsonStructure([['id', 'name', 'short_name', 'color']]);
    }

    public function test_試験が存在しない場合は空配列を返す(): void
    {
        $res = $this->getJson('/api/exams');

        $res->assertOk()->assertJson([]);
    }

    public function test_新しい試験を登録できる(): void
    {
        $res = $this->postJson('/api/exams', [
            'name'       => 'ITパスポート',
            'short_name' => 'ip',
            'color'      => 'green',
        ]);

        $res->assertCreated()
            ->assertJsonStructure(['id', 'name', 'short_name', 'color']);

        $this->assertDatabaseHas('exams', [
            'name'       => 'ITパスポート',
            'short_name' => 'ip',
            'color'      => 'green',
        ]);
    }

    public function test_name欠けている場合は422を返す(): void
    {
        $res = $this->postJson('/api/exams', ['color' => 'green']);

        $res->assertUnprocessable();
    }

    public function test_short_nameを省略すると自動設定される(): void
    {
        $res = $this->postJson('/api/exams', [
            'name'  => 'ITパスポート',
            'color' => 'green',
        ]);

        $res->assertCreated();
        $data = $res->json();
        $this->assertNotEmpty($data['short_name']);
    }

    public function test_同じshort_nameは重複登録できない(): void
    {
        Exam::create(['user_id' => $this->user->id, 'name' => '基本情報技術者', 'short_name' => 'fe', 'color' => 'green']);

        $res = $this->postJson('/api/exams', [
            'name'       => '別の試験',
            'short_name' => 'fe',
            'color'      => 'orange',
        ]);

        $res->assertUnprocessable();
    }

    public function test_青や紫などの色でも登録できる(): void
    {
        foreach (['blue', 'purple', 'red'] as $color) {
            $res = $this->postJson('/api/exams', [
                'name'  => "テスト試験_{$color}",
                'color' => $color,
            ]);
            $res->assertCreated();
        }
    }

    public function test_試験を削除できる(): void
    {
        $exam = Exam::create(['user_id' => $this->user->id, 'name' => '基本情報技術者', 'short_name' => 'fe', 'color' => 'green']);

        $res = $this->deleteJson("/api/exams/{$exam->id}");

        $res->assertNoContent();
        $this->assertDatabaseMissing('exams', ['id' => $exam->id]);
    }

    public function test_試験削除時に関連する問題と選択肢も削除される(): void
    {
        $exam = Exam::create(['user_id' => $this->user->id, 'name' => '基本情報技術者', 'short_name' => 'fe', 'color' => 'green']);
        $question = Question::create([
            'exam_id'    => 'fe', 'exam_label' => '2024年 春期',
            'category'   => 'テスト', 'number' => 1, 'total_count' => 1,
            'body'       => '問題文', 'illustration' => null,
            'points'     => json_encode([]),
        ]);
        Choice::create(['question_id' => $question->id, 'label' => 'ア', 'text' => '選択肢', 'is_correct' => true]);

        $this->deleteJson("/api/exams/{$exam->id}");

        $this->assertDatabaseMissing('questions', ['exam_id' => 'fe']);
        $this->assertDatabaseMissing('choices', ['question_id' => $question->id]);
    }

    public function test_試験削除時に進捗データも削除される(): void
    {
        $exam = Exam::create(['user_id' => $this->user->id, 'name' => '基本情報技術者', 'short_name' => 'fe', 'color' => 'green']);
        DB::table('user_progress')->insert(['user_id' => $this->user->id, 'exam_id' => 'fe', 'exam_label' => '2024年 春期', 'completed_count' => 5]);
        DB::table('user_daily_progress')->insert(['user_id' => $this->user->id, 'date' => '2026-07-17', 'exam_id' => 'fe', 'exam_label' => '2024年 春期', 'count' => 3]);

        $this->deleteJson("/api/exams/{$exam->id}");

        $this->assertDatabaseMissing('user_progress', ['exam_id' => 'fe']);
        $this->assertDatabaseMissing('user_daily_progress', ['exam_id' => 'fe']);
    }

    public function test_存在しない試験の削除は404を返す(): void
    {
        $res = $this->deleteJson('/api/exams/9999');

        $res->assertNotFound();
    }
}
