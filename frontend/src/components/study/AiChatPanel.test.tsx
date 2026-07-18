import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { AiChatPanel } from './AiChatPanel'
import type { Question } from '../../types'

const mockQuestion: Question = {
  id: 'fe-1',
  examId: 'fe',
  examLabel: '2024年 春期',
  category: 'コンピュータ構成',
  number: 1,
  totalCount: 10,
  body: 'CPUの役割として正しいものはどれか。',
  choices: [{ label: 'ア', text: '演算・制御を担当する', isCorrect: true }],
  illustration: null,
  points: [{ icon: 'target', text: '重要ポイント' }],
  explanation: [{ title: '解説', body: 'CPU は演算・制御を担当する。' }],
}

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn())
})

describe('AiChatPanel', () => {
  it('チャット入力欄と送信ボタンが表示される', () => {
    render(<AiChatPanel question={mockQuestion} />)
    expect(screen.getByPlaceholderText(/質問を入力/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /送信/ })).toBeInTheDocument()
  })

  it('メッセージを入力して送信すると POST /api/chat が呼ばれる', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ point: 'ポイント', explanation: '解説です' }),
    } as Response)

    render(<AiChatPanel question={mockQuestion} />)

    fireEvent.change(screen.getByPlaceholderText(/質問を入力/), {
      target: { value: 'もっと詳しく教えてください' },
    })
    fireEvent.click(screen.getByRole('button', { name: /送信/ }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          message: 'もっと詳しく教えてください',
          context: {
            body: mockQuestion.body,
            choices: mockQuestion.choices,
            points: mockQuestion.points,
            explanation: mockQuestion.explanation,
          },
          history: [],
        }),
      }))
    })
  })

  it('送信後に AI のポイントと解説がチャット履歴に表示される', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ point: '🔵 CPU → 🔄 演算', explanation: 'CPUは中央処理装置です' }),
    } as Response)

    render(<AiChatPanel question={mockQuestion} />)

    fireEvent.change(screen.getByPlaceholderText(/質問を入力/), {
      target: { value: 'CPUとは何ですか' },
    })
    fireEvent.click(screen.getByRole('button', { name: /送信/ }))

    await waitFor(() => {
      expect(screen.getByText('🔵 CPU → 🔄 演算')).toBeInTheDocument()
      expect(screen.getByText('CPUは中央処理装置です')).toBeInTheDocument()
    })
    expect(screen.getByText('CPUとは何ですか')).toBeInTheDocument()
  })

  it('送信後に入力欄がクリアされる', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ point: 'P', explanation: 'E' }),
    } as Response)

    render(<AiChatPanel question={mockQuestion} />)
    const input = screen.getByPlaceholderText(/質問を入力/)

    fireEvent.change(input, { target: { value: '質問' } })
    fireEvent.click(screen.getByRole('button', { name: /送信/ }))

    await waitFor(() => {
      expect((input as HTMLTextAreaElement).value).toBe('')
    })
  })

  it('チャット履歴が localStorage に保存される', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ point: 'ポイント', explanation: 'AIの返答' }),
    } as Response)

    render(<AiChatPanel question={mockQuestion} />)

    fireEvent.change(screen.getByPlaceholderText(/質問を入力/), {
      target: { value: 'テスト質問' },
    })
    fireEvent.click(screen.getByRole('button', { name: /送信/ }))

    await waitFor(() => {
      expect(screen.getByText('AIの返答')).toBeInTheDocument()
    })

    const stored = localStorage.getItem(`chat_history_${mockQuestion.id}`)
    expect(stored).not.toBeNull()
    const history = JSON.parse(stored!)
    expect(history).toHaveLength(2)
    expect(history[0]).toMatchObject({ role: 'user', text: 'テスト質問' })
    expect(history[1]).toMatchObject({ role: 'ai', point: 'ポイント', explanation: 'AIの返答' })
  })

  it('マウント時に localStorage からチャット履歴を復元する', () => {
    const existingHistory = [
      { role: 'user', text: '前回の質問' },
      { role: 'ai', point: '前回のポイント', explanation: '前回の返答' },
    ]
    localStorage.setItem(`chat_history_${mockQuestion.id}`, JSON.stringify(existingHistory))

    render(<AiChatPanel question={mockQuestion} />)

    expect(screen.getByText('前回の質問')).toBeInTheDocument()
    expect(screen.getByText('前回のポイント')).toBeInTheDocument()
    expect(screen.getByText('前回の返答')).toBeInTheDocument()
  })
})
