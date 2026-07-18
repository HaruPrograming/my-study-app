<?php

namespace Database\Seeders;

use App\Models\Exam;
use Illuminate\Database\Seeder;

class ExamSeeder extends Seeder
{
    public function run(): void
    {
        $exams = [
            ['name' => '基本情報技術者', 'short_name' => 'fe', 'color' => 'green'],
            ['name' => '応用情報技術者', 'short_name' => 'ap', 'color' => 'orange'],
        ];

        foreach ($exams as $exam) {
            Exam::firstOrCreate(['short_name' => $exam['short_name']], $exam);
        }
    }
}
