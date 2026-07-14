import { useStudyContext } from '../../context/StudyContext'

export function ProcessingIndicator() {
  const { processingUploads } = useStudyContext()
  if (processingUploads.length === 0) return null

  const label = processingUploads.length === 1
    ? processingUploads[0].examLabel
    : `${processingUploads.length}件`

  return (
    <div className="fixed top-3 right-3 z-50 flex items-center gap-2 rounded-full px-3.5 py-2"
      style={{ background: '#fff', border: '1.5px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }}>
      <div className="w-3.5 h-3.5 rounded-full border-2"
        style={{ borderColor: 'var(--surface2)', borderTopColor: 'var(--accent)', animation: 'spin .8s linear infinite' }} />
      <span className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>
        {label} 解析中…
      </span>
    </div>
  )
}
