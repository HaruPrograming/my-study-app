<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserProgress extends Model
{
    protected $fillable = ['user_id', 'exam_id', 'exam_label', 'folder_id', 'completed_count'];
}
