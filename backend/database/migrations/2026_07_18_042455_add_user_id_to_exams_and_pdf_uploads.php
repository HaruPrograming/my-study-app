<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // exams
        Schema::table('exams', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
        });
        DB::table('exams')->update(['user_id' => 2]);
        Schema::table('exams', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->dropUnique('exams_short_name_unique');
            $table->unique(['user_id', 'short_name']);
        });

        // pdf_uploads
        Schema::table('pdf_uploads', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
        });
        DB::table('pdf_uploads')->update(['user_id' => 2]);
        Schema::table('pdf_uploads', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('pdf_uploads', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });

        Schema::table('exams', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropUnique('exams_user_id_short_name_unique');
            $table->string('short_name')->unique()->change();
            $table->dropColumn('user_id');
        });
    }
};
