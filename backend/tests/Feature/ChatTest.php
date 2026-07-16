<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ChatTest extends TestCase
{
    use RefreshDatabase;

    private function anthropicOkResponse(string $text = 'AIの返答です'): array
    {
        return [
            'content' => [
                ['type' => 'text', 'text' => $text],
            ],
        ];
    }

    public function test_メッセージとコンテキストを送ると200とreplyが返る(): void
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

        $res->assertOk()->assertJsonStructure(['reply']);
    }

    public function test_replyが文字列で返る(): void
    {
        Http::fake([
            'https://api.anthropic.com/*' => Http::response($this->anthropicOkResponse('詳しく説明します'), 200),
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
        $this->assertIsString($res->json('reply'));
        $this->assertSame('詳しく説明します', $res->json('reply'));
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
