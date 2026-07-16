<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 既存の文字列 explanation は配列形式と互換性がないため null に変換
        DB::table('questions')->whereNotNull('explanation')->update(['explanation' => null]);

        Schema::table('questions', function (Blueprint $table) {
            $table->json('explanation')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->text('explanation')->nullable()->change();
        });
    }
};
