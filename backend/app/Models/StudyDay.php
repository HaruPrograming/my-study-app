<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudyDay extends Model
{
    protected $fillable = ['date'];

    protected $casts = ['date' => 'date'];
}
