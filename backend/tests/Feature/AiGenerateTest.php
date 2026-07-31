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
}
