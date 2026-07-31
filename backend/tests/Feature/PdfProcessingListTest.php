<?php

namespace Tests\Feature;

use App\Models\PdfUpload;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PdfProcessingListTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_pending状態のアップロードが返る(): void
    {
        PdfUpload::create([
            'user_id'           => $this->user->id,
            'exam_id'           => 'fe',
            'exam_label'        => '2024年 春期',
            'question_pdf_path' => null,
            'status'            => 'pending',
        ]);

        $res = $this->getJson('/api/pdfs/processing');

        $res->assertOk()->assertJsonCount(1);
    }

    public function test_processing状態のアップロードが返る(): void
    {
        PdfUpload::create([
            'user_id'           => $this->user->id,
            'exam_id'           => 'ap',
            'exam_label'        => '2024年 秋期',
            'question_pdf_path' => null,
            'status'            => 'processing',
        ]);

        $res = $this->getJson('/api/pdfs/processing');

        $res->assertOk()->assertJsonCount(1);
    }

    public function test_done状態は含まれない(): void
    {
        PdfUpload::create([
            'user_id'           => $this->user->id,
            'exam_id'           => 'fe',
            'exam_label'        => '2024年 春期',
            'question_pdf_path' => null,
            'status'            => 'done',
        ]);

        $res = $this->getJson('/api/pdfs/processing');

        $res->assertOk()->assertJsonCount(0);
    }

    public function test_failed状態は含まれない(): void
    {
        PdfUpload::create([
            'user_id'           => $this->user->id,
            'exam_id'           => 'fe',
            'exam_label'        => '2024年 春期',
            'question_pdf_path' => null,
            'status'            => 'failed',
        ]);

        $res = $this->getJson('/api/pdfs/processing');

        $res->assertOk()->assertJsonCount(0);
    }

    public function test_何もない場合は空配列を返す(): void
    {
        $res = $this->getJson('/api/pdfs/processing');

        $res->assertOk()->assertJson([]);
    }

    public function test_レスポンスにid_exam_id_exam_labelが含まれる(): void
    {
        PdfUpload::create([
            'user_id'           => $this->user->id,
            'exam_id'           => 'fe',
            'exam_label'        => '2024年 春期',
            'question_pdf_path' => null,
            'status'            => 'pending',
        ]);

        $res = $this->getJson('/api/pdfs/processing');

        $res->assertOk()->assertJsonStructure([['id', 'exam_id', 'folder_id']]);
    }
}
