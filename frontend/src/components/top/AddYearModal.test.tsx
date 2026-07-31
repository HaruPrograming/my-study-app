import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { AddYearModal } from './AddYearModal'

const mockStartProcessing = vi.fn()
const mockRefreshData = vi.fn()
vi.mock('../../context/StudyContext', () => ({
  useStudyContext: () => ({ startProcessing: mockStartProcessing, refreshData: mockRefreshData }),
}))

const makePdf = (name: string) =>
  new File(['%PDF-1.4'], name, { type: 'application/pdf' })

beforeEach(() => {
  vi.clearAllMocks()
  globalThis.fetch = vi.fn()
})

describe('AddYearModal - PDFタブ', () => {
  it('問題PDFボタンをクリックすると hidden file input がトリガーされる', () => {
    render(<AddYearModal examId="fe" onClose={vi.fn()} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click')
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
    fireEvent.click(screen.getByText('保存して読み込む'))
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('保存ボタンクリックで /api/pdfs/upload に FormData を送信する', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ upload_id: 1, status: 'pending' }),
    } as Response)

    render(<AddYearModal examId="fe" onClose={vi.fn()} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [makePdf('q.pdf')] } })
    fireEvent.change(screen.getByPlaceholderText('例：2024年 春期'), { target: { value: '2024年春' } })
    fireEvent.click(screen.getByText('保存して読み込む'))

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/pdfs/upload',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    ))
  })

  it('API 成功後に startProcessing が呼ばれモーダルが閉じる', async () => {
  const onClose = vi.fn()
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ upload_id: 1, folder_id: 1, status: 'pending' }),
    } as Response)

    render(<AddYearModal examId="fe" onClose={onClose} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [makePdf('q.pdf')] } })
    fireEvent.change(screen.getByPlaceholderText('例：2024年 春期'), { target: { value: '2024年春' } })
    fireEvent.click(screen.getByText('保存して読み込む'))

    await waitFor(() => {
      expect(mockStartProcessing).toHaveBeenCalledWith(
        expect.objectContaining({ uploadId: 1, examId: 'fe', folderId: 1, folderName: '2024年春' })
      )
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('API エラー時にエラーメッセージが表示される', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ message: 'エラー' }),
    } as Response)

    render(<AddYearModal examId="fe" onClose={vi.fn()} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [makePdf('q.pdf')] } })
    fireEvent.change(screen.getByPlaceholderText('例：2024年 春期'), { target: { value: '2024年春' } })
    fireEvent.click(screen.getByText('保存して読み込む'))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })

  it('PDF アップロードで 409 のとき「このPDFはすでに登録済みです」が表示される', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ message: 'このPDFはすでに登録済みです' }),
    } as Response)

    render(<AddYearModal examId="fe" onClose={vi.fn()} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [makePdf('q.pdf')] } })
    fireEvent.change(screen.getByPlaceholderText('例：2024年 春期'), { target: { value: '2024年春' } })
    fireEvent.click(screen.getByText('保存して読み込む'))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('このPDFはすでに登録済みです')
    )
  })
})

describe('AddYearModal - AI生成タブ', () => {
  it('「AI 生成」タブが表示される', () => {
    render(<AddYearModal examId="fe" onClose={vi.fn()} />)
    expect(screen.getByRole('tab', { name: 'AI 生成' })).toBeInTheDocument()
  })

  it('「AI 生成」タブをクリックするとテキストエリアが表示される', () => {
    render(<AddYearModal examId="fe" onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('tab', { name: 'AI 生成' }))
    expect(screen.getByPlaceholderText(/生成してください/)).toBeInTheDocument()
  })

  it('プロンプト入力後に生成ボタンクリックで /api/ai-generate に POST する', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ upload_id: 2, status: 'pending' }),
    } as Response)

    render(<AddYearModal examId="fe" onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('tab', { name: 'AI 生成' }))

    fireEvent.change(screen.getByPlaceholderText('例：2024年 春期'), { target: { value: '2024年春' } })
    fireEvent.change(screen.getByPlaceholderText(/生成してください/), {
      target: { value: '基本情報技術者試験 2024年春期 レベルの問題を生成してください' },
    })
    fireEvent.click(screen.getByText('AI で問題を生成'))

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/ai-generate',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('基本情報技術者試験 2024年春期 レベルの問題を生成してください'),
      }),
    ))
  })

  it('AI 生成 API 成功後に startProcessing が呼ばれモーダルが閉じる', async () => {
    const onClose = vi.fn()
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ upload_id: 2, folder_id: 2, status: 'pending' }),
    } as Response)

    render(<AddYearModal examId="fe" onClose={onClose} />)
    fireEvent.click(screen.getByRole('tab', { name: 'AI 生成' }))
    fireEvent.change(screen.getByPlaceholderText('例：2024年 春期'), { target: { value: '2024年春' } })
    fireEvent.change(screen.getByPlaceholderText(/生成してください/), {
      target: { value: 'テスト問題を生成してください' },
    })
    fireEvent.click(screen.getByText('AI で問題を生成'))

    await waitFor(() => {
      expect(mockStartProcessing).toHaveBeenCalledWith(
        expect.objectContaining({ uploadId: 2, examId: 'fe', folderId: 2, folderName: '2024年春' })
      )
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('AI 生成で 409 のとき「このフォルダはすでに登録済みです」が表示される', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ message: 'このフォルダはすでに登録済みです' }),
    } as Response)

    render(<AddYearModal examId="fe" onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('tab', { name: 'AI 生成' }))
    fireEvent.change(screen.getByPlaceholderText('例：2024年 春期'), { target: { value: '2024年春' } })
    fireEvent.change(screen.getByPlaceholderText(/生成してください/), {
      target: { value: '問題を生成してください' },
    })
    fireEvent.click(screen.getByText('AI で問題を生成'))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('このフォルダはすでに登録済みです')
    )
  })
})

describe('AddYearModal - ファイル作成タブ', () => {
  it('「ファイル作成」タブが表示される', () => {
    render(<AddYearModal examId="fe" onClose={vi.fn()} />)
    expect(screen.getByRole('tab', { name: 'ファイル作成' })).toBeInTheDocument()
  })

  it('「ファイル作成」タブをクリックすると説明文が表示される', () => {
    render(<AddYearModal examId="fe" onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('tab', { name: 'ファイル作成' }))
    expect(screen.getByText(/空のフォルダを作成します/)).toBeInTheDocument()
  })

  it('タイトルが空のときはフォルダ作成ボタンを押しても fetch しない', () => {
    render(<AddYearModal examId="fe" onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('tab', { name: 'ファイル作成' }))
    fireEvent.click(screen.getByText('フォルダを作成'))
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('フォルダ作成成功後に refreshData が呼ばれモーダルが閉じる', async () => {
    const onClose = vi.fn()
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, name: '2024年春' }),
    } as Response)

    render(<AddYearModal examId="fe" onClose={onClose} />)
    fireEvent.click(screen.getByRole('tab', { name: 'ファイル作成' }))
    fireEvent.change(screen.getByPlaceholderText('例：2024年 春期'), { target: { value: '2024年春' } })
    fireEvent.click(screen.getByText('フォルダを作成'))

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/folders',
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ exam_id: 'fe', name: '2024年春' }) }),
      )
      expect(mockRefreshData).toHaveBeenCalled()
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('フォルダ作成 API エラー時にエラーメッセージが表示される', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ message: 'このフォルダはすでに登録済みです' }),
    } as Response)

    render(<AddYearModal examId="fe" onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('tab', { name: 'ファイル作成' }))
    fireEvent.change(screen.getByPlaceholderText('例：2024年 春期'), { target: { value: '2024年春' } })
    fireEvent.click(screen.getByText('フォルダを作成'))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('このフォルダはすでに登録済みです')
    )
  })
})
