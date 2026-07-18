import { useState } from 'react'
import { useStudyContext } from '../../context/StudyContext'

type Props = {
  examId: number
  examName: string
  onClose: () => void
}

export function DeleteExamModal({ examId, examName, onClose }: Props) {
  const { refreshData } = useStudyContext()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/exams/${examId}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error('削除に失敗しました。')
      refreshData()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '削除に失敗しました。')
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[18px] p-5"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-[15px] font-bold mb-1" style={{ color: 'var(--text)' }}>
          資格を削除
        </div>
        <div className="text-[13px] mb-3" style={{ color: 'var(--muted)' }}>
          <span style={{ color: 'var(--text)', fontWeight: 700 }}>{examName}</span> を削除しますか？
        </div>

        <div className="rounded-[10px] px-3 py-2.5 mb-4 text-[11px]" style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>
          ⚠️ この操作は取り消せません。関連するPDF・問題・進捗データもすべて削除されます。
        </div>

        {error && (
          <div className="mb-3 text-[12px] rounded-[8px] px-3 py-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-[44px] rounded-[10px] text-[13px] font-bold"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            キャンセル
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 h-[44px] rounded-[10px] text-[13px] font-bold text-white"
            style={{ background: '#EF4444', opacity: deleting ? 0.6 : 1 }}>
            {deleting ? '削除中...' : '削除する'}
          </button>
        </div>
      </div>
    </div>
  )
}
