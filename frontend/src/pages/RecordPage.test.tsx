import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { StudyProvider } from '../context/StudyContext'
import { RecordPage } from './RecordPage'

const mockHistory = [
  {
    date: '2026-07-17',
    exams: [
      { exam_id: 'fe', exam_label: '2024年 春期', count: 5 },
    ],
  },
  {
    date: '2026-07-15',
    exams: [
      { exam_id: 'fe', exam_label: '2024年 春期', count: 3 },
      { exam_id: 'ap', exam_label: '2024年 秋期', count: 2 },
    ],
  },
]

function renderRecordPage() {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    if (url === '/api/study-days/history') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHistory) })
    }
    if (url === '/api/study-days') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ dates: ['2026-07-17', '2026-07-15'], streak_days: 1, last_study_date: '2026-07-17' }),
      })
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
  }))

  return render(
    <MemoryRouter>
      <StudyProvider>
        <RecordPage />
      </StudyProvider>
    </MemoryRouter>
  )
}

describe('RecordPage - 学習履歴カレンダー', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('カレンダーが表示される', async () => {
    renderRecordPage()
    expect(screen.getByText('今月の学習日')).toBeDefined()
  })

  it('学習した日付のセルにデータ属性が付く', async () => {
    renderRecordPage()

    await waitFor(() => {
      const studied = document.querySelectorAll('[data-studied="true"]')
      expect(studied.length).toBeGreaterThan(0)
    })
  })

  it('学習日をクリックすると詳細が表示される', async () => {
    renderRecordPage()

    await waitFor(() => {
      const studied = document.querySelector('[data-studied="true"]')
      expect(studied).not.toBeNull()
      fireEvent.click(studied!)
      expect(screen.getByTestId('day-detail')).toBeDefined()
    })
  })

  it('詳細に試験名と問題数が表示される', async () => {
    renderRecordPage()

    await waitFor(() => {
      const studied = document.querySelector('[data-studied="true"]')
      expect(studied).not.toBeNull()
      fireEvent.click(studied!)
      expect(screen.getByTestId('day-detail').textContent).toContain('5')
    })
  })
})
