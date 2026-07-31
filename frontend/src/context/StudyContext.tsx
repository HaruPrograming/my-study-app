import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Exam, ExamProgress, YearEntry, ProcessingUpload } from '../types'

type ApiExam = { id: number; name: string; short_name: string; color: string }
type ApiFolder = { id: number; exam_id: string; name: string; questions_count: number; created_at: string }

export type DailyHistoryEntry = {
  exam_id: string
  folder_id: number | null
  count: number
}

export type StudyHistoryItem = {
  date: string
  exams: DailyHistoryEntry[]
}

export type FailedUpload = {
  uploadId: number
  folderName: string
  errorMessage: string
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
  failedUploads: FailedUpload[]
  completeQuestion: (examId: string, folderId: number, questionNumber: number) => void
  resetProgress: (examId: string, folderId: number) => void
  addStudyDay: (date: string) => void
  startProcessing: (upload: ProcessingUpload) => void
  dismissFailedUpload: (uploadId: number) => void
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
  const [failedUploads, setFailedUploads] = useState<FailedUpload[]>([])
  const [studyDays, setStudyDays] = useState<Set<string>>(new Set())
  const [examProgresses, setExamProgresses] = useState<ExamProgress[]>([
    { examId: 'fe', name: '基本情報技術者', color: 'green',  done: 0, total: 0 },
    { examId: 'ap', name: '応用情報技術者', color: 'orange', done: 0, total: 0 },
  ])

  const refreshData = () => {
    Promise.all([
      fetch('/api/folders', { credentials: 'include' }).then(r => r.json()).catch(() => [] as ApiFolder[]),
      fetch('/api/progress', { credentials: 'include' }).then(r => r.json()).catch(() => [] as Array<{ exam_id: string; folder_id: number; completed_count: number }>),
      fetch('/api/pdfs/processing', { credentials: 'include' }).then(r => r.json()).catch(() => [] as Array<{ id: number; exam_id: string; folder_id: number }>),
      fetch('/api/study-days', { credentials: 'include' }).then(r => r.json()).catch(() => ({ dates: [] as string[], streak_days: 0, last_study_date: null })),
      fetch('/api/study-days/history', { credentials: 'include' }).then(r => r.json()).catch(() => [] as StudyHistoryItem[]),
      fetch('/api/exams', { credentials: 'include' }).then(r => r.json()).catch(() => [] as ApiExam[]),
    ])
      .then(([folderList, progressList, processingList, studyData, historyData, examList]: [
        ApiFolder[],
        Array<{ exam_id: string; folder_id: number; completed_count: number }>,
        Array<{ id: number; exam_id: string; folder_id: number }>,
        { dates: string[]; streak_days: number; last_study_date: string | null },
        StudyHistoryItem[],
        ApiExam[],
      ]) => {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        const apiExams: ApiExam[] = Array.isArray(examList) ? examList : []
        const folders: ApiFolder[] = Array.isArray(folderList) ? folderList : []

        setExams(apiExams.map(e => ({
          id: e.short_name,
          dbId: e.id,
          name: e.name,
          shortName: e.name,
          color: (e.color as 'green' | 'orange' | 'locked') ?? 'green',
          isLocked: false,
          years: folders
            .filter(f => f.exam_id === e.short_name)
            .map(f => {
              const prog = progressList.find(p => p.folder_id === f.id)
              return {
                id: `folder-${f.id}`,
                folderId: f.id,
                label: f.name,
                season: f.name.includes('春') ? 'spring' : 'autumn' as 'spring' | 'autumn',
                isNew: new Date(f.created_at).getTime() > sevenDaysAgo,
                completedCount: prog?.completed_count ?? 0,
                totalCount: f.questions_count ?? 0,
              } satisfies YearEntry
            }),
        })))

        if (processingList.length > 0) {
          setProcessingUploads(processingList.map(u => ({
            uploadId: u.id,
            examId: u.exam_id,
            folderId: u.folder_id,
            folderName: folders.find(f => f.id === u.folder_id)?.name ?? '',
          })))
        }

        setExamProgresses(apiExams.map(e => ({
          examId: e.short_name,
          name: e.name,
          color: (e.color as 'green' | 'orange') ?? 'green',
          done:  progressList.filter(p => p.exam_id === e.short_name).reduce((s, p) => s + p.completed_count, 0),
          total: folders.filter(f => f.exam_id === e.short_name).reduce((s, f) => s + (f.questions_count ?? 0), 0),
        })))

        setStreakDays(studyData?.streak_days ?? 0)
        setStudyDays(new Set(studyData?.dates ?? []))
        setStudyHistory(Array.isArray(historyData) ? historyData : [])

        const totalCompleted = progressList.reduce((s, p) => s + p.completed_count, 0)
        setCompletedQuestions(totalCompleted)

        const totalQuestions = folders.reduce((s, f) => s + (f.questions_count ?? 0), 0)
        setOverallProgress(totalQuestions > 0 ? Math.round(totalCompleted / totalQuestions * 100) : 0)
      })
      .catch(() => {})
  }

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
            if (!res.ok) return { ...u, status: 'pending' as const, errorMessage: '' }
            const data = await res.json() as { status: string; question_count: number; error_message?: string }
            return { ...u, status: data.status, errorMessage: data.error_message ?? '' }
          } catch {
            return { ...u, status: 'pending' as const, errorMessage: '' }
          }
        })
      )

      const doneIds = new Set<number>()
      const failedIds = new Set<number>()

      results.forEach(r => {
        if (r.status === 'done') {
          doneIds.add(r.uploadId)
        } else if (r.status === 'failed') {
          failedIds.add(r.uploadId)
          setFailedUploads(prev => [...prev, {
            uploadId: r.uploadId,
            folderName: r.folderName,
            errorMessage: r.errorMessage || '問題の生成に失敗しました。再度お試しください。',
          }])
        }
      })

      if (doneIds.size > 0 || failedIds.size > 0) {
        setProcessingUploads(prev =>
          prev.filter(u => !doneIds.has(u.uploadId) && !failedIds.has(u.uploadId))
        )
        if (doneIds.size > 0) {
          refreshData()
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [processingUploads]) // eslint-disable-line react-hooks/exhaustive-deps

  const resetProgress = (examId: string, folderId: number) => {
    setExams(prev => prev.map(exam =>
      exam.id !== examId ? exam : {
        ...exam,
        years: exam.years.map(year =>
          year.folderId !== folderId ? year : { ...year, completedCount: 0 }
        ),
      }
    ))
    fetch('/api/progress', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ exam_id: examId, folder_id: folderId }),
    }).catch(() => {})
  }

  const completeQuestion = (examId: string, folderId: number, questionNumber: number) => {
    setExams(prev => prev.map(exam =>
      exam.id !== examId ? exam : {
        ...exam,
        years: exam.years.map(year =>
          year.folderId !== folderId ? year : {
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
      body: JSON.stringify({ exam_id: examId, folder_id: folderId, question_number: questionNumber }),
    }).then(r => r.json()).then(data => {
      if (typeof data.completed_count === 'number') {
        setCompletedQuestions(n => n + 1)
      }
    }).catch(() => {})
  }

  const addStudyDay = (date: string) => {
    setStudyDays(prev => new Set([...prev, date]))
  }

  const startProcessing = (upload: ProcessingUpload) => {
    setProcessingUploads(prev => [...prev, upload])
  }

  const dismissFailedUpload = (uploadId: number) => {
    setFailedUploads(prev => prev.filter(u => u.uploadId !== uploadId))
  }

  return (
    <StudyContext.Provider value={{
      streakDays, completedQuestions, overallProgress,
      examProgresses, studyDays, studyHistory, exams, processingUploads, failedUploads,
      completeQuestion, resetProgress, addStudyDay, startProcessing, dismissFailedUpload, refreshData,
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
