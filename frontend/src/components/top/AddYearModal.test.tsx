import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { AddYearModal } from './AddYearModal'

const mockAddYearEntry = vi.fn()
vi.mock('../../context/StudyContext', () => ({
  useStudyContext: () => ({ addYearEntry: mockAddYearEntry }),
}))

const makePdf = (name: string) =>
  new File(['%PDF-1.4'], name, { type: 'application/pdf' })

beforeEach(() => {
  vi.clearAllMocks()
  global.fetch = vi.fn()
})

describe('AddYearModal', () => {
  it('問題PDFボタンをクリックすると hidden file input がトリガーされる', () => {
    render(<AddYearModal examId="fe" onClose={vi.fn()} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click')
    // 問題 PDF セクションのボタン（"問題PDFを選択" テキストを含む方）
    const qPdfButton = screen.getByText('問題PDFを選択').closest('button')!
    fireEvent.click(qPdfButton)
    expect(clickSpy).toHaveBeenCalled()
  })

  it('ファイルを選択するとファイル名が表示される', () => {
    render(<AddYearModal examId="fe" onClose={vi.fn()} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [makePdf('2024spring.pdf')] } })
    expect(screen.getByText('2024spring.pdf')).toBeInTheDocument()
  })

  it('タイトルが空のときは保存ボタンを押しても fetch しない', () => {
    render(<AddYearModal examId="fe" onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('保存 → 解説を自動生成'))
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('保存ボタンクリックで /api/pdfs/upload に FormData を送信する', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ title: '2024年春', exam_id: 'fe', question_text: 'Q1', answer_text: '' }),
    } as Response)

    render(<AddYearModal examId="fe" onClose={vi.fn()} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [makePdf('q.pdf')] } })
    fireEvent.change(screen.getByPlaceholderText('例：2024年 春期'), { target: { value: '2024年春' } })
    fireEvent.click(screen.getByText('保存 → 解説を自動生成'))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      '/api/pdfs/upload',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    ))
  })

  it('API 成功後に addYearEntry が呼ばれモーダルが閉じる', async () => {
    const onClose = vi.fn()
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ title: '2024年春', exam_id: 'fe', question_text: 'Q1', answer_text: '' }),
    } as Response)

    render(<AddYearModal examId="fe" onClose={onClose} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [makePdf('q.pdf')] } })
    fireEvent.change(screen.getByPlaceholderText('例：2024年 春期'), { target: { value: '2024年春' } })
    fireEvent.click(screen.getByText('保存 → 解説を自動生成'))

    await waitFor(() => {
      expect(mockAddYearEntry).toHaveBeenCalledWith('fe', expect.objectContaining({ label: '2024年春' }))
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('API エラー時にエラーメッセージが表示される', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 422,
    } as Response)

    render(<AddYearModal examId="fe" onClose={vi.fn()} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [makePdf('q.pdf')] } })
    fireEvent.change(screen.getByPlaceholderText('例：2024年 春期'), { target: { value: '2024年春' } })
    fireEvent.click(screen.getByText('保存 → 解説を自動生成'))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })
})
