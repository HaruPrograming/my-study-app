<?php

namespace Tests\Feature;

use App\Models\Folder;
use App\Models\PdfUpload;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PdfDuplicateCheckTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    private function makePdf(string $content = 'PDF-CONTENT'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('q.pdf', $content);
    }

    public function test_同じPDFファイルが既に登録済みの場合は409を返す(): void
    {
        Storage::fake('private');

        $pdfContent = '%PDF-1.4 exam content unique';
        $fileHash   = hash('sha256', $pdfContent);

        PdfUpload::create([
            'user_id'           => $this->user->id,
            'exam_id'           => 'fe',
            'exam_label'        => '2024年 春期',
            'question_pdf_path' => 'pdfs/existing.pdf',
            'file_hash'         => $fileHash,
            'status'            => 'done',
        ]);

        $res = $this->post('/api/pdfs/upload', [
            'question_pdf' => UploadedFile::fake()->createWithContent('q.pdf', $pdfContent),
            'name'         => '別のタイトルでも弾く',
            'exam_id'      => 'fe',
        ]);

        $res->assertStatus(409)
            ->assertJsonFragment(['message' => 'このPDFはすでに登録済みです']);
    }

    public function test_タイトルが異なっても同じPDFなら409を返す(): void
    {
        Storage::fake('private');

        $pdfContent = '%PDF-1.4 same content';
        $fileHash   = hash('sha256', $pdfContent);

        PdfUpload::create([
            'user_id'           => $this->user->id,
            'exam_id'           => 'fe',
            'exam_label'        => '2024年 春期',
            'question_pdf_path' => 'pdfs/existing.pdf',
            'file_hash'         => $fileHash,
            'status'            => 'done',
        ]);

        $res = $this->post('/api/pdfs/upload', [
            'question_pdf' => UploadedFile::fake()->createWithContent('q.pdf', $pdfContent),
            'name'         => '全く違うタイトル',
            'exam_id'      => 'ap',
        ]);

        $res->assertStatus(409);
    }

    public function test_内容が異なるPDFは通過して202を返す(): void
    {
        Storage::fake('private');

        PdfUpload::create([
            'user_id'           => $this->user->id,
            'exam_id'           => 'fe',
            'exam_label'        => '2024年 春期',
            'question_pdf_path' => 'pdfs/existing.pdf',
            'file_hash'         => hash('sha256', 'different content A'),
            'status'            => 'done',
        ]);

        $res = $this->post('/api/pdfs/upload', [
            'question_pdf' => UploadedFile::fake()->createWithContent('q.pdf', 'different content B'),
            'name'         => '2024年 秋期',
            'exam_id'      => 'fe',
        ]);

        $res->assertStatus(202);
    }

    public function test_pending状態の重複でも409を返す(): void
    {
        Storage::fake('private');

        $pdfContent = '%PDF-1.4 pending content';
        $fileHash   = hash('sha256', $pdfContent);

        PdfUpload::create([
            'user_id'           => $this->user->id,
            'exam_id'           => 'fe',
            'exam_label'        => '2024年 春期',
            'question_pdf_path' => 'pdfs/existing.pdf',
            'file_hash'         => $fileHash,
            'status'            => 'pending',
        ]);

        $res = $this->post('/api/pdfs/upload', [
            'question_pdf' => UploadedFile::fake()->createWithContent('q.pdf', $pdfContent),
            'name'         => '2024年 春期',
            'exam_id'      => 'fe',
        ]);

        $res->assertStatus(409);
    }

    public function test_failed状態の場合は再登録を許可する(): void
    {
        Storage::fake('private');

        $pdfContent = '%PDF-1.4 failed content';
        $fileHash   = hash('sha256', $pdfContent);

        PdfUpload::create([
            'user_id'           => $this->user->id,
            'exam_id'           => 'fe',
            'exam_label'        => '2024年 春期',
            'question_pdf_path' => 'pdfs/existing.pdf',
            'file_hash'         => $fileHash,
            'status'            => 'failed',
        ]);

        $res = $this->post('/api/pdfs/upload', [
            'question_pdf' => UploadedFile::fake()->createWithContent('q.pdf', $pdfContent),
            'name'         => '2024年 春期',
            'exam_id'      => 'fe',
        ]);

        $res->assertStatus(202);
    }

    public function test_AI生成でも同じフォルダが存在する場合409を返す(): void
    {
        $folder = Folder::create([
            'user_id' => $this->user->id,
            'exam_id' => 'fe',
            'name'    => '2024年 春期',
        ]);
        PdfUpload::create([
            'user_id'           => $this->user->id,
            'exam_id'           => 'fe',
            'exam_label'        => '2024年 春期',
            'folder_id'         => $folder->id,
            'question_pdf_path' => null,
            'status'            => 'done',
        ]);

        $res = $this->postJson('/api/ai-generate', [
            'prompt'  => '問題を20問生成してください',
            'name'    => '2024年 春期',
            'exam_id' => 'fe',
        ]);

        $res->assertStatus(409)
            ->assertJsonFragment(['message' => 'このフォルダはすでに登録済みです']);
    }
}
