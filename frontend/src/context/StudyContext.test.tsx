import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudyProvider, useStudyContext } from './StudyContext'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockPdfs = [
  { id: 1, exam_id: 'fe', exam_label: '2024年 春期', question_count: 10, created_at: '2026-01-01T00:00:00.000Z' },
]

const mockProgress = [
  { exam_id: 'fe', exam_label: '2024年 春期', completed_count: 5 },
]

function ProgressDisplay() {
  const { exams, completeQuestion } = useStudyContext()
  const year = exams.find(e => e.id === 'fe')?.years.find(y => y.label === '2024年 春期')
  return (
    <>
      <div data-testid="count">{year?.completedCount ?? 0}</div>
      <button onClick={() => completeQuestion('fe', '2024年 春期', 1)}>complete</button>
    </>
  )
}

function ProcessingDisplay() {
  const { processingUploads } = useStudyContext()
  return <div data-testid="processing-count">{processingUploads.length}</div>
}

describe('StudyContext - progress persistence', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('マウント時に /api/progress から completedCount を取得して年度に反映する', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url === '/api/pdfs') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPdfs) })
      }
      if (url === '/api/progress') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockProgress) })
      }
      if (url === '/api/exams') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([
          { id: 1, name: '基本情報技術者', short_name: 'fe', color: 'green' },
        ]) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    }))

    render(<StudyProvider><ProgressDisplay /></StudyProvider>)

    await waitFor(() => {
      expect(screen.getByTestId('count').textContent).toBe('5')
    })
  })

  it('completeQuestion を呼ぶと POST /api/progress が叩かれる', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/pdfs') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPdfs) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })
    vi.stubGlobal('fetch', mockFetch)

    const user = userEvent.setup()
    render(<StudyProvider><ProgressDisplay /></StudyProvider>)

    await user.click(screen.getByRole('button', { name: 'complete' }))

    expect(mockFetch).toHaveBeenCalledWith('/api/progress', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ exam_id: 'fe', exam_label: '2024年 春期', question_number: 1 }),
    }))
  })
})

describe('StudyContext - processingUploads 復元', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('マウント時に /api/pdfs/processing を取得して processingUploads に追加する', async () => {
    const mockProcessingList = [
      { id: 10, exam_id: 'fe', exam_label: '2024年 春期' },
      { id: 11, exam_id: 'ap', exam_label: '2024年 秋期' },
    ]

    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url === '/api/pdfs/processing') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockProcessingList) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    }))

    render(<StudyProvider><ProcessingDisplay /></StudyProvider>)

    await waitFor(() => {
      expect(screen.getByTestId('processing-count').textContent).toBe('2')
    })
  })

  it('処理中がない場合は processingUploads が空のまま', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ))

    render(<StudyProvider><ProcessingDisplay /></StudyProvider>)

    await waitFor(() => {
      expect(screen.getByTestId('processing-count').textContent).toBe('0')
    })
  })
})

function StreakDisplay() {
  const { streakDays, studyDays, overallProgress } = useStudyContext()
  return (
    <>
      <div data-testid="streak">{streakDays}</div>
      <div data-testid="study-days-count">{studyDays.size}</div>
      <div data-testid="overall-progress">{overallProgress}</div>
    </>
  )
}

describe('StudyContext - study-days 復元', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('マウント時に /api/study-days から streakDays を取得する', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url === '/api/study-days') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ dates: ['2026-07-16', '2026-07-17'], streak_days: 2, last_study_date: '2026-07-17' }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    }))

    render(<StudyProvider><StreakDisplay /></StudyProvider>)

    await waitFor(() => {
      expect(screen.getByTestId('streak').textContent).toBe('2')
    })
  })

  it('マウント時に /api/study-days から studyDays Set を復元する', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url === '/api/study-days') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ dates: ['2026-07-15', '2026-07-16', '2026-07-17'], streak_days: 3, last_study_date: '2026-07-17' }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    }))

    render(<StudyProvider><StreakDisplay /></StudyProvider>)

    await waitFor(() => {
      expect(screen.getByTestId('study-days-count').textContent).toBe('3')
    })
  })

  it('overallProgress が uploads と progressList から正しく計算される', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url === '/api/pdfs') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, exam_id: 'fe', exam_label: '2024年 春期', question_count: 10, created_at: '2026-01-01T00:00:00.000Z' },
          ]),
        })
      }
      if (url === '/api/progress') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ exam_id: 'fe', exam_label: '2024年 春期', completed_count: 5 }]),
        })
      }
      if (url === '/api/study-days') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ dates: [], streak_days: 0, last_study_date: null }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    }))

    render(<StudyProvider><StreakDisplay /></StudyProvider>)

    await waitFor(() => {
      expect(screen.getByTestId('overall-progress').textContent).toBe('50')
    })
  })
})

function ExamProgressDisplay() {
  const { examProgresses } = useStudyContext()
  const fe = examProgresses.find(e => e.examId === 'fe')
  const ap = examProgresses.find(e => e.examId === 'ap')
  return (
    <>
      <div data-testid="fe-done">{fe?.done ?? -1}</div>
      <div data-testid="fe-total">{fe?.total ?? -1}</div>
      <div data-testid="ap-done">{ap?.done ?? -1}</div>
      <div data-testid="ap-total">{ap?.total ?? -1}</div>
    </>
  )
}

describe('StudyContext - exams API取得', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  function ExamList() {
    const { exams } = useStudyContext()
    return <div data-testid="exam-names">{exams.map(e => e.name).join(',')}</div>
  }

  it('マウント時に /api/exams を取得して試験一覧を反映する', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url === '/api/exams') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, name: '基本情報技術者', short_name: 'fe', color: 'green' },
            { id: 2, name: '応用情報技術者', short_name: 'ap', color: 'orange' },
          ]),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    }))

    render(<StudyProvider><ExamList /></StudyProvider>)

    await waitFor(() => {
      expect(screen.getByTestId('exam-names').textContent).toContain('基本情報技術者')
      expect(screen.getByTestId('exam-names').textContent).toContain('応用情報技術者')
    })
  })

  it('/api/exams が空の場合は exams が空になる', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ))

    render(<StudyProvider><ExamList /></StudyProvider>)

    await waitFor(() => {
      expect(screen.getByTestId('exam-names').textContent).toBe('')
    })
  })
})

describe('StudyContext - examProgresses 実値化', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('uploads と progressList から試験別 done・total を計算する', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url === '/api/pdfs') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, exam_id: 'fe', exam_label: '2024年 春期', question_count: 20, created_at: '2026-01-01T00:00:00.000Z' },
            { id: 2, exam_id: 'fe', exam_label: '2024年 秋期', question_count: 15, created_at: '2026-01-01T00:00:00.000Z' },
            { id: 3, exam_id: 'ap', exam_label: '2024年 春期', question_count: 10, created_at: '2026-01-01T00:00:00.000Z' },
          ]),
        })
      }
      if (url === '/api/progress') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { exam_id: 'fe', exam_label: '2024年 春期', completed_count: 8 },
            { exam_id: 'fe', exam_label: '2024年 秋期', completed_count: 3 },
            { exam_id: 'ap', exam_label: '2024年 春期', completed_count: 2 },
          ]),
        })
      }
      if (url === '/api/exams') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, name: '基本情報技術者', short_name: 'fe', color: 'green' },
            { id: 2, name: '応用情報技術者', short_name: 'ap', color: 'orange' },
          ]),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    }))

    render(<StudyProvider><ExamProgressDisplay /></StudyProvider>)

    await waitFor(() => {
      expect(screen.getByTestId('fe-done').textContent).toBe('11')   // 8+3
      expect(screen.getByTestId('fe-total').textContent).toBe('35')  // 20+15
      expect(screen.getByTestId('ap-done').textContent).toBe('2')
      expect(screen.getByTestId('ap-total').textContent).toBe('10')
    })
  })

  it('データがない試験は done=0, total=0 になる', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ))

    render(<StudyProvider><ExamProgressDisplay /></StudyProvider>)

    await waitFor(() => {
      expect(screen.getByTestId('fe-done').textContent).toBe('0')
      expect(screen.getByTestId('fe-total').textContent).toBe('0')
    })
  })
})
