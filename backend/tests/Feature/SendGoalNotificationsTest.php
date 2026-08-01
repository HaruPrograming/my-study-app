<?php

namespace Tests\Feature;

use App\Models\Goal;
use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class SendGoalNotificationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_notify_atが来た目標のユーザーに通知フラグが立つ(): void
    {
        $user = User::factory()->create();
        PushSubscription::create([
            'user_id'  => $user->id,
            'endpoint' => 'https://example.com/push/1',
            'p256dh'   => 'key',
            'auth'     => 'auth',
        ]);
        Goal::create([
            'user_id'   => $user->id,
            'body'      => '今日やること',
            'notify_at' => now()->subMinute(),
        ]);

        Artisan::call('goals:send-notifications');

        $this->assertDatabaseHas('goals', [
            'user_id'   => $user->id,
            'notify_at' => null,
        ]);
    }

    public function test_notify_atが未来の目標は送信されない(): void
    {
        $user = User::factory()->create();
        $goal = Goal::create([
            'user_id'   => $user->id,
            'body'      => '未来の目標',
            'notify_at' => now()->addHour(),
        ]);

        Artisan::call('goals:send-notifications');

        $this->assertDatabaseHas('goals', [
            'id'        => $goal->id,
            'notify_at' => $goal->notify_at,
        ]);
    }

    public function test_notify_atがnullの目標は処理されない(): void
    {
        $user = User::factory()->create();
        $goal = Goal::create([
            'user_id' => $user->id,
            'body'    => '通知なし目標',
        ]);

        Artisan::call('goals:send-notifications');

        $this->assertDatabaseHas('goals', ['id' => $goal->id]);
    }
}
