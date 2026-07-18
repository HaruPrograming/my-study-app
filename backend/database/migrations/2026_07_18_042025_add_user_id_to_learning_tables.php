<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // user_progress
        Schema::table('user_progress', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
        });
        DB::table('user_progress')->update(['user_id' => 2]);
        Schema::table('user_progress', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->dropUnique('user_progress_exam_id_exam_label_unique');
            $table->unique(['user_id', 'exam_id', 'exam_label']);
        });

        // study_days
        Schema::table('study_days', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
        });
        DB::table('study_days')->update(['user_id' => 2]);
        Schema::table('study_days', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->dropUnique('study_days_date_unique');
            $table->unique(['user_id', 'date']);
        });

        // user_daily_progress
        Schema::table('user_daily_progress', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
        });
        DB::table('user_daily_progress')->update(['user_id' => 2]);
        Schema::table('user_daily_progress', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->dropUnique('user_daily_progress_date_exam_id_exam_label_unique');
            $table->unique(['user_id', 'date', 'exam_id', 'exam_label']);
        });

        // user_question_completions
        Schema::table('user_question_completions', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
        });
        DB::table('user_question_completions')->update(['user_id' => 2]);
        Schema::table('user_question_completions', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->dropUnique('uqc_exam_question_unique');
            $table->unique(['user_id', 'exam_id', 'exam_label', 'question_number'], 'uqc_user_exam_question_unique');
        });
    }

    public function down(): void
    {
        Schema::table('user_question_completions', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropUnique('uqc_user_exam_question_unique');
            $table->unique(['exam_id', 'exam_label', 'question_number'], 'uqc_exam_question_unique');
            $table->dropColumn('user_id');
        });

        Schema::table('user_daily_progress', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropUnique('user_daily_progress_user_id_date_exam_id_exam_label_unique');
            $table->unique(['date', 'exam_id', 'exam_label']);
            $table->dropColumn('user_id');
        });

        Schema::table('study_days', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropUnique('study_days_user_id_date_unique');
            $table->date('date')->unique()->change();
            $table->dropColumn('user_id');
        });

        Schema::table('user_progress', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropUnique('user_progress_user_id_exam_id_exam_label_unique');
            $table->unique(['exam_id', 'exam_label']);
            $table->dropColumn('user_id');
        });
    }
};
