import { useState, useEffect, useRef } from 'react'
import { useStudyContext } from '../../context/StudyContext'
import type { ExamColor } from '../../types'

type Props = { onClose: () => void }

const COLOR_OPTIONS: { value: ExamColor; label: string; bg: string }[] = [
  { value: 'green',  label: 'グリーン', bg: '#2E9E5B' },
  { value: 'orange', label: 'オレンジ', bg: '#F57C2B' },
  { value: 'blue',   label: 'ブルー',   bg: '#3B82F6' },
  { value: 'purple', label: 'パープル', bg: '#8B5CF6' },
  { value: 'red',    label: 'レッド',   bg: '#EF4444' },
]

export function AddExamModal({ onClose }: Props) {
  const { refreshData } = useStudyContext()
  const [name, setName] = useState('')
  const [shortName, setShortName] = useState('')
  const [color, setColor] = useState<ExamColor>('green')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSubmit = async () => {
    if (!name) return
    setSaving(true)
    setError('')

    try {
      const body: Record<string, string> = { name, color }
      if (shortName) body.short_name = shortName

      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data.message as string) ?? '登録に失敗しました。')
      }
      refreshData()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '登録に失敗しました。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="w-full max-w-md rounded-t-[20px] px-5 pt-5 pb-8"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>資格を追加</div>
          <button onClick={onClose} className="text-[20px] leading-none" style={{ color: 'var(--muted)' }}>×</button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="exam-name" className="block text-[11px] font-bold mb-1" style={{ color: 'var(--muted)' }}>試験名</label>
            <input
              id="exam-name"
              aria-label="試験名"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例: ITパスポート"
              className="w-full rounded-[9px] px-3 py-2.5 text-[13px]"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>

          <div>
            <label htmlFor="exam-short-name" className="block text-[11px] font-bold mb-1" style={{ color: 'var(--muted)' }}>
              略称 <span className="font-normal" style={{ color: 'var(--muted)' }}>（任意・省略可）</span>
            </label>
            <input
              id="exam-short-name"
              aria-label="略称"
              type="text"
              value={shortName}
              onChange={e => setShortName(e.target.value)}
              placeholder="例: ip（省略すると自動設定）"
              className="w-full rounded-[9px] px-3 py-2.5 text-[13px]"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>

          <div>
            <div className="text-[11px] font-bold mb-1.5" style={{ color: 'var(--muted)' }}>カラー</div>
            <div className="flex gap-1.5 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-bold"
                  style={{
                    background: color === c.value ? c.bg : 'var(--surface)',
                    color: color === c.value ? '#fff' : 'var(--muted)',
                    border: `1px solid ${color === c.value ? 'transparent' : 'var(--border)'}`,
                  }}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: color === c.value ? '#fff' : c.bg }} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-3 text-[12px] rounded-[8px] px-3 py-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!name || saving}
          className="mt-4 w-full h-[46px] rounded-[11px] text-[14px] font-bold text-white"
          style={{ background: !name ? 'var(--muted)' : 'var(--accent)', opacity: saving ? 0.6 : 1 }}>
          {saving ? '追加中...' : '追加'}
        </button>
      </div>
    </div>
  )
}
