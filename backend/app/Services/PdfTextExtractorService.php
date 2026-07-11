<?php

namespace App\Services;

use Smalot\PdfParser\Parser;

class PdfTextExtractorService
{
    public function extract(string $filePath): string
    {
        $parser = new Parser();
        $pdf = $parser->parseFile($filePath);

        $text = '';
        foreach ($pdf->getPages() as $page) {
            $pageText = $page->getText();
            $text .= mb_convert_encoding($pageText, 'UTF-8', 'UTF-8') . "\n";
        }

        return trim($text);
    }
}
