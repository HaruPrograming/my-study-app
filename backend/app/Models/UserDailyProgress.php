<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserDailyProgress extends Model
{
    protected $fillable = ['date', 'exam_id', 'exam_label', 'count'];
}
