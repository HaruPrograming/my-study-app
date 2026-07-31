<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // user_progress: 新ユニークを先に追加してから旧を削除（MySQL FK 制約回避）
        Schema::table('user_progress', function (Blueprint $table) {
            $table->string('exam_label')->nullable()->change();
            $table->unique(['user_id', 'folder_id'], 'user_progress_user_folder_unique');
        });
        Schema::table('user_progress', function (Blueprint $table) {
            $table->dropUnique('user_progress_user_id_exam_id_exam_label_unique');
        });

        // user_question_completions
        Schema::table('user_question_completions', function (Blueprint $table) {
            $table->string('exam_label')->nullable()->change();
            $table->unique(['user_id', 'folder_id', 'question_number'], 'uqc_user_folder_question_unique');
        });
        Schema::table('user_question_completions', function (Blueprint $table) {
            $table->dropUnique('uqc_user_exam_question_unique');
        });

        // user_daily_progress
        Schema::table('user_daily_progress', function (Blueprint $table) {
            $table->string('exam_label')->nullable()->change();
            $table->unique(['user_id', 'date', 'folder_id'], 'udp_user_date_folder_unique');
        });
        Schema::table('user_daily_progress', function (Blueprint $table) {
            $table->dropUnique('user_daily_progress_user_id_date_exam_id_exam_label_unique');
        });
    }

    public function down(): void
    {
        Schema::table('user_progress', function (Blueprint $table) {
            $table->dropUnique('user_progress_user_folder_unique');
            $table->string('exam_label')->nullable(false)->change();
            $table->unique(['user_id', 'exam_id', 'exam_label']);
        });

        Schema::table('user_question_completions', function (Blueprint $table) {
            $table->dropUnique('uqc_user_folder_question_unique');
            $table->string('exam_label')->nullable(false)->change();
            $table->unique(['user_id', 'exam_id', 'exam_label', 'question_number'], 'uqc_user_exam_question_unique');
        });

        Schema::table('user_daily_progress', function (Blueprint $table) {
            $table->dropUnique('udp_user_date_folder_unique');
            $table->string('exam_label')->nullable(false)->change();
            $table->unique(['user_id', 'date', 'exam_id', 'exam_label']);
        });
    }
};
