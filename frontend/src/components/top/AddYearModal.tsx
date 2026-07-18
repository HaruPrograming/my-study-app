import { useState, useRef, useEffect } from 'react'
import { FileIcon, DocumentIcon } from '../icons'
import { useStudyContext } from '../../context/StudyContext'

type Props = { examId: string; onClose: () => void }
type Tab = 'pdf' | 'ai'

export function AddYearModal({ examId, onClose }: Props) {
  const { startProcessing } = useStudyContext()
  const [tab, setTab] = useState<Tab>('pdf')
  const [title, setTitle] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [answerFile, setAnswerFile] = useState<File | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const overlayRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const answerFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSave = async () => {
    if (!title || !pdfFile) return
    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('question_pdf', pdfFile)
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
      if (!res.ok) throw new Error((data.message as string) ?? 'アップロードに失敗しました。')

      startProcessing({ uploadId: data.upload_id as number, examId, examLabel: title })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'アップロードに失敗しました。もう一度お試しください。')
      setUploading(false)
    }
  }

  const handleAiGenerate = async () => {
    if (!title || !aiPrompt) return
    setUploading(true)
    setError('')

    try {
      const res = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt: aiPrompt, title, exam_id: examId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error((data.message as string) ?? 'AI 生成に失敗しました。')

      startProcessing({ uploadId: data.upload_id as number, examId, examLabel: title })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI 生成に失敗しました。もう一度お試しください。')
      setUploading(false)
    }
  }

  const tabStyle = (t: Tab) => ({
    flex: 1,
    height: 36,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: tab === t ? 700 : 500,
    background: tab === t ? 'var(--accent)' : 'transparent',
    color: tab === t ? '#fff' : 'var(--muted)',
    border: 'none',
    cursor: 'pointer',
  })

  return (
    <div ref={overlayRef} className="fixed inset-0 flex items-end justify-center z-50" style={{ background: 'rgba(0,0,0,0.42)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}>
      <div className="w-full bg-white rounded-t-[22px] px-5" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
        <div className="w-9 h-1 rounded-full mx-auto mt-3 mb-4" style={{ background: '#DDD' }} />
        <div className="text-[15px] font-extrabold mb-3" style={{ color: 'var(--text)' }}>年度を追加</div>

        <div className="flex gap-1 mb-4 p-1 rounded-[10px]" style={{ background: 'var(--surface)' }}>
          <button role="tab" aria-selected={tab === 'pdf'} onClick={() => setTab('pdf')} style={tabStyle('pdf')}>
            PDF アップロード
          </button>
          <button role="tab" aria-selected={tab === 'ai'} onClick={() => setTab('ai')} style={tabStyle('ai')}>
            AI 生成
          </button>
        </div>

        <div className="text-[10px] font-bold tracking-wider mb-1" style={{ color: 'var(--muted)' }}>タイトル</div>
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="例：2024年 春期"
          className="w-full h-10 rounded-[10px] px-3 text-[13px] mb-3 outline-none"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text)' }} />

        {tab === 'pdf' ? (
          <>
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
          </>
        ) : (
          <>
            <div className="text-[10px] font-bold tracking-wider mb-1" style={{ color: 'var(--muted)' }}>生成指示</div>
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="例：基本情報技術者試験 2024年春期 レベルの問題を20問生成してください"
              rows={4}
              className="w-full rounded-[10px] px-3 py-2.5 text-[13px] mb-3 outline-none resize-none"
              style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text)' }}
            />
            <div className="text-[11px] mb-2" style={{ color: 'var(--muted)' }}>
              最新のWeb情報を検索して、高精度な問題を自動生成します。生成には数分かかります。
            </div>
          </>
        )}

        {error && (
          <div role="alert" className="text-[12px] rounded-[8px] px-3 py-2 mb-2"
            style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
            {error}
          </div>
        )}

        <div className="flex gap-2 mt-1.5">
          <button onClick={onClose} disabled={uploading} className="flex-1 h-11 rounded-[12px] text-[13px] font-semibold disabled:opacity-50"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
            キャンセル
          </button>
          {tab === 'pdf' ? (
            <button onClick={handleSave} disabled={!title || !pdfFile || uploading}
              className="flex-[2] h-11 rounded-[12px] text-[13px] font-bold text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}>
              {uploading ? 'アップロード中…' : '保存して読み込む'}
            </button>
          ) : (
            <button onClick={handleAiGenerate} disabled={!title || !aiPrompt || uploading}
              className="flex-[2] h-11 rounded-[12px] text-[13px] font-bold text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}>
              {uploading ? '生成中…' : 'AI で問題を生成'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
