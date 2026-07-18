import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Exam, ExamProgress, YearEntry, ProcessingUpload } from '../types'

type ApiExam = { id: number; name: string; short_name: string; color: string }

export type DailyHistoryEntry = {
  exam_id: string
  exam_label: string
  count: number
}

export type StudyHistoryItem = {
  date: string
  exams: DailyHistoryEntry[]
}

type StudyContextValue = {
  streakDays: number
  completedQuestions: number
  overallProgress: number
  examProgresses: ExamProgress[]
  studyDays: Set<string>
  studyHistory: StudyHistoryItem[]
  exams: Exam[]
  processingUploads: ProcessingUpload[]
  completeQuestion: (examId: string, examLabel: string, questionNumber: number) => void
  resetProgress: (examId: string, examLabel: string) => void
  addStudyDay: (date: string) => void
  addYearEntry: (examId: string, entry: YearEntry) => void
  startProcessing: (upload: ProcessingUpload) => void
  refreshData: () => void
}

const StudyContext = createContext<StudyContextValue | null>(null)

export function StudyProvider({ children }: { children: ReactNode }) {
  const [streakDays, setStreakDays] = useState(0)
  const [completedQuestions, setCompletedQuestions] = useState(0)
  const [overallProgress, setOverallProgress] = useState(0)
  const [studyHistory, setStudyHistory] = useState<StudyHistoryItem[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [processingUploads, setProcessingUploads] = useState<ProcessingUpload[]>([])

  const refreshData = () => {
    Promise.all([
      fetch('/api/pdfs', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/progress', { credentials: 'include' }).then(r => r.json()).catch(() => [] as Array<{ exam_id: string; exam_label: string; completed_count: number }>),
      fetch('/api/pdfs/processing', { credentials: 'include' }).then(r => r.json()).catch(() => [] as Array<{ id: number; exam_id: string; exam_label: string }>),
      fetch('/api/study-days', { credentials: 'include' }).then(r => r.json()).catch(() => ({ dates: [] as string[], streak_days: 0, last_study_date: null })),
      fetch('/api/study-days/history', { credentials: 'include' }).then(r => r.json()).catch(() => [] as StudyHistoryItem[]),
      fetch('/api/exams', { credentials: 'include' }).then(r => r.json()).catch(() => [] as ApiExam[]),
    ])
      .then(([uploads, progressList, processingList, studyData, historyData, examList]: [
        Array<{ id: number; exam_id: string; exam_label: string; question_count: number; created_at: string }>,
        Array<{ exam_id: string; exam_label: string; completed_count: number }>,
        Array<{ id: number; exam_id: string; exam_label: string }>,
        { dates: string[]; streak_days: number; last_study_date: string | null },
        StudyHistoryItem[],
        ApiExam[],
      ]) => {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        const apiExams: ApiExam[] = Array.isArray(examList) ? examList : []

        setExams(apiExams.map(e => ({
          id: e.short_name,
          dbId: e.id,
          name: e.name,
          shortName: e.name,
          color: (e.color as 'green' | 'orange' | 'locked') ?? 'green',
          isLocked: false,
          years: uploads
            .filter(u => u.exam_id === e.short_name)
            .map(u => {
              const prog = progressList.find(p => p.exam_id === e.short_name && p.exam_label === u.exam_label)
              return {
                id: `upload-${u.id}`,
                label: u.exam_label,
                season: u.exam_label.includes('春') ? 'spring' : 'autumn' as 'spring' | 'autumn',
                isNew: new Date(u.created_at).getTime() > sevenDaysAgo,
                completedCount: prog?.completed_count ?? 0,
                totalCount: u.question_count ?? 0,
              }
            }),
        })))

        if (processingList.length > 0) {
          setProcessingUploads(processingList.map(u => ({
            uploadId: u.id,
            examId: u.exam_id,
            examLabel: u.exam_label,
          })))
        }

        setExamProgresses(apiExams.map(e => ({
          examId: e.short_name,
          name: e.name,
          color: (e.color as 'green' | 'orange') ?? 'green',
          done:  progressList.filter(p => p.exam_id === e.short_name).reduce((s, p) => s + p.completed_count, 0),
          total: uploads.filter(u => u.exam_id === e.short_name).reduce((s, u) => s + (u.question_count ?? 0), 0),
        })))

        setStreakDays(studyData?.streak_days ?? 0)
        setStudyDays(new Set(studyData?.dates ?? []))
        setStudyHistory(Array.isArray(historyData) ? historyData : [])

        const totalCompleted = progressList.reduce((s, p) => s + p.completed_count, 0)
        setCompletedQuestions(totalCompleted)

        const totalQuestions = uploads.reduce((s, u) => s + (u.question_count ?? 0), 0)
        setOverallProgress(totalQuestions > 0 ? Math.round(totalCompleted / totalQuestions * 100) : 0)
      })
      .catch(() => {})
  }

  // マウント時にデータを取得
  useEffect(() => {
    refreshData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // バックグラウンド処理中のアップロードをポーリング
  useEffect(() => {
    if (processingUploads.length === 0) return

    const interval = setInterval(async () => {
      const results = await Promise.all(
        processingUploads.map(async u => {
          try {
            const res = await fetch(`/api/pdfs/${u.uploadId}/status`, { credentials: 'include' })
            if (!res.ok) return { ...u, status: 'pending' as const, questionCount: 0 }
            const data = await res.json() as { status: string; question_count: number }
            return { ...u, status: data.status, questionCount: data.question_count }
          } catch {
            return { ...u, status: 'pending' as const, questionCount: 0 }
          }
        })
      )

      const doneIds = new Set<number>()
      const failedIds = new Set<number>()

      results.forEach(r => {
        if (r.status === 'done') {
          doneIds.add(r.uploadId)
          const entry: YearEntry = {
            id: `upload-${r.uploadId}`,
            label: r.examLabel,
            season: r.examLabel.includes('春') ? 'spring' : 'autumn',
            isNew: true,
            completedCount: 0,
            totalCount: r.questionCount ?? 0,
          }
          setExams(prev => prev.map(e =>
            e.id === r.examId ? { ...e, years: [entry, ...e.years] } : e
          ))
        } else if (r.status === 'failed') {
          failedIds.add(r.uploadId)
        }
      })

      if (doneIds.size > 0 || failedIds.size > 0) {
        setProcessingUploads(prev =>
          prev.filter(u => !doneIds.has(u.uploadId) && !failedIds.has(u.uploadId))
        )
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [processingUploads])

  const [studyDays, setStudyDays] = useState<Set<string>>(new Set())
  const [examProgresses, setExamProgresses] = useState<ExamProgress[]>([
    { examId: 'fe', name: '基本情報技術者', color: 'green',  done: 0, total: 0 },
    { examId: 'ap', name: '応用情報技術者', color: 'orange', done: 0, total: 0 },
  ])

  const resetProgress = (examId: string, examLabel: string) => {
    setExams(prev => prev.map(exam =>
      exam.id !== examId ? exam : {
        ...exam,
        years: exam.years.map(year =>
          year.label !== examLabel ? year : { ...year, completedCount: 0 }
        ),
      }
    ))
    fetch('/api/progress', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ exam_id: examId, exam_label: examLabel }),
    }).catch(() => {})
  }

  const completeQuestion = (examId: string, examLabel: string, questionNumber: number) => {
    setExams(prev => prev.map(exam =>
      exam.id !== examId ? exam : {
        ...exam,
        years: exam.years.map(year =>
          year.label !== examLabel ? year : {
            ...year,
            completedCount: Math.min(year.totalCount, year.completedCount + 1),
          }
        ),
      }
    ))
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ exam_id: examId, exam_label: examLabel, question_number: questionNumber }),
    }).then(r => r.json()).then(data => {
      if (typeof data.completed_count === 'number') {
        setCompletedQuestions(n => n + 1)
      }
    }).catch(() => {})
  }

  const addStudyDay = (date: string) => {
    setStudyDays(prev => new Set([...prev, date]))
  }

  const addYearEntry = (examId: string, entry: YearEntry) => {
    setExams(prev => prev.map(e =>
      e.id === examId ? { ...e, years: [entry, ...e.years] } : e
    ))
  }

  const startProcessing = (upload: ProcessingUpload) => {
    setProcessingUploads(prev => [...prev, upload])
  }

  return (
    <StudyContext.Provider value={{
      streakDays, completedQuestions, overallProgress,
      examProgresses, studyDays, studyHistory, exams, processingUploads,
      completeQuestion, resetProgress, addStudyDay, addYearEntry, startProcessing, refreshData,
    }}>
      {children}
    </StudyContext.Provider>
  )
}

export function useStudyContext() {
  const ctx = useContext(StudyContext)
  if (!ctx) throw new Error('useStudyContext must be used within StudyProvider')
  return ctx
}
