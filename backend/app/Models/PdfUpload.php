<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PdfUpload extends Model
{
    protected $fillable = [
        'exam_id',
        'exam_label',
        'question_pdf_path',
        'answer_pdf_path',
        'status',
        'question_count',
        'error_message',
    ];
}
