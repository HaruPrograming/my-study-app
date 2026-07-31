<?php

namespace Tests\Feature;

use App\Jobs\GenerateAiQuestionsJob;
use App\Models\Folder;
use App\Models\PdfUpload;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class AiGenerateTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_プロンプトとフォルダ名を送ると202が返りレコードが作成される(): void
    {
        Queue::fake();

        $res = $this->postJson('/api/ai-generate', [
            'prompt'   => '基本情報技術者試験 2024年春期 レベルの問題を20問生成してください',
            'name'     => '2024年 春期',
            'exam_id'  => 'fe',
        ]);

        $res->assertStatus(202)
            ->assertJsonStructure(['upload_id', 'folder_id', 'status']);

        $this->assertDatabaseHas('folders', [
            'user_id' => $this->user->id,
            'exam_id' => 'fe',
            'name'    => '2024年 春期',
        ]);

        $folder = Folder::where('user_id', $this->user->id)->where('name', '2024年 春期')->first();
        $this->assertDatabaseHas('pdf_uploads', [
            'exam_id'           => 'fe',
            'folder_id'         => $folder->id,
            'status'            => 'pending',
            'question_pdf_path' => null,
        ]);

        Queue::assertPushed(GenerateAiQuestionsJob::class);
    }

    public function test_同じフォルダへの重複送信は409(): void
    {
        Queue::fake();

        $folder = Folder::create(['user_id' => $this->user->id, 'exam_id' => 'fe', 'name' => '2024年 春期']);
        PdfUpload::create([
            'user_id' => $this->user->id, 'exam_id' => 'fe',
            'exam_label' => '2024年 春期', 'folder_id' => $folder->id, 'status' => 'done',
        ]);

        $res = $this->postJson('/api/ai-generate', [
            'prompt' => 'テスト', 'name' => '2024年 春期', 'exam_id' => 'fe',
        ]);

        $res->assertStatus(409);
    }

    public function test_promptが必須(): void
    {
        $res = $this->postJson('/api/ai-generate', [
            'name' => '2024年 春期', 'exam_id' => 'fe',
        ]);

        $res->assertUnprocessable();
    }

    public function test_nameが必須(): void
    {
        $res = $this->postJson('/api/ai-generate', [
            'prompt' => '問題を生成してください', 'exam_id' => 'fe',
        ]);

        $res->assertUnprocessable();
    }

    public function test_exam_idが必須(): void
    {
        $res = $this->postJson('/api/ai-generate', [
            'prompt' => '問題を生成してください', 'name' => '2024年 春期',
        ]);

        $res->assertUnprocessable();
    }

    public function test_作成されたupload_idとfolder_idがレスポンスに含まれる(): void
    {
        Queue::fake();

        $res = $this->postJson('/api/ai-generate', [
            'prompt' => '問題を生成してください', 'name' => '2024年 春期', 'exam_id' => 'fe',
        ]);

        $uploadId = $res->json('upload_id');
        $folderId = $res->json('folder_id');
        $this->assertNotNull($uploadId);
        $this->assertNotNull($folderId);
        $this->assertDatabaseHas('pdf_uploads', ['id' => $uploadId]);
        $this->assertDatabaseHas('folders', ['id' => $folderId]);
    }

    public function test_folder_idを直接指定すると既存フォルダに問題を追加できる(): void
    {
        Queue::fake();

        $folder = Folder::create([
            'user_id' => $this->user->id,
            'exam_id' => 'fe',
            'name'    => '既存フォルダ',
        ]);

        $res = $this->postJson('/api/ai-generate', [
            'prompt'    => '追加問題を生成してください',
            'folder_id' => $folder->id,
            'exam_id'   => 'fe',
        ]);

        $res->assertStatus(202)
            ->assertJson(['folder_id' => $folder->id]);

        Queue::assertPushed(GenerateAiQuestionsJob::class);

        // 既存フォルダへの追加なので重複チェックをスキップ（新しい pdf_upload が作成される）
        $this->assertDatabaseHas('pdf_uploads', [
            'folder_id' => $folder->id,
            'status'    => 'pending',
        ]);
    }

    public function test_folder_idとnameが両方なければ422(): void
    {
        $res = $this->postJson('/api/ai-generate', [
            'prompt'  => '問題を生成してください',
            'exam_id' => 'fe',
        ]);

        $res->assertUnprocessable();
    }

    public function test_他人のフォルダidを指定すると403(): void
    {
        Queue::fake();

        $other = \App\Models\User::factory()->create();
        $folder = Folder::create([
            'user_id' => $other->id,
            'exam_id' => 'fe',
            'name'    => '他人のフォルダ',
        ]);

        $res = $this->postJson('/api/ai-generate', [
            'prompt'    => '問題を生成してください',
            'folder_id' => $folder->id,
            'exam_id'   => 'fe',
        ]);

        $res->assertStatus(403);
    }
}
