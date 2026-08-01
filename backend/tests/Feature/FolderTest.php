<?php

namespace Tests\Feature;

use App\Models\Folder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FolderTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_フォルダを作成できる(): void
    {
        $res = $this->postJson('/api/folders', [
            'exam_id' => 'fe',
            'name'    => '基礎問題',
        ]);

        $res->assertCreated()
            ->assertJsonStructure(['id', 'exam_id', 'name', 'user_id', 'created_at']);

        $this->assertDatabaseHas('folders', [
            'user_id' => $this->user->id,
            'exam_id' => 'fe',
            'name'    => '基礎問題',
        ]);
    }

    public function test_同名フォルダは作成できない(): void
    {
        Folder::create(['user_id' => $this->user->id, 'exam_id' => 'fe', 'name' => '基礎問題']);

        $res = $this->postJson('/api/folders', [
            'exam_id' => 'fe',
            'name'    => '基礎問題',
        ]);

        $res->assertStatus(409);
    }

    public function test_フォルダ一覧を取得できる(): void
    {
        Folder::create(['user_id' => $this->user->id, 'exam_id' => 'fe', 'name' => '春期']);
        Folder::create(['user_id' => $this->user->id, 'exam_id' => 'ap', 'name' => '秋期']);

        $res = $this->getJson('/api/folders');

        $res->assertOk()->assertJsonCount(2);
    }

    public function test_exam_idでフィルタできる(): void
    {
        Folder::create(['user_id' => $this->user->id, 'exam_id' => 'fe', 'name' => '春期']);
        Folder::create(['user_id' => $this->user->id, 'exam_id' => 'ap', 'name' => '秋期']);

        $res = $this->getJson('/api/folders?exam_id=fe');

        $res->assertOk()->assertJsonCount(1)
            ->assertJsonFragment(['exam_id' => 'fe']);
    }

    public function test_他ユーザーのフォルダは取得できない(): void
    {
        $other = User::factory()->create();
        Folder::create(['user_id' => $other->id, 'exam_id' => 'fe', 'name' => '春期']);

        $res = $this->getJson('/api/folders');

        $res->assertOk()->assertJsonCount(0);
    }

    public function test_フォルダを削除できる(): void
    {
        $folder = Folder::create(['user_id' => $this->user->id, 'exam_id' => 'fe', 'name' => '春期']);

        $res = $this->deleteJson("/api/folders/{$folder->id}");

        $res->assertNoContent();
        $this->assertDatabaseMissing('folders', ['id' => $folder->id]);
    }

    public function test_他ユーザーのフォルダは削除できない(): void
    {
        $other = User::factory()->create();
        $folder = Folder::create(['user_id' => $other->id, 'exam_id' => 'fe', 'name' => '春期']);

        $res = $this->deleteJson("/api/folders/{$folder->id}");

        $res->assertForbidden();
    }

    public function test_exam_idが必須(): void
    {
        $res = $this->postJson('/api/folders', ['name' => '春期']);
        $res->assertUnprocessable();
    }

    public function test_nameが必須(): void
    {
        $res = $this->postJson('/api/folders', ['exam_id' => 'fe']);
        $res->assertUnprocessable();
    }
}
