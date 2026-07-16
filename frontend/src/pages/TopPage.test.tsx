import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { TopPage } from './TopPage'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockExams = [
  {
    id: 'fe',
    name: '基本情報技術者',
    shortName: 'FE',
    color: 'green' as const,
    isLocked: false,
    years: [
      {
        id: 'upload-1',
        label: '2023年度春期',
        season: 'spring' as const,
        isNew: false,
        completedCount: 3,
        totalCount: 10,
      },
      {
        id: 'upload-2',
        label: '2022年度秋期',
        season: 'autumn' as const,
        isNew: false,
        completedCount: 0,
        totalCount: 10,
      },
    ],
  },
]

vi.mock('../context/StudyContext', () => ({
  useStudyContext: () => ({
    streakDays: 5,
    completedQuestions: 42,
    overallProgress: 20,
    exams: mockExams,
    processingUploads: [],
    completeQuestion: vi.fn(),
    addStudyDay: vi.fn(),
    addYearEntry: vi.fn(),
    startProcessing: vi.fn(),
  }),
}))

function renderTopPage() {
  return render(
    <MemoryRouter>
      <TopPage />
    </MemoryRouter>
  )
}

describe('TopPage - 続きから始めるボタン', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('年度カードを選択すると「最初から」ボタンが表示される', async () => {
    const user = userEvent.setup()
    renderTopPage()

    await user.click(screen.getByText('2023年度春期'))

    expect(screen.getByRole('button', { name: /最初から/ })).toBeInTheDocument()
  })

  it('completedCount > 0 の年度を選択すると「続きから」ボタンが表示される', async () => {
    const user = userEvent.setup()
    renderTopPage()

    await user.click(screen.getByText('2023年度春期'))

    expect(screen.getByRole('button', { name: /続きから/ })).toBeInTheDocument()
  })

  it('completedCount === 0 の年度を選択すると「続きから」ボタンが表示されない', async () => {
    const user = userEvent.setup()
    renderTopPage()

    await user.click(screen.getByText('2022年度秋期'))

    expect(screen.queryByRole('button', { name: /続きから/ })).not.toBeInTheDocument()
  })

  it('「続きから」をクリックすると startIndex 付きのパスに遷移する', async () => {
    const user = userEvent.setup()
    renderTopPage()

    await user.click(screen.getByText('2023年度春期'))
    await user.click(screen.getByRole('button', { name: /続きから/ }))

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('startIndex=3')
    )
  })

  it('「最初から」をクリックすると startIndex なしのパスに遷移する', async () => {
    const user = userEvent.setup()
    renderTopPage()

    await user.click(screen.getByText('2023年度春期'))
    await user.click(screen.getByRole('button', { name: /最初から/ }))

    const calledArg: string = mockNavigate.mock.calls[0][0]
    expect(calledArg).not.toContain('startIndex')
  })
})
