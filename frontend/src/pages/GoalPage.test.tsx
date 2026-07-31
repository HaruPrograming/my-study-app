import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { GoalPage } from './GoalPage'

const mockFetch = vi.fn()
global.fetch = mockFetch

function renderGoalPage() {
  return render(
    <MemoryRouter>
      <GoalPage />
    </MemoryRouter>
  )
}

const sampleGoals = [
  { id: 1, body: '基本情報を1ヶ月で完走する', is_done: false, created_at: '2026-07-31T00:00:00Z' },
  { id: 2, body: '毎日30分学習する', is_done: true, created_at: '2026-07-30T00:00:00Z' },
]

describe('GoalPage', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => sampleGoals,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('目標一覧が表示される', async () => {
    renderGoalPage()
    await waitFor(() => {
      expect(screen.getByText('基本情報を1ヶ月で完走する')).toBeInTheDocument()
      expect(screen.getByText('毎日30分学習する')).toBeInTheDocument()
    })
  })

  it('目標を追加できる', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 3, body: '新しい目標', is_done: false, created_at: '2026-07-31T00:00:00Z' }),
      })

    renderGoalPage()
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))

    const input = screen.getByPlaceholderText(/目標を入力/)
    fireEvent.change(input, { target: { value: '新しい目標' } })
    fireEvent.click(screen.getByRole('button', { name: /追加/ }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/goals', expect.objectContaining({ method: 'POST' }))
    })
  })

  it('完了状態をトグルできる', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => sampleGoals })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...sampleGoals[0], is_done: true }) })

    renderGoalPage()
    await waitFor(() => screen.getByText('基本情報を1ヶ月で完走する'))

    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/goals/1',
        expect.objectContaining({ method: 'PATCH' })
      )
    })
  })

  it('目標を削除できる', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => sampleGoals })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ message: '削除しました' }) })

    renderGoalPage()
    await waitFor(() => screen.getByText('基本情報を1ヶ月で完走する'))

    const deleteButtons = screen.getAllByRole('button', { name: /削除/ })
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/goals/1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })
})
