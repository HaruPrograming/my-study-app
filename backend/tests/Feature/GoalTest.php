<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GoalTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_目標を作成できる(): void
    {
        $res = $this->postJson('/api/goals', ['body' => '基本情報を1ヶ月で完走する']);

        $res->assertCreated()
            ->assertJsonStructure(['id', 'body', 'is_done', 'created_at']);

        $this->assertDatabaseHas('goals', [
            'user_id' => $this->user->id,
            'body'    => '基本情報を1ヶ月で完走する',
            'is_done' => false,
        ]);
    }

    public function test_bodyが空では作成できない(): void
    {
        $res = $this->postJson('/api/goals', ['body' => '']);

        $res->assertUnprocessable();
    }

    public function test_自分の目標一覧を取得できる(): void
    {
        \App\Models\Goal::create(['user_id' => $this->user->id, 'body' => '目標1']);
        \App\Models\Goal::create(['user_id' => $this->user->id, 'body' => '目標2']);

        $other = User::factory()->create();
        \App\Models\Goal::create(['user_id' => $other->id, 'body' => '他人の目標']);

        $res = $this->getJson('/api/goals');

        $res->assertOk()->assertJsonCount(2);
    }

    public function test_目標の完了状態をトグルできる(): void
    {
        $goal = \App\Models\Goal::create(['user_id' => $this->user->id, 'body' => '目標']);

        $res = $this->patchJson("/api/goals/{$goal->id}", ['is_done' => true]);

        $res->assertOk()->assertJson(['is_done' => true]);
        $this->assertDatabaseHas('goals', ['id' => $goal->id, 'is_done' => true]);
    }

    public function test_他人の目標は更新できない(): void
    {
        $other = User::factory()->create();
        $goal = \App\Models\Goal::create(['user_id' => $other->id, 'body' => '他人の目標']);

        $res = $this->patchJson("/api/goals/{$goal->id}", ['is_done' => true]);

        $res->assertStatus(403);
    }

    public function test_目標を削除できる(): void
    {
        $goal = \App\Models\Goal::create(['user_id' => $this->user->id, 'body' => '目標']);

        $res = $this->deleteJson("/api/goals/{$goal->id}");

        $res->assertOk();
        $this->assertDatabaseMissing('goals', ['id' => $goal->id]);
    }

    public function test_他人の目標は削除できない(): void
    {
        $other = User::factory()->create();
        $goal = \App\Models\Goal::create(['user_id' => $other->id, 'body' => '他人の目標']);

        $res = $this->deleteJson("/api/goals/{$goal->id}");

        $res->assertStatus(403);
        $this->assertDatabaseHas('goals', ['id' => $goal->id]);
    }
}
