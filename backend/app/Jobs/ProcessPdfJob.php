<?php

namespace App\Jobs;

use App\Models\Choice;
use App\Models\PdfUpload;
use App\Models\Question;
use App\Services\PdfQuestionParserService;
use App\Services\PdfTextExtractorService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProcessPdfJob implements ShouldQueue
{
    use Queueable;

    public int $timeout = 600;

    public function __construct(private int $uploadId) {}

    /** job が永久失敗した時（MaxAttempts・FatalError 後）に status を failed に更新する */
    public function failed(\Throwable $exception): void
    {
        PdfUpload::where('id', $this->uploadId)
            ->whereIn('status', ['pending', 'processing'])
            ->update([
                'status'        => 'failed',
                'error_message' => mb_substr($exception->getMessage(), 0, 255),
            ]);
    }

    public function handle(
        PdfTextExtractorService $extractor,
        PdfQuestionParserService $parser,
    ): void {
        $upload = PdfUpload::findOrFail($this->uploadId);
        $upload->update(['status' => 'processing']);

        try {
            $questionPath = Storage::disk('private')->path($upload->question_pdf_path);
            $answerPath   = $upload->answer_pdf_path
                ? Storage::disk('private')->path($upload->answer_pdf_path)
                : null;

            if (config('services.anthropic.key')) {
                // Claude Vision で構造化抽出（正規表現パース不要・高精度）
                $parsed    = $extractor->extractStructuredQuestions($questionPath);
                $answerMap = $answerPath ? $extractor->extractStructuredAnswers($answerPath) : [];

                // 解答マップを適用
                if (!empty($answerMap)) {
                    foreach ($parsed as &$item) {
                        $correctLabel = $answerMap[$item['number']] ?? null;
                        if ($correctLabel !== null) {
                            foreach ($item['choices'] as &$c) {
                                $c['is_correct'] = ($c['label'] === $correctLabel);
                            }
                        }
                    }
                    unset($item, $c);
                }
            } else {
                // フォールバック: テキスト抽出 + 正規表現パーサー
                $questionText = $extractor->extract($questionPath);
                $answerText   = $answerPath ? $extractor->extract($answerPath) : '';
                $answerMap    = $answerText ? $parser->parseAnswers($answerText) : [];
                $parsed       = $parser->parseQuestions($questionText, $answerMap);
            }

            // 同じ問番号が複数ある場合は最初のものを採用（OCR 重複読み取り対策）
            $parsed = collect($parsed)->unique('number')->values()->all();

            if (count($parsed) === 0) {
                $upload->update([
                    'status'        => 'failed',
                    'error_message' => 'PDF から問題を抽出できませんでした。スキャン画像型 PDF の OCR は対応予定です。',
                ]);
                return;
            }

            $count = DB::transaction(function () use ($parsed, $upload, $extractor) {
                foreach ($parsed as $item) {
                    $rich = $extractor->generateRichContent($item);

                    $question = Question::create([
                        'exam_id'      => $upload->exam_id,
                        'exam_label'   => $upload->exam_label,
                        'category'     => '科目A',
                        'number'       => $item['number'],
                        'total_count'  => count($parsed),
                        'body'         => $item['body'],
                        'illustration' => $rich['illustration'],
                        'points'       => $rich['points'],
                        'explanation'  => $rich['explanation'],
                    ]);

                    foreach ($item['choices'] as $c) {
                        Choice::create([
                            'question_id' => $question->id,
                            'label'       => $c['label'],
                            'text'        => $c['text'],
                            'is_correct'  => $c['is_correct'],
                        ]);
                    }
                }
                return count($parsed);
            });

            $upload->update(['status' => 'done', 'question_count' => $count]);
        } catch (\Throwable $e) {
            $upload->update([
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
            ]);
        }
    }
}
