import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { StudyPage } from './StudyPage'
import { StudyProvider } from '../context/StudyContext'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockQuestion1 = {
  id: 'fe-1',
  examId: 'fe',
  examLabel: '202305',
  category: 'コンピュータ構成',
  number: 1,
  totalCount: 2,
  body: '1問目の問題文',
  choices: [
    { label: 'ア', text: '選択肢A', isCorrect: true },
    { label: 'イ', text: '選択肢B', isCorrect: false },
  ],
  illustration: null,
  points: [{ icon: 'target' as const, text: 'ポイント1' }],
  explanation: null,
}

const mockQuestionWithExplanation = {
  ...mockQuestion1,
  explanation: [
    { title: '役割', body: 'CPUは演算・制御を担当する。' },
    { title: '構成', body: 'ALUと制御装置から成る。' },
    { title: '特徴', body: 'クロック周波数が高いほど速い。' },
  ],
}

const mockQuestion2 = {
  ...mockQuestion1,
  id: 'fe-2',
  number: 2,
  body: '2問目の問題文',
}

function renderStudyPage(examId = 'fe', examLabel = '202305', query = '') {
  return render(
    <MemoryRouter initialEntries={[`/study/${examId}/${examLabel}${query}`]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <StudyProvider>
        <Routes>
          <Route path="/study/:examId/:examLabel" element={<StudyPage />} />
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
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockQuestion1]),
    } as Response))

    renderStudyPage()

    await waitFor(() => {
      expect(screen.getByText('1問目の問題文')).toBeInTheDocument()
    })
    expect(fetch).toHaveBeenCalledWith('/api/questions/fe/202305')
  })

  it('ローディング中はスピナーを表示する', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))

    renderStudyPage()

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('API が空配列を返した場合は「問題が見つかりません」を表示する', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response))

    renderStudyPage()

    await waitFor(() => {
      expect(screen.getByText('問題が見つかりません')).toBeInTheDocument()
    })
  })

  it('1問目では「前へ」ボタンを表示しない', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockQuestion1, mockQuestion2]),
    } as Response))

    renderStudyPage()

    await waitFor(() => {
      expect(screen.getByText('1問目の問題文')).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /前へ/ })).not.toBeInTheDocument()
  })

  it('2問目以降では「前へ」ボタンを表示する', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockQuestion1, mockQuestion2]),
    } as Response))

    renderStudyPage()

    await waitFor(() => {
      expect(screen.getByText('1問目の問題文')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /次へ/ }))

    expect(screen.getByText('2問目の問題文')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /前へ/ })).toBeInTheDocument()
  })

  it('「前へ」ボタンをクリックすると前の問題に戻る', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockQuestion1, mockQuestion2]),
    } as Response))

    renderStudyPage()

    await waitFor(() => {
      expect(screen.getByText('1問目の問題文')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /次へ/ }))
    expect(screen.getByText('2問目の問題文')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /前へ/ }))
    expect(screen.getByText('1問目の問題文')).toBeInTheDocument()
  })

  it('explanation が配列の場合、各カードのタイトルと本文を表示する', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockQuestionWithExplanation]),
    } as Response))

    renderStudyPage()

    await waitFor(() => {
      expect(screen.getByText('1問目の問題文')).toBeInTheDocument()
    })

    expect(screen.getByText('役割')).toBeInTheDocument()
    expect(screen.getByText('CPUは演算・制御を担当する。')).toBeInTheDocument()
    expect(screen.getByText('構成')).toBeInTheDocument()
    expect(screen.getByText('特徴')).toBeInTheDocument()
  })

  it('startIndex クエリパラメータが指定された場合、その問題から開始する', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockQuestion1, mockQuestion2]),
    } as Response))

    renderStudyPage('fe', '202305', '?startIndex=1')

    await waitFor(() => {
      expect(screen.getByText('2問目の問題文')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /前へ/ })).toBeInTheDocument()
  })

  it('explanation が null の場合、解説セクションを表示しない', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockQuestion1]),
    } as Response))

    renderStudyPage()

    await waitFor(() => {
      expect(screen.getByText('1問目の問題文')).toBeInTheDocument()
    })

    expect(screen.queryByText('解説')).not.toBeInTheDocument()
  })

  it('「AI質問」タブが表示される', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockQuestion1]),
    } as Response))

    renderStudyPage()

    await waitFor(() => {
      expect(screen.getByText('1問目の問題文')).toBeInTheDocument()
    })

    expect(screen.getByRole('tab', { name: 'AI質問' })).toBeInTheDocument()
  })

  it('「AI質問」タブをクリックするとチャット入力欄が表示される', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockQuestion1]),
    } as Response))

    const user = userEvent.setup()
    renderStudyPage()

    await waitFor(() => {
      expect(screen.getByText('1問目の問題文')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('tab', { name: 'AI質問' }))

    expect(screen.getByPlaceholderText(/質問を入力/)).toBeInTheDocument()
  })

  it('インプットモード（?mode=input）では選択肢が正解スタイルで即時表示される', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockQuestion1]),
    } as Response))

    renderStudyPage('fe', '202305', '?mode=input')

    await waitFor(() => {
      expect(screen.getByText('1問目の問題文')).toBeInTheDocument()
    })

    // 正解選択肢（ア）が正解スタイルで表示される（data-correct 属性で確認）
    expect(screen.getByTestId('choice-ア')).toHaveAttribute('data-correct', 'true')
  })

  it('アウトプットモード（?mode=output）では選択肢の正解スタイルが非表示', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockQuestion1]),
    } as Response))

    renderStudyPage('fe', '202305', '?mode=output')

    await waitFor(() => {
      expect(screen.getByText('1問目の問題文')).toBeInTheDocument()
    })

    // 選択前は正解スタイルなし
    expect(screen.getByTestId('choice-ア')).toHaveAttribute('data-correct', 'false')
    expect(screen.getByTestId('choice-イ')).toHaveAttribute('data-correct', 'false')
  })

  it('アウトプットモードでは「次へ」ボタンが選択前は非活性', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockQuestion1]),
    } as Response))

    renderStudyPage('fe', '202305', '?mode=output')

    await waitFor(() => {
      expect(screen.getByText('1問目の問題文')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /次へ/ })).toBeDisabled()
  })

  it('アウトプットモードで選択肢をクリックすると「次へ」が活性化する', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockQuestion1]),
    } as Response))

    renderStudyPage('fe', '202305', '?mode=output')

    await waitFor(() => {
      expect(screen.getByText('1問目の問題文')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('choice-ア'))

    expect(screen.getByRole('button', { name: /次へ/ })).not.toBeDisabled()
  })

  it('アウトプットモードで正解をクリックすると正解フィードバックが表示される', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockQuestion1]),
    } as Response))

    renderStudyPage('fe', '202305', '?mode=output')

    await waitFor(() => {
      expect(screen.getByText('1問目の問題文')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('choice-ア'))

    expect(screen.getByTestId('choice-ア')).toHaveAttribute('data-correct', 'true')
  })

  it('アウトプットモードで不正解をクリックすると不正解フィードバック＋正解が表示される', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockQuestion1]),
    } as Response))

    renderStudyPage('fe', '202305', '?mode=output')

    await waitFor(() => {
      expect(screen.getByText('1問目の問題文')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('choice-イ'))

    // 不正解選択肢は data-wrong=true、正解は data-correct=true
    expect(screen.getByTestId('choice-イ')).toHaveAttribute('data-wrong', 'true')
    expect(screen.getByTestId('choice-ア')).toHaveAttribute('data-correct', 'true')
  })

  it('学習中にインプット/アウトプットトグルが表示される', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockQuestion1]),
    } as Response))

    renderStudyPage('fe', '202305', '?mode=input')

    await waitFor(() => {
      expect(screen.getByText('1問目の問題文')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: 'インプット' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'アウトプット' })).toBeInTheDocument()
  })

  it('学習中にアウトプット→インプット切替で正解が即時表示される', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockQuestion1]),
    } as Response))

    renderStudyPage('fe', '202305', '?mode=output')

    await waitFor(() => {
      expect(screen.getByText('1問目の問題文')).toBeInTheDocument()
    })

    // アウトプットモードでは正解スタイル非表示
    expect(screen.getByTestId('choice-ア')).toHaveAttribute('data-correct', 'false')

    // インプットに切り替え
    await user.click(screen.getByRole('button', { name: 'インプット' }))

    // 正解が即時表示される
    expect(screen.getByTestId('choice-ア')).toHaveAttribute('data-correct', 'true')
  })

  it('「ポイント・解説」タブをクリックするとポイントが表示される', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockQuestion1]),
    } as Response))

    const user = userEvent.setup()
    renderStudyPage()

    await waitFor(() => {
      expect(screen.getByText('1問目の問題文')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('tab', { name: 'AI質問' }))
    await user.click(screen.getByRole('tab', { name: 'ポイント・解説' }))

    expect(screen.getByText('ポイント1')).toBeInTheDocument()
  })
})
