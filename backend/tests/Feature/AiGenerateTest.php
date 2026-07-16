<?php

namespace Tests\Feature;

use App\Jobs\GenerateAiQuestionsJob;
use App\Models\PdfUpload;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class AiGenerateTest extends TestCase
{
    use RefreshDatabase;

    public function test_プロンプトとタイトルを送ると202が返りレコードが作成される(): void
    {
        Queue::fake();

        $res = $this->postJson('/api/ai-generate', [
            'prompt'   => '基本情報技術者試験 2024年春期 レベルの問題を20問生成してください',
            'title'    => '2024年 春期',
            'exam_id'  => 'fe',
        ]);

        $res->assertStatus(202)
            ->assertJsonStructure(['upload_id', 'status']);

        $this->assertDatabaseHas('pdf_uploads', [
            'exam_id'           => 'fe',
            'exam_label'        => '2024年 春期',
            'status'            => 'pending',
            'question_pdf_path' => null,
        ]);

        Queue::assertPushed(GenerateAiQuestionsJob::class);
    }

    public function test_promptが必須(): void
    {
        $res = $this->postJson('/api/ai-generate', [
            'title'   => '2024年 春期',
            'exam_id' => 'fe',
        ]);

        $res->assertUnprocessable();
    }

    public function test_titleが必須(): void
    {
        $res = $this->postJson('/api/ai-generate', [
            'prompt'  => '問題を生成してください',
            'exam_id' => 'fe',
        ]);

        $res->assertUnprocessable();
    }

    public function test_exam_idが必須(): void
    {
        $res = $this->postJson('/api/ai-generate', [
            'prompt' => '問題を生成してください',
            'title'  => '2024年 春期',
        ]);

        $res->assertUnprocessable();
    }

    public function test_作成されたupload_idがレスポンスに含まれる(): void
    {
        Queue::fake();

        $res = $this->postJson('/api/ai-generate', [
            'prompt'  => '問題を生成してください',
            'title'   => '2024年 春期',
            'exam_id' => 'fe',
        ]);

        $uploadId = $res->json('upload_id');
        $this->assertNotNull($uploadId);
        $this->assertDatabaseHas('pdf_uploads', ['id' => $uploadId]);
    }
}
