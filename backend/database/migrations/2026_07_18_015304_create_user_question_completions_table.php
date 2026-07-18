<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_question_completions', function (Blueprint $table) {
            $table->id();
            $table->string('exam_id');
            $table->string('exam_label');
            $table->unsignedInteger('question_number');
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['exam_id', 'exam_label', 'question_number'], 'uqc_exam_question_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_question_completions');
    }
};
