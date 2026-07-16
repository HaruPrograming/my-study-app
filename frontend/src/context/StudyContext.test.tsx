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
      <button onClick={() => completeQuestion('fe', '2024年 春期')}>complete</button>
    </>
  )
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
      body: JSON.stringify({ exam_id: 'fe', exam_label: '2024年 春期' }),
    }))
  })
})
