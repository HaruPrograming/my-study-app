<?php

namespace Tests\Feature;

use App\Models\Choice;
use App\Models\Folder;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExplanationTest extends TestCase
{
    use RefreshDatabase;

    private int $folderId;

    protected function setUp(): void
    {
        parent::setUp();
        $user = User::factory()->create();
        $this->actingAs($user);
        $folder = Folder::create(['user_id' => $user->id, 'exam_id' => 'fe', 'name' => '2024年 春期']);
        $this->folderId = $folder->id;
    }

    public function test_explanation付きの問題をAPIで取得できる(): void
    {
        $q = Question::create([
            'exam_id'      => 'fe',
            'exam_label'   => '2024年 春期',
            'folder_id'    => $this->folderId,
            'category'     => 'コンピュータ構成',
            'number'       => 1,
            'total_count'  => 3,
            'body'         => 'CPUの役割はどれか。',
            'illustration' => null,
            'points'       => [],
            'explanation'  => [
                ['title' => '役割', 'body' => 'CPUは中央処理装置であり、演算・制御を担当する。'],
                ['title' => '構成', 'body' => 'ALUと制御装置から成る。'],
                ['title' => '特徴', 'body' => 'クロック周波数が高いほど処理速度が速い。'],
            ],
        ]);
        Choice::create(['question_id' => $q->id, 'label' => 'ア', 'text' => '演算を行う', 'is_correct' => true]);

        $res = $this->getJson('/api/questions/fe/' . $this->folderId);

        $res->assertOk();
        $data = $res->json();
        $explanation = $data[0]['explanation'];
        $this->assertIsArray($explanation);
        $this->assertCount(3, $explanation);
        $this->assertSame('役割', $explanation[0]['title']);
        $this->assertSame('CPUは中央処理装置であり、演算・制御を担当する。', $explanation[0]['body']);
    }

    public function test_explanationがnullの問題もAPIで取得できる(): void
    {
        $q = Question::create([
            'exam_id'      => 'fe',
            'exam_label'   => '2024年 春期',
            'folder_id'    => $this->folderId,
            'category'     => 'コンピュータ構成',
            'number'       => 1,
            'total_count'  => 1,
            'body'         => '問題文',
            'illustration' => null,
            'points'       => [],
            'explanation'  => null,
        ]);
        Choice::create(['question_id' => $q->id, 'label' => 'ア', 'text' => '選択肢', 'is_correct' => true]);

        $res = $this->getJson('/api/questions/fe/' . $this->folderId);

        $res->assertOk()
            ->assertJsonFragment(['explanation' => null]);
    }

    public function test_exam_idでフィルタリングされる(): void
    {
        $user2    = User::factory()->create();
        $apFolder = Folder::create(['user_id' => $user2->id, 'exam_id' => 'ap', 'name' => '2024年 春期']);

        Question::create([
            'exam_id'      => 'fe',
            'exam_label'   => '2024年 春期',
            'folder_id'    => $this->folderId,
            'category'     => 'テスト',
            'number'       => 1,
            'total_count'  => 1,
            'body'         => 'FE問題',
            'illustration' => null,
            'points'       => [],
        ]);
        Question::create([
            'exam_id'      => 'ap',
            'exam_label'   => '2024年 春期',
            'folder_id'    => $apFolder->id,
            'category'     => 'テスト',
            'number'       => 1,
            'total_count'  => 1,
            'body'         => 'AP問題',
            'illustration' => null,
            'points'       => [],
        ]);

        $res = $this->getJson('/api/questions/fe/' . $this->folderId);

        $res->assertOk()->assertJsonCount(1);
        $res->assertJsonFragment(['examId' => 'fe']);
        $res->assertJsonMissing(['examId' => 'ap']);
    }
}
