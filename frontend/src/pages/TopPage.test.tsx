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
    dbId: 1,
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
      {
        id: 'upload-3',
        label: '2021年度春期',
        season: 'spring' as const,
        isNew: false,
        completedCount: 10,
        totalCount: 10,
      },
    ],
  },
  {
    id: 'ip',
    dbId: 2,
    name: 'ITパスポート',
    shortName: 'IP',
    color: 'blue' as const,
    isLocked: false,
    years: [
      {
        id: 'upload-ip-1',
        label: '2024年度春期',
        season: 'spring' as const,
        isNew: false,
        completedCount: 5,
        totalCount: 10,
      },
    ],
  },
]

const mockRefreshData = vi.fn()

vi.mock('../context/StudyContext', () => ({
  useStudyContext: () => ({
    streakDays: 5,
    completedQuestions: 42,
    overallProgress: 20,
    exams: mockExams,
    processingUploads: [],
    completeQuestion: vi.fn(),
    resetProgress: vi.fn(),
    addStudyDay: vi.fn(),
    addYearEntry: vi.fn(),
    startProcessing: vi.fn(),
    refreshData: mockRefreshData,
  }),
}))

function renderTopPage() {
  return render(
    <MemoryRouter>
      <TopPage />
    </MemoryRouter>
  )
}

function renderTopPageWithState(state: Record<string, unknown>) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/', state }]}>
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

describe('TopPage - 中断後の資格選択', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('location.state に examId がない場合は最初の資格（fe）が選択される', () => {
    renderTopPage()
    expect(screen.getByText('2023年度春期')).toBeInTheDocument()
  })

  it('location.state.examId が渡された場合はその資格が選択される', () => {
    renderTopPageWithState({ examId: 'ip' })
    expect(screen.getByText('2024年度春期')).toBeInTheDocument()
  })
})

describe('TopPage - 100%完了後の遷移', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('completedCount === totalCount のとき「もう一度」ボタンが表示される', async () => {
    const user = userEvent.setup()
    renderTopPage()

    await user.click(screen.getByText('2021年度春期'))

    expect(screen.getByRole('button', { name: /もう一度/ })).toBeInTheDocument()
  })

  it('completedCount === totalCount のとき「続きから」ボタンが表示されない', async () => {
    const user = userEvent.setup()
    renderTopPage()

    await user.click(screen.getByText('2021年度春期'))

    expect(screen.queryByRole('button', { name: /続きから/ })).not.toBeInTheDocument()
  })

  it('100%完了後に「もう一度」をクリックすると startIndex なしで遷移する', async () => {
    const user = userEvent.setup()
    renderTopPage()

    await user.click(screen.getByText('2021年度春期'))
    await user.click(screen.getByRole('button', { name: /もう一度/ }))

    const calledArg: string = mockNavigate.mock.calls[0][0]
    expect(calledArg).not.toContain('startIndex')
  })
})

describe('TopPage - インプット/アウトプットモード切り替え', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('年度カードを選択するとインプット/アウトプットトグルが表示される', async () => {
    const user = userEvent.setup()
    renderTopPage()

    await user.click(screen.getByText('2023年度春期'))

    expect(screen.getByRole('button', { name: 'インプット' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'アウトプット' })).toBeInTheDocument()
  })

  it('デフォルトではインプットが選択されている', async () => {
    const user = userEvent.setup()
    renderTopPage()

    await user.click(screen.getByText('2023年度春期'))

    const inputBtn = screen.getByRole('button', { name: 'インプット' })
    expect(inputBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('アウトプットをクリックするとアウトプットが選択状態になる', async () => {
    const user = userEvent.setup()
    renderTopPage()

    await user.click(screen.getByText('2023年度春期'))
    await user.click(screen.getByRole('button', { name: 'アウトプット' }))

    expect(screen.getByRole('button', { name: 'アウトプット' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'インプット' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('インプットモードで開始すると ?mode=input が URL に付与される', async () => {
    const user = userEvent.setup()
    renderTopPage()

    await user.click(screen.getByText('2023年度春期'))
    await user.click(screen.getByRole('button', { name: /続きから/ }))

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('mode=input')
    )
  })

  it('アウトプットモードで開始すると ?mode=output が URL に付与される', async () => {
    const user = userEvent.setup()
    renderTopPage()

    await user.click(screen.getByText('2023年度春期'))
    await user.click(screen.getByRole('button', { name: 'アウトプット' }))
    await user.click(screen.getByRole('button', { name: /続きから/ }))

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('mode=output')
    )
  })
})

describe('TopPage - 資格を追加', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 3, name: 'ITパスポート', short_name: 'ip', color: 'green' }),
    }))
  })

  it('「＋ 資格を追加」ボタンが表示される', () => {
    renderTopPage()
    expect(screen.getByText(/資格を追加/)).toBeInTheDocument()
  })

  it('「＋ 資格を追加」ボタンをクリックするとモーダルが表示される', async () => {
    const user = userEvent.setup()
    renderTopPage()

    await user.click(screen.getByText(/資格を追加/))

    expect(screen.getByLabelText('試験名')).toBeInTheDocument()
  })

  it('モーダルでフォームを入力して送信すると POST /api/exams が呼ばれる', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 3, name: 'ITパスポート', short_name: 'ip', color: 'green' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const user = userEvent.setup()
    renderTopPage()

    await user.click(screen.getByText(/資格を追加/))
    await user.type(screen.getByLabelText('試験名'), 'ITパスポート')
    await user.click(screen.getByRole('button', { name: '追加' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/exams', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('ITパスポート'),
      }))
    })
  })
})
