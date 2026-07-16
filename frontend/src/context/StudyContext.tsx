import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { ExamProgress, YearEntry, ProcessingUpload } from '../types'
import { exams as initialExams } from '../data/exams'
import type { Exam } from '../types'

type StudyContextValue = {
  streakDays: number
  completedQuestions: number
  overallProgress: number
  examProgresses: ExamProgress[]
  studyDays: Set<string>
  exams: Exam[]
  processingUploads: ProcessingUpload[]
  completeQuestion: (examId: string, examLabel: string) => void
  addStudyDay: (date: string) => void
  addYearEntry: (examId: string, entry: YearEntry) => void
  startProcessing: (upload: ProcessingUpload) => void
}

const StudyContext = createContext<StudyContextValue | null>(null)

export function StudyProvider({ children }: { children: ReactNode }) {
  const [streakDays] = useState(7)
  const [completedQuestions, setCompletedQuestions] = useState(142)
  const [overallProgress] = useState(42)
  const [exams, setExams] = useState<Exam[]>(initialExams)
  const [processingUploads, setProcessingUploads] = useState<ProcessingUpload[]>([])

  // マウント時に DB から完了済み年度一覧・進捗・処理中アップロードを取得
  useEffect(() => {
    Promise.all([
      fetch('/api/pdfs', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/progress').then(r => r.json()).catch(() => [] as Array<{ exam_id: string; exam_label: string; completed_count: number }>),
      fetch('/api/pdfs/processing', { credentials: 'include' }).then(r => r.json()).catch(() => [] as Array<{ id: number; exam_id: string; exam_label: string }>),
    ])
      .then(([uploads, progressList, processingList]: [
        Array<{ id: number; exam_id: string; exam_label: string; question_count: number; created_at: string }>,
        Array<{ exam_id: string; exam_label: string; completed_count: number }>,
        Array<{ id: number; exam_id: string; exam_label: string }>,
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
      })
      .catch(() => {})
  }, [])

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

  const [studyDays, setStudyDays] = useState<Set<string>>(
    new Set(['2026-07-01','2026-07-03','2026-07-04','2026-07-06','2026-07-07','2026-07-08','2026-07-10','2026-07-11'])
  )

  const examProgresses: ExamProgress[] = [
    { examId: 'fe', name: '基本情報技術者', color: 'green',  done: 142, total: 340 },
    { examId: 'ap', name: '応用情報技術者', color: 'orange', done: 0,   total: 340 },
  ]

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
      examProgresses, studyDays, exams, processingUploads,
      completeQuestion, addStudyDay, addYearEntry, startProcessing,
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
