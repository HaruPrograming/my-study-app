<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserQuestionCompletion extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'exam_id', 'exam_label', 'question_number'];
}
