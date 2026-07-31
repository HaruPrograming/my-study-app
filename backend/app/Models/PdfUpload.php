<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PdfUpload extends Model
{
    protected $fillable = [
        'user_id',
        'exam_id',
        'exam_label',
        'folder_id',
        'question_pdf_path',
        'answer_pdf_path',
        'file_hash',
        'status',
        'question_count',
        'error_message',
    ];
}
