<?php

namespace Tests\Feature;

use App\Models\PdfUpload;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PdfUploadStatusTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_pending状態のジョブのステータスを取得できる(): void
    {
        $upload = PdfUpload::create([
            'user_id'           => $this->user->id,
            'exam_id'           => 'ap',
            'exam_label'        => '2024年 春期',
            'question_pdf_path' => 'pdfs/test.pdf',
            'status'            => 'pending',
        ]);

        $res = $this->getJson("/api/pdfs/{$upload->id}/status");

        $res->assertOk()
            ->assertJson(['status' => 'pending', 'question_count' => 0]);
    }

    public function test_done状態のジョブのステータスと件数を取得できる(): void
    {
        $upload = PdfUpload::create([
            'user_id'           => $this->user->id,
            'exam_id'           => 'ap',
            'exam_label'        => '2024年 春期',
            'question_pdf_path' => 'pdfs/test.pdf',
            'status'            => 'done',
            'question_count'    => 25,
        ]);

        $res = $this->getJson("/api/pdfs/{$upload->id}/status");

        $res->assertOk()
            ->assertJson(['status' => 'done', 'question_count' => 25]);
    }

    public function test_failed状態のジョブはerror_messageを返す(): void
    {
        $upload = PdfUpload::create([
            'user_id'           => $this->user->id,
            'exam_id'           => 'ap',
            'exam_label'        => '2024年 春期',
            'question_pdf_path' => 'pdfs/test.pdf',
            'status'            => 'failed',
            'error_message'     => 'OCR に失敗しました',
        ]);

        $res = $this->getJson("/api/pdfs/{$upload->id}/status");

        $res->assertOk()
            ->assertJson(['status' => 'failed', 'error_message' => 'OCR に失敗しました']);
    }

    public function test_存在しないIDは404を返す(): void
    {
        $this->getJson('/api/pdfs/9999/status')->assertNotFound();
    }
}
