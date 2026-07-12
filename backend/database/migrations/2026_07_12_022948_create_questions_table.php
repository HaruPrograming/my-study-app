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
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->string('exam_id');
            $table->string('exam_label');
            $table->string('category');
            $table->unsignedInteger('number');
            $table->unsignedInteger('total_count');
            $table->text('body');
            $table->json('illustration')->nullable();
            $table->json('points');
            $table->timestamps();

            $table->index('exam_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
