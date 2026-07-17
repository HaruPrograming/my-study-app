import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { ExamProgress, YearEntry, ProcessingUpload } from '../types'
import { exams as initialExams } from '../data/exams'
import type { Exam } from '../types'

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
  completeQuestion: (examId: string, examLabel: string) => void
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
  const [exams, setExams] = useState<Exam[]>(initialExams)
  const [processingUploads, setProcessingUploads] = useState<ProcessingUpload[]>([])

  const refreshData = () => {
    Promise.all([
      fetch('/api/pdfs', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/progress').then(r => r.json()).catch(() => [] as Array<{ exam_id: string; exam_label: string; completed_count: number }>),
      fetch('/api/pdfs/processing', { credentials: 'include' }).then(r => r.json()).catch(() => [] as Array<{ id: number; exam_id: string; exam_label: string }>),
      fetch('/api/study-days').then(r => r.json()).catch(() => ({ dates: [] as string[], streak_days: 0, last_study_date: null })),
      fetch('/api/study-days/history').then(r => r.json()).catch(() => [] as StudyHistoryItem[]),
    ])
      .then(([uploads, progressList, processingList, studyData, historyData]: [
        Array<{ id: number; exam_id: string; exam_label: string; question_count: number; created_at: string }>,
        Array<{ exam_id: string; exam_label: string; completed_count: number }>,
        Array<{ id: number; exam_id: string; exam_label: string }>,
        { dates: string[]; streak_days: number; last_study_date: string | null },
        StudyHistoryItem[],
      ]) => {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        setExams(prev => prev.map(exam => ({
          ...exam,
          years: uploads
            .filter(u => u.exam_id === exam.id)
            .map(u => {
              const prog = progressList.find(p => p.exam_id === exam.id && p.exam_label === u.exam_label)
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

        setExamProgresses(prev => prev.map(ep => {
          const total = uploads.filter(u => u.exam_id === ep.examId).reduce((s, u) => s + (u.question_count ?? 0), 0)
          const done  = progressList.filter(p => p.exam_id === ep.examId).reduce((s, p) => s + p.completed_count, 0)
          return { ...ep, done, total }
        }))

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

  const completeQuestion = (examId: string, examLabel: string) => {
    setCompletedQuestions(n => n + 1)
    setExams(prev => prev.map(exam =>
      exam.id !== examId ? exam : {
        ...exam,
        years: exam.years.map(year =>
          year.label !== examLabel ? year : { ...year, completedCount: year.completedCount + 1 }
        ),
      }
    ))
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exam_id: examId, exam_label: examLabel }),
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
      completeQuestion, addStudyDay, addYearEntry, startProcessing, refreshData,
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
