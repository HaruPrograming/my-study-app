import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { ExamProgress, YearEntry } from '../types'
import { exams as initialExams } from '../data/exams'
import type { Exam } from '../types'

type StudyContextValue = {
  streakDays: number
  completedQuestions: number
  overallProgress: number
  examProgresses: ExamProgress[]
  studyDays: Set<string>
  exams: Exam[]
  completeQuestion: (examId: string) => void
  addStudyDay: (date: string) => void
  addYearEntry: (examId: string, entry: YearEntry) => void
}

const StudyContext = createContext<StudyContextValue | null>(null)

export function StudyProvider({ children }: { children: ReactNode }) {
  const [streakDays] = useState(7)
  const [completedQuestions, setCompletedQuestions] = useState(142)
  const [overallProgress] = useState(42)
  const [exams, setExams] = useState<Exam[]>(initialExams)

  useEffect(() => {
    fetch('/api/pdfs', { credentials: 'include' })
      .then(r => r.json())
      .then((uploads: Array<{ id: number; exam_id: string; exam_label: string; question_count: number; created_at: string }>) => {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        setExams(prev => prev.map(exam => ({
          ...exam,
          years: uploads
            .filter(u => u.exam_id === exam.id)
            .map(u => ({
              id: `upload-${u.id}`,
              label: u.exam_label,
              season: u.exam_label.includes('春') ? 'spring' : 'autumn' as 'spring' | 'autumn',
              isNew: new Date(u.created_at).getTime() > sevenDaysAgo,
              completedCount: 0,
              totalCount: u.question_count ?? 0,
            })),
        })))
      })
      .catch(() => { /* ネットワークエラー時はハードコードデータを維持 */ })
  }, [])

  const [studyDays, setStudyDays] = useState<Set<string>>(
    new Set(['2026-07-01','2026-07-03','2026-07-04','2026-07-06','2026-07-07','2026-07-08','2026-07-10','2026-07-11'])
  )

  const examProgresses: ExamProgress[] = [
    { examId: 'fe', name: '基本情報技術者', color: 'green',  done: 142, total: 340 },
    { examId: 'ap', name: '応用情報技術者', color: 'orange', done: 0,   total: 340 },
  ]

  const completeQuestion = (_examId: string) => {
    setCompletedQuestions(n => n + 1)
  }

  const addStudyDay = (date: string) => {
    setStudyDays(prev => new Set([...prev, date]))
  }

  const addYearEntry = (examId: string, entry: YearEntry) => {
    setExams(prev => prev.map(e =>
      e.id === examId ? { ...e, years: [entry, ...e.years] } : e
    ))
  }

  return (
    <StudyContext.Provider value={{
      streakDays, completedQuestions, overallProgress,
      examProgresses, studyDays, exams,
      completeQuestion, addStudyDay, addYearEntry,
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
