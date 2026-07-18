<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudyDay extends Model
{
    protected $fillable = ['user_id', 'date'];

    protected $casts = ['date' => 'date'];
}
