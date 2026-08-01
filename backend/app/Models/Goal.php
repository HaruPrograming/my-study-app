<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Goal extends Model
{
    protected $fillable = ['user_id', 'body', 'is_done', 'notify_at'];

    protected $casts = [
        'is_done'   => 'boolean',
        'notify_at' => 'datetime',
    ];

    protected $attributes = ['is_done' => false];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
