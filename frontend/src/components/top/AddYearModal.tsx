import { useState, useRef, useEffect } from 'react'
import { FileIcon, DocumentIcon } from '../icons'
import { useStudyContext } from '../../context/StudyContext'
import type { YearEntry } from '../../types'

type Props = { examId: string; onClose: () => void }

export function AddYearModal({ examId, onClose }: Props) {
  const { addYearEntry } = useStudyContext()
  const [title, setTitle] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [answerFile, setAnswerFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [statusText, setStatusText] = useState('アップロード中…')
  const [error, setError] = useState('')
  const overlayRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const answerFileInputRef = useRef<HTMLInputElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [])

  const startPolling = (uploadId: number, examLabel: string) => {
    setStatusText('問題を解析中… しばらくお待ちください')

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/pdfs/${uploadId}/status`, { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json() as {
          status: string
          question_count: number
          error_message?: string
          exam_id: string
          exam_label: string
        }

        if (data.status === 'done') {
          clearInterval(pollingRef.current!)
          const entry: YearEntry = {
            id: `${examId}-${uploadId}`,
            label: data.exam_label ?? examLabel,
            season: examLabel.includes('春') ? 'spring' : 'autumn',
            isNew: true,
            completedCount: 0,
            totalCount: data.question_count,
          }
          addYearEntry(examId, entry)
          onClose()
        } else if (data.status === 'failed') {
          clearInterval(pollingRef.current!)
          setProcessing(false)
          setError(data.error_message ?? 'PDF の処理に失敗しました。もう一度お試しください。')
        }
      } catch {
        // ネットワークエラーは次のポーリングで再試行
      }
    }, 3000)
  }

  const handleSave = async () => {
    if (!title) return
    setProcessing(true)
    setError('')
    setStatusText('アップロード中…')

    const formData = new FormData()
    if (pdfFile) formData.append('question_pdf', pdfFile)
    if (answerFile) formData.append('answer_pdf', answerFile)
    formData.append('title', title)
    formData.append('exam_id', examId)

    try {
      const res = await fetch('/api/pdfs/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      let data: Record<string, unknown> = {}
      try { data = await res.json() } catch { /* HTML レスポンス時は無視 */ }
      if (!res.ok) throw new Error((data.message as string) ?? 'アップロードに失敗しました。もう一度お試しください。')

      startPolling(data.upload_id as number, title)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'アップロードに失敗しました。もう一度お試しください。')
      setProcessing(false)
    }
  }

  return (
    <div ref={overlayRef} className="fixed inset-0 flex items-end justify-center z-50" style={{ background: 'rgba(0,0,0,0.42)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}>
      <div className="w-full bg-white rounded-t-[22px] px-5" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
        <div className="w-9 h-1 rounded-full mx-auto mt-3 mb-4" style={{ background: '#DDD' }} />
        <div className="text-[15px] font-extrabold mb-4" style={{ color: 'var(--text)' }}>年度を追加</div>

        <div className="text-[10px] font-bold tracking-wider mb-1" style={{ color: 'var(--muted)' }}>タイトル</div>
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="例：2024年 春期"
          className="w-full h-10 rounded-[10px] px-3 text-[13px] mb-3 outline-none"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text)' }} />

        <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={e => setPdfFile(e.target.files?.[0] ?? null)} />

        <div className="text-[10px] font-bold tracking-wider mb-1" style={{ color: 'var(--muted)' }}>問題 PDF</div>
        <button onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-[10px] px-3.5 py-3 flex items-center gap-2.5 mb-2.5 cursor-pointer"
          style={{ background: pdfFile ? 'var(--accent-soft)' : 'var(--surface)', border: `1.5px dashed ${pdfFile ? 'var(--accent)' : 'rgba(46,158,91,0.3)'}` }}>
          <FileIcon size={22} color="var(--accent)" />
          <div className="text-left">
            <div className="text-[11px] font-bold" style={{ color: 'var(--accent)' }}>
              {pdfFile ? pdfFile.name : 'タップしてアップロード'}
            </div>
            <div className="text-[12px]" style={{ color: 'var(--muted)' }}>問題PDFを選択</div>
          </div>
        </button>

        <input ref={answerFileInputRef} type="file" accept=".pdf" className="hidden" onChange={e => setAnswerFile(e.target.files?.[0] ?? null)} />

        <div className="text-[10px] font-bold tracking-wider mb-1" style={{ color: 'var(--muted)' }}>解答 PDF</div>
        <button onClick={() => answerFileInputRef.current?.click()}
          className="w-full rounded-[10px] px-3.5 py-3 flex items-center gap-2.5 mb-2.5 cursor-pointer"
          style={{ background: answerFile ? 'var(--accent-soft)' : 'var(--surface)', border: `1.5px dashed ${answerFile ? 'var(--accent)' : 'rgba(46,158,91,0.3)'}` }}>
          <DocumentIcon size={22} color="var(--accent)" />
          <div className="text-left">
            <div className="text-[11px] font-bold" style={{ color: 'var(--accent)' }}>
              {answerFile ? answerFile.name : 'タップしてアップロード'}
            </div>
            <div className="text-[12px]" style={{ color: 'var(--muted)' }}>解答例PDFを選択（任意）</div>
          </div>
        </button>

        {error && (
          <div role="alert" className="text-[12px] rounded-[8px] px-3 py-2 mb-2"
            style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
            {error}
          </div>
        )}

        <div className="flex gap-2 mt-1.5">
          <button onClick={onClose} disabled={processing} className="flex-1 h-11 rounded-[12px] text-[13px] font-semibold disabled:opacity-50"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
            キャンセル
          </button>
          <button onClick={handleSave} disabled={!title || !pdfFile || processing}
            className="flex-[2] h-11 rounded-[12px] text-[13px] font-bold text-white disabled:opacity-50"
            style={{ background: 'var(--accent)' }}>
            保存して読み込む
          </button>
        </div>
      </div>

      {processing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"
          style={{ background: 'rgba(255,255,255,0.92)', zIndex: 200 }}>
          <div className="w-12 h-12 rounded-full border-[3px] border-t-transparent"
            style={{ borderColor: 'var(--surface2)', borderTopColor: 'var(--accent)', animation: 'spin .8s linear infinite' }} />
          <div className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{statusText}</div>
          <div className="text-[12px]" style={{ color: 'var(--muted)' }}>アプリを閉じても処理は継続されます</div>
        </div>
      )}
    </div>
  )
}
