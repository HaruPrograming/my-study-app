import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { StudyPage } from './StudyPage'
import { StudyProvider } from '../context/StudyContext'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockQuestion = {
  id: 'fe-2026s-1',
  examId: 'fe',
  examLabel: '2026年 春期',
  category: 'コンピュータ構成',
  number: 1,
  totalCount: 80,
  body: 'API から取得した問題文',
  choices: [
    { label: 'ア', text: '選択肢A', isCorrect: true },
    { label: 'イ', text: '選択肢B', isCorrect: false },
  ],
  illustration: { nodes: [{ icon: 'cpu', label: 'CPU', highlight: true }], caption: 'テスト図解' },
  points: [{ icon: 'target', text: 'ポイント1' }],
}

function renderStudyPage(examId = 'fe') {
  return render(
    <MemoryRouter initialEntries={[`/study/${examId}`]}>
      <StudyProvider>
        <Routes>
          <Route path="/study/:examId" element={<StudyPage />} />
        </Routes>
      </StudyProvider>
    </MemoryRouter>
  )
}

describe('StudyPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('API から問題を取得して表示する', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockQuestion]),
    } as Response)

    renderStudyPage()

    await waitFor(() => {
      expect(screen.getByText('API から取得した問題文')).toBeInTheDocument()
    })
    expect(fetch).toHaveBeenCalledWith('/api/questions/fe')
  })

  it('ローディング中はスピナーを表示する', () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}))

    renderStudyPage()

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('API が空配列を返した場合は「問題が見つかりません」を表示する', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response)

    renderStudyPage()

    await waitFor(() => {
      expect(screen.getByText('問題が見つかりません')).toBeInTheDocument()
    })
  })
})
