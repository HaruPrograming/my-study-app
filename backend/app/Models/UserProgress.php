<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserProgress extends Model
{
    protected $fillable = ['exam_id', 'exam_label', 'completed_count'];
}
