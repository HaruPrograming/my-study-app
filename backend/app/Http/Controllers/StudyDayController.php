<?php

namespace App\Http\Controllers;

use App\Models\StudyDay;
use Illuminate\Http\JsonResponse;

class StudyDayController extends Controller
{
    public function index(): JsonResponse
    {
        $dates = StudyDay::orderBy('date', 'desc')->pluck('date')->map(fn ($d) => $d->toDateString())->values();

        $streakDays = 0;
        $lastStudyDate = $dates->first();

        if ($dates->isNotEmpty()) {
            $today = now()->toDateString();
            $yesterday = now()->subDay()->toDateString();
            $mostRecent = $dates->first();

            if ($mostRecent === $today || $mostRecent === $yesterday) {
                $streakDays = 1;
                $prev = $mostRecent;

                foreach ($dates->skip(1) as $date) {
                    $expected = date('Y-m-d', strtotime($prev . ' -1 day'));
                    if ($date === $expected) {
                        $streakDays++;
                        $prev = $date;
                    } else {
                        break;
                    }
                }
            }
        }

        return response()->json([
            'dates'           => $dates->all(),
            'streak_days'     => $streakDays,
            'last_study_date' => $lastStudyDate,
        ]);
    }
}
