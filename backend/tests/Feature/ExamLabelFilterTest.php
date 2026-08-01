<?php

namespace Tests\Feature;

use App\Models\Choice;
use App\Models\Folder;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExamLabelFilterTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    private function createFolder(string $examId, string $name): Folder
    {
        return Folder::create(['user_id' => $this->user->id, 'exam_id' => $examId, 'name' => $name]);
    }

    private function createQuestion(Folder $folder, string $body, int $number = 1): Question
    {
        $q = Question::create([
            'exam_id'     => $folder->exam_id,
            'exam_label'  => $folder->name,
            'folder_id'   => $folder->id,
            'category'    => 'テスト',
            'number'      => $number,
            'total_count' => 1,
            'body'        => $body,
            'illustration' => null,
            'points'      => [],
        ]);
        Choice::create(['question_id' => $q->id, 'label' => 'ア', 'text' => '選択肢', 'is_correct' => true]);
        return $q;
    }

    public function test_指定したfolder_idの問題のみ返す(): void
    {
        $folder1 = $this->createFolder('fe', '2023年春期');
        $folder2 = $this->createFolder('fe', '2024年春期');
        $this->createQuestion($folder1, '春期の問題');
        $this->createQuestion($folder2, '別年度の問題');

        $res = $this->getJson("/api/questions/fe/{$folder1->id}");

        $res->assertOk()->assertJsonCount(1);
        $res->assertJsonFragment(['body' => '春期の問題']);
        $res->assertJsonMissing(['body' => '別年度の問題']);
    }

    public function test_別のfolder_idを指定すると別フォルダの問題が返る(): void
    {
        $folder1 = $this->createFolder('fe', '2023年春期');
        $folder2 = $this->createFolder('fe', '2024年春期');
        $this->createQuestion($folder1, '春期の問題');
        $this->createQuestion($folder2, '別年度の問題');

        $res = $this->getJson("/api/questions/fe/{$folder2->id}");

        $res->assertOk()->assertJsonCount(1);
        $res->assertJsonFragment(['body' => '別年度の問題']);
        $res->assertJsonMissing(['body' => '春期の問題']);
    }

    public function test_exam_idとfolder_id両方でフィルタされる(): void
    {
        $feFolder = $this->createFolder('fe', '2023年春期');
        $apFolder = $this->createFolder('ap', '2023年春期');
        $this->createQuestion($feFolder, 'FE春期の問題');
        $this->createQuestion($apFolder, 'AP春期の問題');

        $res = $this->getJson("/api/questions/fe/{$feFolder->id}");

        $res->assertOk()->assertJsonCount(1);
        $res->assertJsonFragment(['examId' => 'fe']);
        $res->assertJsonMissing(['examId' => 'ap']);
    }

    public function test_存在しないfolder_idは空配列を返す(): void
    {
        $this->createFolder('fe', '2023年春期');

        $res = $this->getJson('/api/questions/fe/99999');

        $res->assertOk()->assertJsonCount(0);
    }
}
