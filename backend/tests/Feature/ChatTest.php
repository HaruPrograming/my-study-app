<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ChatTest extends TestCase
{
    use RefreshDatabase;

    private function anthropicOkResponse(string $point = 'ポイント', string $explanation = '解説です'): array
    {
        $json = json_encode(['point' => $point, 'explanation' => $explanation], JSON_UNESCAPED_UNICODE);
        return [
            'content' => [
                ['type' => 'text', 'text' => $json],
            ],
        ];
    }

    public function test_メッセージとコンテキストを送ると200とpoint_explanationが返る(): void
    {
        Http::fake([
            'https://api.anthropic.com/*' => Http::response($this->anthropicOkResponse(), 200),
        ]);

        $res = $this->postJson('/api/chat', [
            'message' => 'この問題についてもっと教えてください',
            'context' => [
                'body'        => '問題文です',
                'choices'     => [['label' => 'ア', 'text' => '選択肢A', 'is_correct' => true]],
                'points'      => [['icon' => 'target', 'text' => 'ポイント1']],
                'explanation' => [['title' => '解説', 'body' => '内容']],
            ],
        ]);

        $res->assertOk()->assertJsonStructure(['point', 'explanation']);
    }

    public function test_pointとexplanationが文字列で返る(): void
    {
        Http::fake([
            'https://api.anthropic.com/*' => Http::response(
                $this->anthropicOkResponse('🔵 CPU → 🔄 演算', 'CPUは演算・制御を担当します'),
                200,
            ),
        ]);

        $res = $this->postJson('/api/chat', [
            'message' => 'テスト',
            'context' => [
                'body'        => '問題文',
                'choices'     => [],
                'points'      => [],
                'explanation' => null,
            ],
        ]);

        $res->assertOk();
        $this->assertSame('🔵 CPU → 🔄 演算', $res->json('point'));
        $this->assertSame('CPUは演算・制御を担当します', $res->json('explanation'));
    }

    public function test_messageが必須(): void
    {
        $res = $this->postJson('/api/chat', [
            'context' => ['body' => '問題文', 'choices' => [], 'points' => [], 'explanation' => null],
        ]);

        $res->assertUnprocessable();
    }

    public function test_contextが必須(): void
    {
        $res = $this->postJson('/api/chat', [
            'message' => 'テスト',
        ]);

        $res->assertUnprocessable();
    }
}
