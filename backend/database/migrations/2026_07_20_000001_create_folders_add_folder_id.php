<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('folders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('exam_id');
            $table->string('name');
            $table->timestamps();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['user_id', 'exam_id', 'name']);
        });

        // Migrate existing pdf_uploads → folders (PHP code for DB portability)
        $now = now();
        $pdfs = DB::table('pdf_uploads')
            ->select(['user_id', 'exam_id', 'exam_label'])
            ->whereNotNull('exam_label')
            ->where('exam_label', '!=', '')
            ->distinct()
            ->get();

        foreach ($pdfs as $pdf) {
            DB::table('folders')->insertOrIgnore([
                'user_id'    => $pdf->user_id,
                'exam_id'    => $pdf->exam_id,
                'name'       => $pdf->exam_label,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $this->addFolderIdColumn('pdf_uploads');
        $this->updateFolderIdByUser('pdf_uploads');

        $this->addFolderIdColumn('questions');
        $this->updateFolderIdForQuestions();

        $this->addFolderIdColumn('user_progress');
        $this->updateFolderIdByUser('user_progress');

        $this->addFolderIdColumn('user_question_completions');
        $this->updateFolderIdByUser('user_question_completions');

        $this->addFolderIdColumn('user_daily_progress');
        $this->updateFolderIdByUser('user_daily_progress');
    }

    private function addFolderIdColumn(string $table): void
    {
        Schema::table($table, function (Blueprint $t) {
            $t->unsignedBigInteger('folder_id')->nullable()->after('exam_label');
            $t->foreign('folder_id')->references('id')->on('folders')->onDelete('cascade');
        });
    }

    private function updateFolderIdByUser(string $table): void
    {
        $folders = DB::table('folders')->get();
        foreach ($folders as $folder) {
            DB::table($table)
                ->where('user_id', $folder->user_id)
                ->where('exam_id', $folder->exam_id)
                ->where('exam_label', $folder->name)
                ->whereNull('folder_id')
                ->update(['folder_id' => $folder->id]);
        }
    }

    private function updateFolderIdForQuestions(): void
    {
        // Questions have no user_id — match by (exam_id, exam_label)
        $folders = DB::table('folders')->get();
        foreach ($folders as $folder) {
            DB::table('questions')
                ->where('exam_id', $folder->exam_id)
                ->where('exam_label', $folder->name)
                ->whereNull('folder_id')
                ->update(['folder_id' => $folder->id]);
        }
    }

    public function down(): void
    {
        Schema::table('user_daily_progress', function (Blueprint $table) {
            $table->dropForeign(['folder_id']);
            $table->dropColumn('folder_id');
        });
        Schema::table('user_question_completions', function (Blueprint $table) {
            $table->dropForeign(['folder_id']);
            $table->dropColumn('folder_id');
        });
        Schema::table('user_progress', function (Blueprint $table) {
            $table->dropForeign(['folder_id']);
            $table->dropColumn('folder_id');
        });
        Schema::table('questions', function (Blueprint $table) {
            $table->dropForeign(['folder_id']);
            $table->dropColumn('folder_id');
        });
        Schema::table('pdf_uploads', function (Blueprint $table) {
            $table->dropForeign(['folder_id']);
            $table->dropColumn('folder_id');
        });
        Schema::dropIfExists('folders');
    }
};
