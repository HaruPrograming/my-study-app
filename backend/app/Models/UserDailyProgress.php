<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserDailyProgress extends Model
{
    protected $fillable = ['user_id', 'date', 'exam_id', 'exam_label', 'folder_id', 'count'];
}
