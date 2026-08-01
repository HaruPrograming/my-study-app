<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PushSubscriptionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_プッシュ購読情報を登録できる(): void
    {
        $payload = [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/xxx',
            'p256dh'   => 'p256dh_key_value',
            'auth'     => 'auth_secret',
        ];

        $res = $this->postJson('/api/push-subscriptions', $payload);

        $res->assertCreated();
        $this->assertDatabaseHas('push_subscriptions', [
            'user_id'  => $this->user->id,
            'endpoint' => $payload['endpoint'],
        ]);
    }

    public function test_同じendpointで登録するとupsertされる(): void
    {
        $payload = [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/xxx',
            'p256dh'   => 'old_key',
            'auth'     => 'old_auth',
        ];

        $this->postJson('/api/push-subscriptions', $payload);

        $updated = array_merge($payload, ['p256dh' => 'new_key', 'auth' => 'new_auth']);
        $res = $this->postJson('/api/push-subscriptions', $updated);

        $res->assertCreated();
        $this->assertDatabaseCount('push_subscriptions', 1);
        $this->assertDatabaseHas('push_subscriptions', ['p256dh' => 'new_key']);
    }

    public function test_endpointが未指定では登録できない(): void
    {
        $res = $this->postJson('/api/push-subscriptions', [
            'p256dh' => 'key',
            'auth'   => 'auth',
        ]);

        $res->assertUnprocessable();
    }
}
