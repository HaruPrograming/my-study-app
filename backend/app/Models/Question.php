<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Question extends Model
{
    protected $fillable = [
        'exam_id', 'exam_label', 'category', 'number',
        'total_count', 'body', 'illustration', 'points',
    ];

    protected $casts = [
        'illustration' => 'array',
        'points'       => 'array',
    ];

    public function choices(): HasMany
    {
        return $this->hasMany(Choice::class);
    }

    public function toApiArray(): array
    {
        return [
            'id'          => "{$this->exam_id}-{$this->id}",
            'examId'      => $this->exam_id,
            'examLabel'   => $this->exam_label,
            'category'    => $this->category,
            'number'      => $this->number,
            'totalCount'  => $this->total_count,
            'body'        => $this->body,
            'choices'     => $this->choices->map(fn (Choice $c) => [
                'label'     => $c->label,
                'text'      => $c->text,
                'isCorrect' => $c->is_correct,
            ])->all(),
            'illustration' => $this->illustration,
            'points'       => $this->points,
        ];
    }
}
