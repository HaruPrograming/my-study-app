<?php

namespace App\Console\Commands;

use App\Models\Goal;
use App\Models\PushSubscription;
use Illuminate\Console\Command;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class SendGoalNotifications extends Command
{
    protected $signature = 'goals:send-notifications';
    protected $description = '通知日時が来た目標をプッシュ通知で送信する';

    public function handle(): void
    {
        $goals = Goal::whereNotNull('notify_at')
            ->where('notify_at', '<=', now())
            ->get();

        if ($goals->isEmpty()) {
            return;
        }

        $vapidPublicKey  = config('webpush.vapid.public_key');
        $vapidPrivateKey = config('webpush.vapid.private_key');
        $vapidSubject    = config('webpush.vapid.subject');

        foreach ($goals as $goal) {
            $subscriptions = PushSubscription::where('user_id', $goal->user_id)->get();

            if ($subscriptions->isNotEmpty() && $vapidPublicKey && $vapidPrivateKey) {
                $webPush = new WebPush([
                    'VAPID' => [
                        'subject'    => $vapidSubject,
                        'publicKey'  => $vapidPublicKey,
                        'privateKey' => $vapidPrivateKey,
                    ],
                ]);

                $payload = json_encode([
                    'title' => '🎯 目標を確認しよう！',
                    'body'  => $goal->body,
                ]);

                foreach ($subscriptions as $sub) {
                    $subscription = Subscription::create([
                        'endpoint' => $sub->endpoint,
                        'keys'     => [
                            'p256dh' => $sub->p256dh,
                            'auth'   => $sub->auth,
                        ],
                    ]);
                    $webPush->queueNotification($subscription, $payload);
                }

                foreach ($webPush->flush() as $report) {
                    if ($report->isSuccess()) {
                        \Log::info('Push sent: ' . $goal->body);
                    } else {
                        \Log::error('Push failed: ' . $report->getReason() . ' endpoint: ' . $report->getEndpoint());
                        if ($report->isSubscriptionExpired()) {
                            PushSubscription::where('endpoint', $report->getEndpoint())->delete();
                        }
                    }
                }
            }

            $goal->update(['notify_at' => null]);
        }
    }
}
